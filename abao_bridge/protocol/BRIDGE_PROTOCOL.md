# 三方协作协议（阿宝 / 阿鬼 / 用户）

> 用途：阿鬼搭建 GitHub 私有仓库通道时，照此文档建目录、配权限、投递首个任务。
> 阿宝（元宝）能力已确认：✅ 支持 `git`、GitHub API、`gh` CLI，可直接读写仓库。

---

## 一、仓库结构（请阿鬼按此创建）

```
ClawBot/
└── abao_bridge/
    ├── shared/   ← 三方共同编辑的当前源码（主线）
    ├── inbox/    ← 投递给阿宝处理的任务 / 待改文件
    ├── outbox/   ← 阿宝的交付区（改好的代码、打包 zip）
    └── protocol/ ← 本文件 + 任务说明 + 决策记录
```

- `shared/`：稳定版源码，三方都可写，通过 **分支 / PR** 协作
- `inbox/`：用户或阿鬼 → 阿宝 的投递区
- `outbox/`：阿宝 → 用户 / 阿鬼 的交付区
- `protocol/`：协作规范、任务卡、变更记录

---

## 二、阿宝接入所需（通道就绪的两个要素）

阿鬼建好仓库后，请把这两样给阿宝：

1. **仓库 URL**（HTTPS 格式）
   ```
   https://github.com/<owner>/clawbot-bridge.git
   ```
2. **GITHUB_TOKEN**（Personal Access Token · Classic）
   - 权限范围：**`repo`（全选）**，确保可读写私有仓库
   - 建议设为**仓库级 Fine-grained token**，仅授权本仓库，更安全

阿宝拿到后执行：
```bash
git clone https://<token>@github.com/<owner>/clawbot-bridge.git
cd clawbot-bridge
# 读取 inbox/ → 修改 → 推送到 outbox/ 或 shared/
```

---

## 三、分支与协作策略（避免三方冲突）

| 角色 | 固定分支 | 说明 |
|------|----------|------|
| 阿宝 | `abao/work` | 处理 `inbox/` 任务，完成后提 PR 到 `main` |
| 阿鬼 | `agui/work` | 自行开发，提 PR 到 `main` |
| 用户 | 直接合 / 审核 | 作为仓库 Owner，负责合并与决策 |

- 主线：`main`
- 所有改动通过 **Pull Request** 合入，禁止直接推 `main`
- 敏感凭证（token）**绝不入库**，仅在对话 / 环境变量中传递

---

## 四、首个任务（验证通道 + 修复遗留断言）

### 任务卡：`TASK-001` 修复 md-link-handler 的 2 个失败断言

**背景**
`md-link-handler.js` 的单元测试 `test-link-handler.js` 当前 **16/18 通过**，
剩余 **2 个断言失败**，均集中在 `setBaseDir`（基于当前文件目录解析）场景。

**根因（已定位）**
浏览器中 `URL.createObjectURL` 返回 `blob:` 协议 URL，无法从中还原真实本地路径，
导致相对路径解析偏差。

**阿宝需要做的**
1. 读 `inbox/md-link-handler.js`、`inbox/test-link-handler.js`
2. 修复 `setBaseDir` 对以下两类输入的处理：
   - 输入 A：以 `blob:` 开头的 URL → 应有明确的降级行为（不抛错、返回 null 或约定值）
   - 输入 B：以 `file:///` 开头但路径含 `/` 分隔 → 正确提取目录作为 baseDir
3. 使 `test-link-handler.js` 全部 **18/18 通过**
4. 交付物推到 `outbox/`：
   - `md-link-handler.js`（修复版）
   - `test-link-handler.js`（如断言需微调，一并说明）
   - `test-report.txt`（`node test-link-handler.js` 的输出，证明 18/18）

**验收标准**
- `node test-link-handler.js` 输出 `18/18 passed`
- 不引入新的失败用例
- 保留 GFM / 绝对路径 / 锚点等既有能力（已有 16 例不退化）

---

## 五、通道验证清单（阿鬼搭好后自查）

- [ ] 私有仓库已创建，`abao_bridge/` 目录结构已就位
- [ ] 阿宝已被授予写权限（token 有 `repo` 范围）
- [ ] 首个任务文件已放入 `inbox/`（`md-link-handler.js` + `test-link-handler.js`）
- [ ] 仓库 URL + token 已提供给阿宝
- [ ] 阿宝 `clone` 成功，并能在沙盒内 `git push` 到 `outbox/`

通道验证通过后，阿宝将产出 `TASK-001` 的交付，三方协作正式运转。

---

## 六、安全提醒

- ⚠️ Token 只在对话 / 环境变量中传递，**绝不提交到仓库**
- ⚠️ 优先使用 Fine-grained PAT，仅授权本仓库、最短有效期
- ⚠️ `outbox/` 中的产物（如 zip）不应包含 token 或敏感配置
