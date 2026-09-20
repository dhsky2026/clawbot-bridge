// 完整集成测试：模拟浏览器端 marked 解析 + 链接拦截
const fs = require('fs');
const path = require('path');

// 用 jsdom 或无依赖方式：这里直接用正则提取链接验证
const md = fs.readFileSync(path.join(__dirname, 'sample.md'), 'utf-8');

// 模拟 md-renderer.js 的 link renderer 逻辑
function parseLinks(markdown) {
  // 匹配 [text](href) 和 [text](href "title")
  const re = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const links = [];
  let m;
  while ((m = re.exec(markdown)) !== null) {
    links.push({ text: m[1], href: m[2] });
  }
  return links;
}

const links = parseLinks(md);
console.log('提取到 ' + links.length + ' 个链接：\n');

// 复用解析逻辑
function resolve(href, root, baseDir) {
  if (!href) return '';
  const h = href.trim();
  // 与浏览器端 md-link-handler.js 完全一致
  const schemeMatch = /^([a-z][a-z0-9+\-.]{1,}):/i.exec(h);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === 'file') return h;
    if (/^(https?|mailto|ftp|ws|wss)$/.test(scheme)) return h;
    if (/^[a-z][a-z0-9+\-.]{1,}:\/\//i.test(h)) return h;
  }
  if (h.charAt(0) === '#') return h;
  if (/^[a-z]:[\\/]/i.test(h) || /^\\\\[^\\]/.test(h)) {
    const s = h.replace(/\\/g, '/');
    return 'file://' + (s.charAt(0) === '/' ? s : '/' + s);
  }
  if (h.charAt(0) === '/') return (root || baseDir || '') + h.replace(/^\/+/, '');
  const base = root || baseDir || '';
  return resolveRelative(base, h);
}

// 与浏览器端完全一致的路径归一化
function resolveRelative(base, rel) {
  let basePath = String(base).replace(/^file:\/\//, '').replace(/^https?:\/\/[^/]+/, '');
  // Windows 盘符：C:/... -> /C:/...（保证 file:///C:/ 三斜杠规范）
  if (/^[a-z]:/i.test(basePath) && basePath.charAt(0) !== '/') basePath = '/' + basePath;
  const joined = (basePath.replace(/\/$/, '') + '/' + rel.replace(/\\/g, '/')).replace(/\/\//g, '/');
  const parts = joined.split('/'), stack = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '' || part === '.') continue;
    if (part === '..') { if (stack.length) stack.pop(); continue; }
    stack.push(part);
  }
  const result = stack.join('/');
  // 恢复 file:// 前缀（Windows 盘符结果为 /C:/... -> file:///C:/...）
  if (/^file:/i.test(base)) return 'file://' + result;
  return result;
}

const root = 'file:///C:/project/docs';

let pass = 0, fail = 0;
function check(cond, msg) { if (cond) { pass++; console.log('  ✅ ' + msg); } else { fail++; console.log('  ❌ ' + msg); } }

links.forEach(l => {
  const r = resolve(l.href, root, '');
  const expectedType = /^https?:\/\//.test(l.href) ? 'external'
    : /^mailto:/.test(l.href) ? 'mailto'
    : /^#/.test(l.href) ? 'anchor'
    : /^[a-z]:[\\/]/i.test(l.href) ? 'abs-win'
    : 'relative';
  check(/^file:\/\//.test(r) || /^https?:\/\//.test(r) || /^mailto:/.test(r) || /^#/.test(r),
    `[${expectedType}] ${l.text} -> ${l.href}\n         => ${r}`);
});

// 专门校验几个关键用例
console.log('\n--- 关键用例断言 ---');
check(resolve('./intro.md', root) === 'file:///C:/project/docs/intro.md', '相对 ./intro.md');
check(resolve('C:/Windows/System32', root) === 'file:///C:/Windows/System32', '绝对 C:/Windows/System32');
check(resolve('https://www.baidu.com', root) === 'https://www.baidu.com', '外部 https 原样');
check(resolve('#三代码与表格', root) === '#三代码与表格', '锚点原样');

console.log('\n========================================');
console.log(`总计 ${links.length} 个链接，断言通过 ${pass}，失败 ${fail}`);

// 统计 md 中各类元素
const tables = (md.match(/\|/g) || []).length;
const codeBlocks = (md.match(/```/g) || []).length / 2;
console.log(`\n文档元素：表格列分隔符 ${tables} 个 | 代码块 ${codeBlocks} 个`);
console.log('GFM 表格、代码高亮、任务列表 → 由 marked + highlight.js 在浏览器端渲染');
