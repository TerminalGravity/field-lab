export const MODELS = {
  sol: { name:'GPT-6 Sol', short:'Sol', role:'Default workhorse', pin:2, write:2.5, read:.20, out:10, family:'OpenAI', color:'#6db8a6' },
  opus: { name:'Claude Opus 5.5', short:'Opus 5.5', role:'Long-running agent', pin:4, write:5, read:.20, out:20, family:'Anthropic', color:'#d8aa7a', write1h:8 },
  luna: { name:'GPT-6 Luna', short:'Luna', role:'Volume & cheap loops', pin:.10, write:.125, read:.01, out:.50, family:'OpenAI', color:'#b5b8ee' },
  astra: { name:'GPT-6 Astra', short:'Astra', role:'Maximum quality', pin:10, write:12.5, read:1, out:50, family:'OpenAI', color:'#9aa9f4' },
  fable: { name:'Claude Fable 5.1', short:'Fable 5.1', role:'Maximum quality', pin:10, write:12.5, read:.25, out:50, family:'Anthropic', color:'#e7b499', write1h:20 },
  sonnet: { name:'Claude Sonnet 5', short:'Sonnet 5', role:'Default workhorse', pin:2, write:2.5, read:.10, out:10, family:'Anthropic', color:'#cbb2dc', write1h:4 },
};
export const SOURCES = [
  ['Claude Opus 5.5 overview','https://platform.claude.com/docs/en/models/opus-5-5/overview'],
  ['Claude prompt caching','https://platform.claude.com/docs/en/build-with-claude/prompt-caching'],
  ['Claude tools + caching','https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching'],
  ['Manage tool context','https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context'],
  ['OpenAI pricing','https://developers.openai.com/api/docs/pricing'],
  ['OpenAI prompt caching','https://developers.openai.com/api/docs/guides/prompt-caching'],
  ['OpenAI cache diagnostics','https://developers.openai.com/api/docs/guides/prompt-caching/diagnostics'],
  ['GPT-6 Sol / Luna announcement','https://openai.com/index/introducing-gpt-6-sol-and-luna/'],
  ['Claude Opus 5.5 launch','https://www.anthropic.com/claude-opus-5-5'],
];
export const WEEKS = [
 { title:'Tokens & the bill', kicker:'01 / THE FOUNDATION', description:'Learn what gets metered, then price three workloads before they run.', duration:'35 min', concepts:[
  ['Input is everything you send','Prompts, tool definitions, tool results, and conversation history all count. A growing agent can resend a lot of context.'],
  ['Output includes the invisible work','Reasoning tokens may not appear in the final answer, but are billed as output. Measure actual usage, not visible words.'],
  ['A cache write is not a discount','A 5-minute write usually costs 1.25× ordinary input. You recover it on later reads; a one-off prefix costs more.'],
  ['Prices are workload-dependent','Batch/Flex and fast modes can change price and latency. Verify eligibility and current rates before budgeting.']
 ], exercise:'Use the cost studio to price a chat, a one-shot repository read, and a 20-turn agent. Compare uncached input to write-once/read-many.', question:'Why is “40% cheaper workloads” different from “20% cheaper list price”?', options:['Workload cost also depends on cache reuse and output tokens','Every model has a fixed price per request','Cache reads are always free'], correct:0, explanation:'List price is only the rate card. The token mix—fresh input, writes, reads, and output—determines actual spend.' },
 { title:'Prompt caching', kicker:'02 / THE LEVER', description:'Design a stable prefix, watch a cache hit, then break it on purpose.', duration:'45 min', concepts:[
  ['The prefix must match','A change near the beginning invalidates reuse after the change. Keep stable tools and system instructions before dynamic user content.'],
  ['TTL is renewed on a hit','Claude defaults to 5 minutes; GPT-5.6+ OpenAI caching uses a 30-minute minimum lifetime. A hit refreshes eligibility.'],
  ['Breakpoints are deliberate','Claude offers automatic or explicit cache control. GPT-5.6+ supports implicit and explicit modes. Put breakpoints after stable blocks.'],
  ['Instrument, do not infer','Read Claude cache_read_input_tokens / cache_creation_input_tokens or OpenAI cached_tokens / cache_write_tokens from usage.']
 ], exercise:'Run the ten-call prefix simulator. Then change a word in the system block and observe the miss. Compare 5-minute and 1-hour Claude writes across an 8-minute gap.', question:'What is the first place to look when a formerly cached agent suddenly misses?', options:['Whether the early tools/system prefix changed','The visible answer length','The user’s browser cache'], correct:0, explanation:'A change before the breakpoint prevents the old cached prefix from matching.' },
 { title:'The model ladder', kicker:'03 / THE DECISION', description:'Route by task, then escalate only when a measured evaluation fails.', duration:'30 min', concepts:[
  ['Luna is for volume','Classification, extraction, and high-QPS loops benefit from its very low per-token rates.'],
  ['Sol or Sonnet is the default','Start routine product features on a workhorse; benchmark on representative tasks.'],
  ['Opus is an agent candidate','Opus 5.5 combines $4/$20 list prices with $0.20/M cache reads for long, reuse-heavy sessions.'],
  ['Astra and Fable are escalations','Reserve maximum-quality tiers for jobs where cheaper candidates fail your eval. Their agent economics diverge on cache reads.']
 ], exercise:'Choose a workload in the routing desk, inspect the recommendation, then compare the same workload across models in the cost studio.', question:'A 200-turn agent reuses a large prefix. Which rate should you inspect before comparing Astra and Fable?', options:['Cached input price per million tokens','Only the list input rate','Only the context window'], correct:0, explanation:'Their list rates match at $10/$50, but the cited short-context cache-read rates differ: $1.00 vs $0.25 per million.' },
 { title:'Agent economics', kicker:'04 / THE PRACTICE', description:'Control the silent cost: repeated prefixes, growing tool results, and hidden output.', duration:'45 min', concepts:[
  ['An agent is a loop, not one request','Repeated cache reads, fresh tool results, and output on each turn produce the bill.'],
  ['Effort can raise output','Higher reasoning effort often adds hidden output tokens. Treat it as a quality/cost experiment, not a free toggle.'],
  ['Edit context selectively','Drop stale tool results, defer irrelevant tools, and measure whether compaction saves more fresh tokens than it loses in cache hits.'],
  ['Log each turn','Capture model, effort, input, cache read/write, output, and calculated dollars. Compare one variable at a time.']
 ], exercise:'Run the agent lab. Change effort, tool count, and model separately. Export a per-turn CSV, then run the API lab guide with your own keys in your own environment.', question:'What should you compare after compacting agent history?', options:['Total billed cost and quality before vs after','Only the cache-hit percentage','Only the length of the final answer'], correct:0, explanation:'Compaction can lower token count while reducing cache reuse. The net bill and task outcome decide whether it helped.' }
];
export function price(model, fresh=0, write=0, read=0, out=0, oneHour=false){
 const m=typeof model==='string'?MODELS[model]:model;
 return (fresh*m.pin + write*(oneHour&&m.write1h?m.write1h:m.write) + read*m.read + out*m.out)/1_000_000;
}
export function workload(type, prefix=80000, turns=20, fresh=2000, output=3000){
 if(type==='chat') return {fresh:2000,write:0,read:0,out:500};
 if(type==='repo') return {fresh:80000,write:0,read:0,out:8000};
 return {fresh:turns*fresh,write:prefix,read:Math.max(0,turns-1)*prefix,out:turns*output};
}
export function simulateCache({calls=10,prefix=4000,newTokens=200,output=300,breakAt=0,ttl=5,gap=1,model='opus'}={}){
 let cacheUntil=-1, clock=0, rows=[];
 for(let i=1;i<=calls;i++){
  if(i>1) clock+=gap;
  if(i===breakAt) cacheUntil=-1;
  const hit=clock<cacheUntil;
  const row={turn:i,minute:clock,hit,fresh:newTokens,write:hit?0:prefix,read:hit?prefix:0,out:output,changed:i===breakAt};
  row.cost=price(model,row.fresh,row.write,row.read,row.out,ttl===60);
  rows.push(row); cacheUntil=clock+ttl;
 }
 return rows;
}
export function agentTurns({model='sol',prefix=80000,turns=15,fresh=2000,output=3000,effort='medium',tools=3,cache=true}={}){
 const factor={low:.6,medium:1,high:1.6,xhigh:2.3}[effort]||1;
 const context=prefix+Math.max(0,tools-3)*250;
 return Array.from({length:turns},(_,i)=>{
  const row={turn:i+1,model,effort,input:context+fresh,cached:cache&&i>0?context:0,write:cache&&i===0?context:0,fresh:fresh+(!cache?context:0),output:Math.round(output*factor)};
  row.cost=price(model,row.fresh,row.write,row.cached,row.output); return row;
 });
}
