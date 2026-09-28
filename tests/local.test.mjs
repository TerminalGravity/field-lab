import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {runLocal,validateLocalURL} from '../scripts/local-benchmark.mjs';
test('refuses remote endpoints so prompts stay on the machine',()=>{
 assert.throws(()=>validateLocalURL('https://api.example.com/v1/chat/completions'),/loopback/);
 assert.throws(()=>validateLocalURL('http://192.168.1.3:8000/v1/chat/completions'),/loopback/);
});
test('runs one opt-in local request and records usage and latency',async()=>{
 const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;assert.equal(JSON.parse(body).model,'fixture-model');res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'The answer is 42.'}}],usage:{prompt_tokens:12,completion_tokens:6}}))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const result=await runLocal({url:`http://127.0.0.1:${server.address().port}/v1/chat/completions`,model:'fixture-model',prompt:'What is the answer?'});
  assert.equal(result.kind,'local-benchmark');assert.equal(result.usage.input_tokens,12);assert.equal(result.usage.output_tokens,6);assert.equal(result.output,'The answer is 42.');assert.ok(result.latency_ms>=0);
 }finally{server.close()}
});
test('CLI restricts an existing output file before writing the model answer',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'local-benchmark-'));
 const promptFile=join(dir,'task.txt'),out=join(dir,'result.json');
 const server=http.createServer(async(req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'private answer'}}],usage:{prompt_tokens:3,completion_tokens:2}}))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  await writeFile(promptFile,'test');await writeFile(out,'previous',{mode:0o644});
  await promisify(execFile)(process.execPath,['scripts/local-benchmark.mjs','--model','fixture','--prompt-file',promptFile,'--out',out,'--url',`http://127.0.0.1:${server.address().port}/v1/chat/completions`],{cwd:process.cwd()});
  assert.equal((await stat(out)).mode&0o777,0o600);
 }finally{server.close();await rm(dir,{recursive:true,force:true})}
});
