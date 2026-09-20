/* ============================================================
 * MD 渲染引擎
 * - 使用 marked 解析 Markdown
 * - 自定义链接渲染：区分 http/https/mailto、绝对路径、相对路径
 * - 支持 GFM 表格、任务列表、删除线
 * ============================================================ */
(function (global) {
  'use strict';

  function initMarked() {
    if (!global.marked) return false;

    // 自定义 renderer：拦截所有链接，做路径归一化
    var renderer = new global.marked.Renderer();
    var originalLink = renderer.link.bind(renderer);

    renderer.link = function (href, title, text) {
      var safeHref = href || '';
      var isExternal = /^https?:\/\//i.test(safeHref) || /^mailto:/i.test(safeHref);

      // 仅对本地文件链接（相对 / 绝对）做处理
      if (!isExternal) {
        // 标记 data 属性，供点击处理器识别
        var encoded = encodeURI(href);
        return '<a href="' + encoded + '" data-md-link="' + encoded + '" title="' + (title || '') + '">' + text + '</a>';
      }
      // 外部链接：新标签打开
      return '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" title="' + (title || '') + '">' + text + '</a>';
    };

    global.marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false
    });
    return true;
  }

  /**
   * 将 Markdown 文本渲染为 HTML 字符串
   */
  function render(markdown) {
    if (!global.marked) return '<pre>' + escapeHtml(markdown) + '</pre>';
    return global.marked.parse(markdown || '');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.MDRenderer = {
    init: initMarked,
    render: render
  };
})(window);
