import {readFile,open} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function validateLocalURL(raw){
 const url=new URL(raw);
 if(url.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password)throw Error('Only HTTP loopback endpoints are allowed; prompts must stay local');
 return url.toString();
}
export async function runLocal({url='http://127.0.0.1:11434/v1/chat/completions',model,prompt}){
 validateLocalURL(url);
 if(!model||!prompt)throw Error('Model and prompt are required');
 const started=performance.now();
 const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:prompt}],max_tokens:256}),redirect:'error',signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error(`Local endpoint returned HTTP ${response.status}`);
 const json=await response.json(),usage=json.usage||{};
 const input=usage.prompt_tokens??usage.input_tokens,output=usage.completion_tokens??usage.output_tokens;
 if(!Number.isSafeInteger(input)||input<0||!Number.isSafeInteger(output)||output<0)throw Error('Local endpoint did not return reliable token usage; no token counts were invented');
 return {kind:'local-benchmark',model,endpoint:new URL(url).origin,usage:{input_tokens:input,output_tokens:output},latency_ms:Math.round(performance.now()-started),output:json.choices?.[0]?.message?.content||'',measured_at:new Date().toISOString()};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),get=(name)=>{const index=args.indexOf(name);return index<0?undefined:args[index+1]};
 const model=get('--model'),promptFile=get('--prompt-file'),out=get('--out'),url=get('--url')||'http://127.0.0.1:11434/v1/chat/completions';
 if(!model||!promptFile||!out){console.error('Usage: node scripts/local-benchmark.mjs --model MODEL --prompt-file PROMPT.txt --out result.json [--url http://127.0.0.1:PORT/v1/chat/completions]');process.exitCode=2}
 else try{validateLocalURL(url);const prompt=await readFile(promptFile,'utf8');const result=await runLocal({url,model,prompt});const file=await open(out,'w',0o600);try{await file.chmod(0o600);await file.writeFile(JSON.stringify(result,null,2))}finally{await file.close()}console.log(`Saved local measurement to ${out} (${result.usage.input_tokens} in, ${result.usage.output_tokens} out, ${result.latency_ms} ms)`)}catch(error){console.error(error.message);process.exitCode=1}
}
