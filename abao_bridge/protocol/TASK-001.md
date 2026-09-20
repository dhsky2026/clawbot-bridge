# TASK-001：修复 md-link-handler 的 2 个失败断言

**状态**：待阿宝认领
**优先级**：P0（通道验证 + 核心功能）

---

## 背景

`md-link-handler.js` 的单元测试 `test-link-handler.js` 当前 **16/18 通过**，
剩余 **2 个断言失败**，均集中在 `setBaseDir`（基于当前文件目录解析）场景。

根因已定位：浏览器中 `URL.createObjectURL` 返回 `blob:` 协议 URL，无法从中还原真实本地路径，
导致相对路径解析偏差。

---

## 复现步骤

```bash
cd /data/workspace   # 或仓库 shared/ 目录
node test-link-handler.js
```

预期：`18/18 passed`
当前：`16/18 passed`，2 个失败

---

## 失败断言详情（待修复）

### 断言 A：`blob:` 协议 URL 的降级行为

**测试代码**（示意）：
```js
linkHandler.setBaseDir('blob:http://localhost/xxxx-xxxx');
const resolved = linkHandler.resolve('./intro.md');
// 期望：不抛错，返回约定的降级值（null 或原样）
```

**当前行为**：抛出错误或返回错误路径
**期望行为**：`blob:` URL 无法还原本地目录 → 明确降级（返回 `null` 或保持原输入），**不抛异常**

### 断言 B：`file:///` 绝对路径的目录提取

**测试代码**（示意）：
```js
linkHandler.setBaseDir('file:///D:/360pan/ClawBot/docs/current.md');
const resolved = linkHandler.resolve('./intro.md');
// 期望：baseDir = 'file:///D:/360pan/ClawBot/docs/'
//       resolved = 'file:///D:/360pan/ClawBot/docs/intro.md'
```

**当前行为**：目录提取错误（如多/少分隔符）
**期望行为**：正确提取 `file:///` 路径的目录部分作为 baseDir，拼接相对路径

---

## 相关代码片段（定位参考）

```js
// md-link-handler.js —— setBaseDir 相关逻辑（待修正）
setBaseDir(url) {
  // TODO: 处理 blob: 协议 → 降级
  // TODO: 正确解析 file:/// 路径的目录部分
  this.baseDir = ...;
}
```

---

## 验收标准

- [ ] `node test-link-handler.js` 输出 `18/18 passed`
- [ ] 不引入新的失败用例（已有 16 例不退化）
- [ ] GFM、绝对路径（Windows `C:/`、`D:/`）、锚点 `#标题`、外部 `https://` 等既有能力保持正常
- [ ] `outbox/` 交付：
  - `md-link-handler.js`（修复版）
  - `test-link-handler.js`（如断言需微调，一并说明原因）
  - `test-report.txt`（`node test-link-handler.js` 的完整输出，证明 18/18）

---

## 备注

- 此任务同时作为**通道验证**：阿宝能否成功 `clone` → 读写 `inbox/` & `outbox/` → `push`
- 修复时应保持 `_resolveRelative`、协议检测等已验证正确的逻辑不动，仅修正 `setBaseDir`
