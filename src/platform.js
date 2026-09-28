import {MODELS,price} from './course.js';
const ALIASES={...Object.fromEntries(Object.entries(MODELS).flatMap(([key,value])=>[[key,key],[value.name.toLowerCase(),key],[value.name.toLowerCase().replaceAll(' ','-'),key]])),'gpt-6-sol':'sol','gpt-6-luna':'luna','gpt-6-astra':'astra','claude-opus-5-5':'opus','claude-fable-5-1':'fable','claude-sonnet-5':'sonnet'};
const asCount=(value,label)=>{const n=Number(value??0);if(!Number.isSafeInteger(n)||n<0)throw Error(`Invalid ${label}: expected nonnegative integer`);return n};
export function normalizeModel(name){const key=ALIASES[String(name||'').toLowerCase()];if(!key)throw Error(`Unsupported model: ${name||'(missing)'}. Use a listed short-context model.`);return key}
export function parseTrace(text){
 if(text.length>1000000)throw Error('Trace exceeds the 1 MB browser limit');
 let value;try{value=JSON.parse(text)}catch{throw Error('Import a JSON usage object or array; CSV is not yet supported')}
 const entries=Array.isArray(value)?value:[value];if(!entries.length||entries.length>500)throw Error('Import 1–500 usage records');
 return entries.map((entry,index)=>{
  if(!entry||typeof entry!=='object')throw Error(`Record ${index+1} is not an object`);
  const model=normalizeModel(entry.model),usage=entry.usage||entry;
  let fresh,write,write1h=0,read,out;
  if('cache_creation_input_tokens' in usage||'cache_read_input_tokens' in usage){
   fresh=asCount(usage.input_tokens,'input_tokens');write=asCount(usage.cache_creation_input_tokens,'cache_creation_input_tokens');read=asCount(usage.cache_read_input_tokens,'cache_read_input_tokens');out=asCount(usage.output_tokens,'output_tokens');
   if(write){
    if(!usage.cache_creation)throw Error(`Record ${index+1}: Claude cache write TTL breakdown is required for accurate pricing`);
    const five=asCount(usage.cache_creation.ephemeral_5m_input_tokens,'ephemeral_5m_input_tokens');
    write1h=asCount(usage.cache_creation.ephemeral_1h_input_tokens,'ephemeral_1h_input_tokens');
    if(five+write1h!==write)throw Error(`Record ${index+1}: cache creation TTL breakdown does not equal total write tokens`);
   }
  }else{
   const input=asCount(usage.input_tokens??usage.input,'input_tokens');
   const detail=usage.input_tokens_details||usage;
   read=asCount(detail.cached_tokens??usage.cached,'cached_tokens');write=asCount(detail.cache_write_tokens??usage.cache_write,'cache_write_tokens');out=asCount(usage.output_tokens??usage.output,'output_tokens');
   if(read+write>input)throw Error(`Record ${index+1}: cached and write tokens exceed total input`);
   fresh=input-read-write;
  }
  return {model,fresh,write,write1h,read,out,estimatedUSD:price(model,fresh,write-write1h,read,out)+price(model,0,write1h,0,0,true),source:'imported usage'};
 });
}
export function summarize(rows){
 const total=(key)=>rows.reduce((n,row)=>n+row[key],0),fresh=total('fresh'),write=total('write'),read=total('read'),out=total('out'),input=fresh+write+read;
 return {turns:rows.length,fresh,write,write1h:total('write1h'),read,out,input,cacheShare:input?read/input:0,estimatedUSD:rows.reduce((n,row)=>n+row.estimatedUSD,0)};
}
export function estimateLocalCost({hardwareUSD,lifeHours,watts,powerUSDPerKwh,latencyMs}){
 for(const [key,value] of Object.entries({hardwareUSD,lifeHours,watts,powerUSDPerKwh,latencyMs}))if(!Number.isFinite(Number(value))||Number(value)<0)throw Error(`Invalid ${key}`);
 if(Number(lifeHours)<=0)throw Error('lifeHours must exceed zero');
 const hours=Number(latencyMs)/3600000;
 return hours*(Number(hardwareUSD)/Number(lifeHours)+Number(watts)/1000*Number(powerUSDPerKwh));
}
export function compareCandidates(candidates){
 const rows=candidates.map(c=>({...c,eligible:c.quality===true&&Number.isFinite(c.cost)&&c.cost>=0}));
 const valid=rows.filter(c=>c.eligible).sort((a,b)=>a.cost-b.cost||a.latencyMs-b.latencyMs);
 return {rows,preferred:valid[0]?.label??null};
}
