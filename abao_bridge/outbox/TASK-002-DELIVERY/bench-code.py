# -*- coding: utf-8 -*-
"""
TASK-002 阿宝算力基准实测
提出人：阿鬼(AGui) ｜ 认领人：阿宝(Yuanbao)
任务：合成行情数据，跑 20 日滚动波动率 + 每日截面 IC，分 25w / 100w 行两次
技术栈：Python 3.10 + NumPy 2.2.6 + pandas 2.3.3（向量化，不并行——见报告瓶颈分析）
"""
import os, sys, time, gc, json
import numpy as np
import pandas as pd

LOG = []
def log(msg):
    print(msg, flush=True)
    LOG.append(msg)

def mem_mb():
    try:
        with open("/proc/self/status") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1]) / 1024
    except Exception:
        pass
    return -1

def run(N, T, label):
    log(f"\n===== {label}：N={N} 只股票 × T={T} 天 = {N*T:,} 行 =====")
    rss0 = mem_mb()

    # ---- 1. 合成数据 ----
    t0 = time.time()
    rng = np.random.default_rng(20260920)
    codes = np.array([f"{600000+i:06d}" for i in range(N)])
    dates = pd.date_range("2024-01-01", periods=T, freq="B").values
    close = 10 * np.cumprod(1 + rng.normal(0, 0.015, size=(T, N)), axis=0)
    volume = rng.lognormal(mean=10, sigma=0.5, size=(T, N))
    factor = rng.standard_normal(size=(N,))
    factor = np.broadcast_to(factor, (T, N))
    gen_t = time.time() - t0
    log(f"[生成] 耗时 {gen_t:.2f}s，此时 RSS={mem_mb():.0f} MB")

    # ---- 2. 日收益 + 20 日滚动波动率 ----
    t0 = time.time()
    ret = np.diff(np.log(close), axis=0, prepend=np.zeros((1, N)))  # T x N
    W = 20
    # 向量化滚动 std（用滑动窗，等价于 pandas rolling，无 python 循环）
    cum = np.cumsum(ret, axis=0)                       # T x N
    cum2 = np.cumsum(ret * ret, axis=0)
    win_sum = np.zeros_like(ret)
    win_sum2 = np.zeros_like(ret)
    win_sum[W-1:] = cum[W-1:] - np.vstack([np.zeros((1, N)), cum[:T-W]])
    win_sum2[W-1:] = cum2[W-1:] - np.vstack([np.zeros((1, N)), cum2[:T-W]])
    vol = np.sqrt(win_sum2 / W - (win_sum / W) ** 2) * np.sqrt(250)
    vol[:W-1] = np.nan
    n_valid = np.sum(~np.isnan(vol))
    vol_t = time.time() - t0
    log(f"[波动率] 耗时 {vol_t:.2f}s，有效格子 {n_valid:,}，均值 {np.nanmean(vol):.4f}")

    # ---- 3. 每日截面 IC（Pearson corr(factor, 次日收益)）----
    t0 = time.time()
    next_ret = ret[1:]                        # (T-1) x N
    fmat = factor[:T-1]                      # (T-1) x N
    fmean = fmat.mean(axis=1, keepdims=True)
    nmean = next_ret.mean(axis=1, keepdims=True)
    fc = fmat - fmean
    nc = next_ret - nmean
    cov = (fc * nc).sum(axis=1)
    denom = np.sqrt((fc*fc).sum(axis=1) * (nc*nc).sum(axis=1))
    ic = np.where(denom > 0, cov / denom, np.nan)
    ic_mean = np.nanmean(ic)
    icir = ic_mean / (np.nanstd(ic) + 1e-12)
    pos = np.sum(ic > 0) / len(ic)
    ic_t = time.time() - t0
    log(f"[IC] 耗时 {ic_t:.2f}s，IC均值={ic_mean:+.4f} ICIR={icir:+.3f} 正IC占比={pos:.1%}")

    rss1 = mem_mb()
    peak = max(rss1, rss0)
    log(f"[内存] 峰值 RSS ≈ {peak:.0f} MB")
    del close, volume, factor, ret, win_sum, win_sum2, cum, cum2, fc, nc, next_ret
    gc.collect()
    return {
        "label": label, "N": N, "T": T, "rows": N*T,
        "gen_s": round(gen_t, 3), "vol_s": round(vol_t, 3),
        "ic_s": round(ic_t, 3), "total_s": round(gen_t+vol_t+ic_t, 3),
        "ic_mean": round(float(ic_mean), 5), "icir": round(float(icir), 3),
        "pos_ic": round(float(pos), 3), "rss_mb": round(peak, 0),
    }

if __name__ == "__main__":
    log("==== TASK-002 阿宝算力基准实测 ====")
    log(f"Python {sys.version.split()[0]} | NumPy {np.__version__} | pandas {pd.__version__}")
    log(f"可见 CPU 核数：{os.cpu_count()}")
    log(f"初始 RSS：{mem_mb():.0f} MB\n")

    r1 = run(1000, 250, "RUN1 25 万行")
    r2 = run(2000, 500, "RUN2 100 万行")

    print("\n===== JSON 结果（供报告引用）=====")
    print(json.dumps({"run1": r1, "run2": r2}, ensure_ascii=False, indent=1))
