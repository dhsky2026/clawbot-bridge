/* ============================================================
 * 链接处理器（核心）
 *
 * 路径解析策略（按优先级）：
 *   1. http/https/mailto/blob:      -> 原样，新标签打开
 *   2. 显式根目录（用户设置）+ 相对路径 -> 拼接 root
 *   3. 当前文件所在目录（http:// 服务器模式下 = 服务器根）
 *   4. Windows 绝对路径（C:/... \\server） -> file://
 *
 * 关于 file:// 安全限制：
 *   - 现代浏览器禁止 file:// 页面对其他本地文件跳转
 *   - 解决方案：通过 bridge.html 中转（同一目录）
 *   - 彻底方案：用 start_md_viewer.bat 启动本地服务器（http://）
 * ============================================================ */
(function (global) {
  'use strict';

  var LinkHandler = {
    root: '',            // 显式设置的项目根目录（file:// 或 http://）
    baseDir: '',         // 当前 md 文件的目录
    bridgeUrl: '',       // 桥接页 URL

    /**
     * 显式设置根目录（推荐）
     * @param {string} dir 目录路径，可带或不带末尾斜杠
     */
    setRoot: function (dir) {
      if (!dir) { this.root = ''; return; }
      var d = String(dir).replace(/\\/g, '/');
      if (/^[a-z]:/i.test(d) && d.charAt(0) !== '/') d = '/' + d;
      if (!/^https?:\/\//i.test(d) && !/^file:\/\//i.test(d) && d.charAt(0) !== '/') {
        d = '/' + d;
      }
      d = d.replace(/\/$/, '') + '/';
      this.root = (/^https?:\/\//i.test(d) || /^file:\/\//i.test(d) ? '' : 'file://') + d;
    },

    /**
     * 根据当前 md 文件的 URL 设置基准目录
     * 支持：
     *   - http://127.0.0.1:8765/path/   (本地服务器模式，最推荐)
     *   - blob:http://.../uuid           (FileReader/ObjectURL)
     *   - file:///C:/path/               (Windows)
     */
    setBaseDir: function (fileUrl) {
      try {
        if (!fileUrl) { this.baseDir = ''; return; }
        var url = new URL(fileUrl);

        // blob: 协议：无法获取真实本地路径，baseDir 设为空，依赖 root
        if (url.protocol === 'blob:') {
          this.baseDir = '';
          return;
        }

        var path = decodeURIComponent(url.pathname);
        var lastSlash = path.lastIndexOf('/');
        var dir = path.substring(0, lastSlash + 1);

        // Windows 盘符修复：file://C:/  -> 确保 pathname 以 /C:/ 开头
        if (/^file:/i.test(url.protocol) && !/^\//.test(dir)) dir = '/' + dir;

        this.baseDir = url.protocol + '//' + url.host + dir;
      } catch (e) {
        this.baseDir = '';
      }
    },

    setBridge: function (bridgeUrl) {
      this.bridgeUrl = bridgeUrl || '';
    },

    /**
     * 将任意 href 解析为绝对 URL
     */
    resolve: function (href) {
      if (!href) return '';
      var h = String(href).trim();

      // 协议链接（http:/https:/mailto: 等，排除 file: 和 Windows 盘符 C:/）
      // 关键：协议名至少 2 个字符（/[a-z][a-z0-9+\-.]{1,}/），
      // 这样 "C:/..." 的 scheme 只有 1 个字符 "c"，不会被误判为协议
      var schemeMatch = /^([a-z][a-z0-9+\-.]{1,}):/i.exec(h);
      if (schemeMatch) {
        var scheme = schemeMatch[1].toLowerCase();
        if (scheme === 'file') return h;                       // file:// 原样
        if (/^(https?|mailto|ftp|ws|wss)$/.test(scheme)) return h; // 已知外部协议
        // scheme://xxx 形式一律视为外部协议
        if (/^[a-z][a-z0-9+\-.]{1,}:\/\//i.test(h)) return h;
      }

      // 锚点 #xxx
      if (h.charAt(0) === '#') return h;

      // Windows 绝对路径：C:\... 或 C:/... 或 \\server\...
      if (/^[a-z]:[\\/]/i.test(h) || /^\\\\[^\\]/.test(h)) {
        return this._pathToFileUrl(h);
      }

      // 以 / 开头的绝对路径（相对于 root / 服务器根）
      if (h.charAt(0) === '/') {
        if (this.root) {
          return this.root + h.replace(/^\/+/, '');
        }
        // 无 root 时，当作相对于 baseDir 的 / 根（http 模式下即 origin）
        return (this.baseDir || '') + h.replace(/^\/+/, '');
      }

      // 相对路径：优先 root，其次 baseDir
      var base = this.root || this.baseDir || '';
      if (base) {
        return this._resolveRelative(base, h);
      }
      return h;
    },

    /**
     * 绑定容器内所有 data-md-link 链接的点击
     */
    bind: function (container) {
      var self = this;
      container = container || document;
      var links = container.querySelectorAll('a[data-md-link]');
      links.forEach(function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var href = a.getAttribute('data-md-link') || a.getAttribute('href') || '';
          self.open(href);
        });
      });
      // 同时处理普通渲染出来的链接（无 data 属性）
      var normalLinks = container.querySelectorAll('a[href]:not([data-md-link])');
      normalLinks.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (/^(https?:\/\/|mailto:|#)/i.test(href)) {
          if (/^(https?:\/\/)/i.test(href)) a.target = '_blank';
          return; // 外部/锚点不拦截
        }
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          self.open(href);
        });
      });
    },

    /**
     * 打开链接：本地文件走桥接，外部直接跳转
     */
    open: function (href) {
      var resolved = this.resolve(href);
      console.log('[MD Viewer] open:', href, '->', resolved);

      // 锚点：页面内跳转
      if (href.charAt(0) === '#') {
        var el = document.getElementById(href.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      // 外部链接
      if (/^https?:\/\//i.test(resolved) || /^mailto:/i.test(resolved)) {
        var w = window.open(resolved, '_blank');
        if (!w) alert('弹出窗口被拦截，请复制链接手动打开：\n' + resolved);
        return;
      }

      // 本地文件：通过桥接跳转
      if (this.bridgeUrl) {
        var sep = this.bridgeUrl.indexOf('#') >= 0 ? '&' : '#';
        var target = sep + 'target=' + encodeURIComponent(resolved);
        // 使用 location.href 触发整页导航（桥接页负责打开）
        window.location.href = this.bridgeUrl + target;
      } else {
        window.location.href = resolved;
      }
    },

    /* ---------------- 内部工具 ---------------- */

    _pathToFileUrl: function (p) {
      var s = String(p).replace(/\\/g, '/');
      if (/^[a-z]:/i.test(s) && s.charAt(0) !== '/') s = '/' + s;  // /C:/...
      return 'file://' + s;  // file:// + /C:/... = file:///C:/...
    },

    _resolveRelative: function (base, rel) {
      var basePath = base.replace(/^file:\/\//, '').replace(/^https?:\/\/[^/]+/, '');
      if (basePath && !/^\//.test(basePath)) basePath = '/' + basePath;
      var joined = (basePath.replace(/\/$/, '') + '/' + rel.replace(/\\/g, '/')).replace(/\/\//g, '/');
      var parts = joined.split('/');
      var stack = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part === '' || part === '.') continue;
        if (part === '..') { if (stack.length) stack.pop(); continue; }
        stack.push(part);
      }
      var result = stack.join('/');
      // 恢复协议前缀
      if (/^file:/i.test(base)) {
        // Windows 盘符路径（/C:/...）需规范化为 file:///C:/（三斜杠）
        if (/^\//.test(result)) return 'file://' + result;   // /C:/xxx -> file:///C:/xxx
        return 'file:///' + result;                          // C:/xxx -> file:///C:/xxx
      }
      var protoMatch = /^https?:\/\/[^/]+/i.exec(base);
      if (protoMatch) return protoMatch[0] + '/' + result.replace(/^\//, '');
      return result;
    }
  };

  global.MDLinkHandler = LinkHandler;
})(window);
