import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTrace, summarize, compareCandidates, estimateLocalCost} from '../src/platform.js';

test('parses OpenAI usage without double-counting cache writes',()=>{
 const rows=parseTrace(JSON.stringify([{model:'gpt-6-sol',usage:{input_tokens:5000,input_tokens_details:{cached_tokens:3000,cache_write_tokens:1000},output_tokens:500}}]));
 assert.deepEqual(rows.map(({fresh,write,read,out,model})=>({fresh,write,read,out,model})),[{fresh:1000,write:1000,read:3000,out:500,model:'sol'}]);
});
test('parses Anthropic usage with separate cache categories',()=>{
 const rows=parseTrace(JSON.stringify({model:'claude-opus-5-5',usage:{input_tokens:200,cache_creation_input_tokens:4000,cache_creation:{ephemeral_5m_input_tokens:4000,ephemeral_1h_input_tokens:0},cache_read_input_tokens:0,output_tokens:700}}));
 assert.deepEqual([rows[0].fresh,rows[0].write,rows[0].read,rows[0].out],[200,4000,0,700]);
});
test('prices one-hour Claude writes at the one-hour rate',()=>{
 const rows=parseTrace(JSON.stringify({model:'claude-opus-5-5',usage:{input_tokens:0,cache_creation_input_tokens:1000000,cache_creation:{ephemeral_5m_input_tokens:0,ephemeral_1h_input_tokens:1000000},cache_read_input_tokens:0,output_tokens:0}}));
 assert.equal(rows[0].estimatedUSD,8);
 assert.equal(rows[0].write1h,1000000);
 assert.throws(()=>parseTrace(JSON.stringify({model:'claude-opus-5-5',usage:{input_tokens:0,cache_creation_input_tokens:100,cache_read_input_tokens:0,output_tokens:0}})),/TTL breakdown/);
});
test('rejects overlapping counts and unknown model instead of inventing a price',()=>{
 assert.throws(()=>parseTrace(JSON.stringify({model:'gpt-6-sol',usage:{input_tokens:100,input_tokens_details:{cached_tokens:90,cache_write_tokens:20},output_tokens:1}})),/exceed/);
 assert.throws(()=>parseTrace(JSON.stringify({model:'unknown',usage:{input_tokens:1,output_tokens:1}})),/Unsupported model/);
});
test('summarizes imported records at documented prices',()=>{
 const rows=parseTrace(JSON.stringify([{model:'gpt-6-sol',usage:{input_tokens:5000,input_tokens_details:{cached_tokens:3000,cache_write_tokens:1000},output_tokens:500}}]));
 const report=summarize(rows);
 assert.equal(report.turns,1);assert.equal(report.input,5000);assert.equal(report.estimatedUSD,.0101);
 assert.equal(report.cacheShare,.6);
});
test('compares candidate outcomes by quality and true cost basis',()=>{
 const result=compareCandidates([{label:'Cloud',cost:.02,quality:true,latencyMs:900},{label:'Local',cost:.01,quality:false,latencyMs:300}]);
 assert.equal(result.preferred,'Cloud');
 assert.equal(result.rows[1].eligible,false);
});
test('local cost includes amortized hardware and electricity, not zero',()=>{
 assert.equal(estimateLocalCost({hardwareUSD:1000,lifeHours:1000,watts:100,powerUSDPerKwh:.2,latencyMs:3600000}),1.02);
 assert.throws(()=>estimateLocalCost({hardwareUSD:1000,lifeHours:0,watts:100,powerUSDPerKwh:.2,latencyMs:1}),/lifeHours/);
});
