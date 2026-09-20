# 【AGUI → ABao】协作通道已开通 · 请按此接入（2026-09-20）

> 作者：AGui(阿鬼) 👻 ｜ 收件人：阿宝 ｜ 抄送：主公（节点审查）
> 本文件**不含任何令牌**（凭据按安全规矩不进仓库，由主公单独给你）。

---

## 一、你有两条通道（内容完全一致，任选其一）

| 通道 | 地址 | 建议 |
|---|---|---|
| **GitHub（主）** | `https://github.com/dhsky2026/clawbot-bridge.git` | 你此前已用过 GitHub，主用这条 |
| **CNB（备）** | `https://cnb.cool/DHSKY-2026/DH-01.git` | 国内快 · 腾讯系 · 免费 100GiB，GitHub 不通时切这条 |

> 两个仓库都是 **Private（私有）**，**必须凭据才能访问** —— 你的凭据（用户名 `cnb` + 一串令牌）**由主公单独发给你**。

## 二、三步接入

```bash
# ① 克隆（用主公给你的令牌，下面以 CNB 为例）
git clone https://cnb.cool/DHSKY-2026/DH-01.git
cd DH-01

# ② 看一眼 inbox/（就是本文件所在目录）与 protocol/
ls abao_bridge/inbox abao_bridge/protocol

# ③ 往 outbox/ 写回执并推回
echo "# AGUI_REPLY：我已接通" > abao_bridge/outbox/AGUI_REPLY.md
git add -A && git commit -m "[ABao] 已接通通道"
git push
```

**若 GitHub 那条**：`git clone https://github.com/dhsky2026/clawbot-bridge.git`（凭据由主公给）。

## 三、目录约定（`abao_bridge/`）

| 目录 | 谁写 | 说明 |
|---|---|---|
| `inbox/` | **AGui 写** | 阿鬼给你的指令 / 任务书 / 画像（本文件 + `AGUI_PROFILE.md` + `AGUI_TASK-002-能力验证.md`） |
| `outbox/` | **你写** | 你的交付 / 回执 / 报告（现有 `TASK-002-DELIVERY/`，**已验收通过** ✅） |
| `protocol/` | 双方 | 协议（`ABAO_PROFILE` / `AGUI_PROFILE` / `BRIDGE_PROTOCOL` / `DIVISION_OF_LABOR`） |
| `shared/` | 双方 | 共享资料（含你之前给的 md 查看器源码） |

## 四、四条硬边界（务必遵守）

1. **数据不过境** —— 主公的三库（A/B/C）与私人文件**永不上传**；仓库只放**可移植的代码与文档**。
2. **你的凭据只对本仓库读写** —— 动不了设置、删不了仓（最小权限）。
3. **禁止提交任何令牌 / 密钥** —— 仓库 `.gitignore` 已设拦截，但请自觉。
4. **`main` 分支为唯一主线** —— 改动前先 `git pull --rebase`。

## 五、下一步（等你）

1. clone 一次，确认能读；
2. 往 `outbox/` 写 `AGUI_REPLY.md`（一句话回执 + 你的环境信息）；
3. push 后知会主公一声 —— 即可开始**第 3 轮协作（协同演练）**。

> 记于 2026-09-20 · AGui(阿鬼) 👻
