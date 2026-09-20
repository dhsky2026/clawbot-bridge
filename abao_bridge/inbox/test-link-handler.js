// 单元测试：直接载入浏览器端 md-link-handler.js（eval 到 mock window），
// 保证测试对象与真实浏览器运行代码 100% 一致，杜绝"两份逻辑"漂移。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {}, console: console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

const src = fs.readFileSync(path.join(__dirname, 'md-link-handler.js'), 'utf-8');
vm.runInContext(src, sandbox);
const MDLinkHandler = sandbox.window.MDLinkHandler;

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✅ ' + msg); }
  else { fail++; console.log('  ❌ ' + msg); }
}

const h = MDLinkHandler;

/* ===== 测试1：Windows 绝对路径 ===== */
console.log('\n【测试1】Windows 绝对路径解析');
assert(h.resolve('C:/Windows/System32') === 'file:///C:/Windows/System32', 'C:/ 盘符');
assert(h.resolve('D:/data/file.md') === 'file:///D:/data/file.md', 'D:/ 绝对路径');
assert(h.resolve('C:\\Users\\test') === 'file:///C:/Users/test', '反斜杠转正斜杠');

/* ===== 测试2：外部/特殊协议不处理 ===== */
console.log('\n【测试2】外部链接不处理');
assert(h.resolve('https://www.baidu.com') === 'https://www.baidu.com', 'https 原样');
assert(h.resolve('http://example.com/a') === 'http://example.com/a', 'http 原样');
assert(h.resolve('mailto:a@b.com') === 'mailto:a@b.com', 'mailto 原样');
assert(h.resolve('ftp://server/file') === 'ftp://server/file', 'ftp 原样');

/* ===== 测试3：锚点 ===== */
console.log('\n【测试3】锚点');
assert(h.resolve('#标题') === '#标题', '锚点原样');
assert(h.resolve('#三代码与表格') === '#三代码与表格', '中文锚点');

/* ===== 测试4：相对路径（基于 root）===== */
console.log('\n【测试4】相对路径（基于 root）');
h.setRoot('C:/project/docs');
assert(h.resolve('./intro.md') === 'file:///C:/project/docs/intro.md', './ 相对路径');
assert(h.resolve('docs/readme.md') === 'file:///C:/project/docs/docs/readme.md', '子路径');
assert(h.resolve('../parent.md') === 'file:///C:/project/parent.md', '../ 上级目录');
assert(h.resolve('/absolute/from/root.md') === 'file:///C:/project/docs/absolute/from/root.md', '/ 基于 root');

/* ===== 测试5：相对路径（基于 baseDir，无 root）===== */
console.log('\n【测试5】相对路径（基于 baseDir）');
h.root = '';
h.setBaseDir('file:///C:/Users/me/note.md');
assert(h.resolve('./other.md') === 'file:///C:/Users/me/other.md', 'baseDir 同级');
assert(h.resolve('../up.md') === 'file:///C:/Users/up.md', 'baseDir 上级');

/* ===== 测试6：setRoot 规范化 ===== */
console.log('\n【测试6】setRoot 规范化');
h.setRoot('C:\\Windows\\System32');
assert(h.root === 'file:///C:/Windows/System32/', 'setRoot 反斜杠+末尾斜杠');
h.setRoot('');
assert(h.root === '', 'setRoot 空值清空');

/* ===== 测试7：URL.createObjectURL (blob:) 场景 ===== */
console.log('\n【测试7】blob: 协议 baseDir（file:// 直接打开时的降级）');
h.root = '';
h.setBaseDir('blob:http://127.0.0.1:8765/abc-123');
assert(h.baseDir === '', 'blob: 协议 baseDir 置空（依赖 root）');

console.log('\n========================================');
console.log(`通过: ${pass}  失败: ${fail}`);
process.exit(fail ? 1 : 0);
