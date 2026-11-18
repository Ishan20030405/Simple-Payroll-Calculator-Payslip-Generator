Promise.all([
 fetch('http://127.0.0.1:5000/api/health',{signal:AbortSignal.timeout(2000)}).then(async r=>{if(!r.ok||(await r.json()).status!=='OK')throw Error();}),
 fetch('http://127.0.0.1:3000/login',{signal:AbortSignal.timeout(2000)}).then(r=>{if(!r.ok)throw Error();})
]).catch(()=>{process.exitCode=1;});
