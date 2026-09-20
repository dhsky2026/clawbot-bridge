import time, gc, json, os
import numpy as np
def trial(N,T,label):
    rng=np.random.default_rng(7)
    t0=time.time()
    c=10*np.cumprod(1+rng.normal(0,0.015,size=(T,N)),axis=0)
    r=np.diff(np.log(c),axis=0,prepend=np.zeros((1,N)))
    W=20; cu=np.cumsum(r,axis=0); cu2=np.cumsum(r*r,axis=0)
    ws=np.zeros_like(r); ws2=np.zeros_like(r)
    ws[W-1:]=cu[W-1:]-np.vstack([np.zeros((1,N)),cu[:T-W]])
    ws2[W-1:]=cu2[W-1:]-np.vstack([np.zeros((1,N)),cu2[:T-W]])
    v=np.sqrt(ws2/W-(ws/W)**2)*np.sqrt(250); v[:W-1]=np.nan
    f=np.broadcast_to(rng.standard_normal((N,)),(T,N))
    nr=r[1:]; fm=f[:T-1]; ic=( ((fm-fm.mean(1,keepdims=True))*(nr-nr.mean(1,keepdims=True))).sum(1) )/np.sqrt(( ((fm-fm.mean(1,keepdims=True))**2).sum(1))*(((nr-nr.mean(1,keepdims=True))**2).sum(1)))
    ic=ic[np.isfinite(ic)]
    dt=time.time()-t0
    with open("/proc/self/status") as fp:
        rss=next(int(l.split()[1])/1024 for l in fp if l.startswith("VmRSS"))
    del c,r,ws,ws2,cu,cu2,v,fm,nr,ic; gc.collect()
    return {"label":label,"rows":N*T,"N":N,"T":T,"s":round(dt,3),"rss":round(rss,0)}
for N,T,lab in [(4000,500,"400万行"),(8000,500,"800万行"),(2000,5000,"1000万行(长序列)")]:
    print(json.dumps(trial(N,T,lab)))
