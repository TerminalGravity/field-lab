import test from 'node:test';
import assert from 'node:assert/strict';
import {price,workload,simulateCache,agentTurns} from '../src/course.js';
test('prices token categories independently per million',()=>{
 assert.equal(price('opus',2000,0,0,500),.018);
 assert.equal(price('sol',0,80000,19*80000,60000),1.104);
});
test('agent workload separates initial write and subsequent reads',()=>{
 assert.deepEqual(workload('agent'),{fresh:40000,write:80000,read:1520000,out:60000});
});
test('cache hit refreshes TTL; changed prefix writes again',()=>{
 const rows=simulateCache({breakAt:4});
 assert.deepEqual(rows.map(r=>r.hit),[false,true,true,false,true,true,true,true,true,true]);
 assert.equal(rows[3].write,4000);
});
test('eight-minute gap expires 5m but not 1h',()=>{
 assert.equal(simulateCache({gap:8,ttl:5})[1].hit,false);
 assert.equal(simulateCache({gap:8,ttl:60})[1].hit,true);
});
test('agent turns account for reads, writes, and uncached input',()=>{
 const rows=agentTurns({turns:3});
 assert.deepEqual(rows.map(r=>r.write),[80000,0,0]);
 assert.deepEqual(rows.map(r=>r.cached),[0,80000,80000]);
 assert.equal(rows[1].cost,price('sol',2000,0,80000,3000));
 assert.equal(agentTurns({turns:2,cache:false})[1].fresh,82000);
});
