import os, json, time, numpy as np
from concurrent.futures import ProcessPoolExecutor
def chunk(args):
    seed, N, T = args
    rng = np.random.default_rng(seed)
    c = 10*np.cumprod(1+rng.normal(0,0.015,size=(T,N)),axis=0)
    r = np.diff(np.log(c),axis=0,prepend=np.zeros((1,N)))
    W=20; cu=np.cumsum(r,axis=0); cu2=np.cumsum(r*r,axis=0)
    ws=np.zeros_like(r); ws2=np.zeros_like(r)
    ws[W-1:]=cu[W-1:]-np.vstack([np.zeros((1,N)),cu[:T-W]])
    ws2[W-1:]=cu2[W-1:]-np.vstack([np.zeros((1,N)),cu2[:T-W]])
    v=np.sqrt(ws2/W-(ws/W)**2)*np.sqrt(250); v[:W-1]=np.nan
    return float(np.nanmean(v))
def serial(seeds):
    t=time.time()
    for s in seeds: chunk((s,2000,500))
    return time.time()-t
def parallel(seeds):
    t=time.time()
    with ProcessPoolExecutor(max_workers=3) as ex:
        list(ex.map(chunk, [(s,2000,500) for s in seeds]))
    return time.time()-t
seeds=list(range(12))
s=serial(seeds); p=parallel(seeds)
print(json.dumps({"serial_s":round(s,3),"parallel_s":round(p,3),"speedup":round(s/p,2),"workers":3,"tasks":len(seeds)},ensure_ascii=False))
