(function(root){'use strict';
const words=s=>(s.normalize('NFC').replace(/^\s*(?:[\p{N}]+[.)،]|[-•])\s+/gmu,'').match(/\p{N}+(?:[.,٫٬:/\-–]\p{N}+)*|[\p{L}][\p{L}\p{M}\p{N}]*(?:[’'][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*/gu)||[]);
const norm=s=>s.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase();
function analyze(text,duration=30,wpm=170){
 if(![15,20,30,45,60].includes(duration)||![150,170,190].includes(wpm))throw new Error('Invalid settings');
 if(typeof text!=='string'||text.length>20000)throw new Error('Text exceeds limit');
 const raw=text.split(/\r\n|\r|\n/).map(s=>s.trim()).filter(s=>words(s).length);let elapsed=0;
 const lines=raw.map((text,i)=>{const count=words(text).length,seconds=count/wpm*60,start=elapsed;elapsed+=seconds;return {text,count,seconds,start,long:count>14,short:i>0&&count<3,hook:i===0&&seconds>3};});
 const total=lines.reduce((n,l)=>n+l.count,0),target=Math.round(duration*wpm/60),difference=elapsed-duration;
 const first=lines[0]?.text||'',last=lines.at(-1)?.text||'';
 const stop=new Set(['هذا','هذه','ذلك','تلك','الذي','التي','كان','كانت','علي','الي','هنا','هناك','وهو','وهي','انه','انها','لان','لكن','عشان','وده','ودي','اللي','ده','دي','ديه','دول','داه','كده','وكده','علشان','عشان','بتاع','بتاعت','يعني','برضه','كمان','بقي','بس','مش','احنا','انت','انتي']);
 const lastWords=new Set(words(norm(last))),shared=[...new Set(words(norm(first)).filter(w=>w.length>2&&!stop.has(w)&&!/^\p{N}/u.test(w)&&lastWords.has(w)))];
 return {lines,total,target,seconds:elapsed,delta:Math.abs(target-total),verdict:!total?'empty':Math.abs(difference)<=duration*.07?'ok':difference>0?'long':'short',shared,open:lines.length>1&&!/[.!؟?،,؛;:…][^\p{L}\p{N}]*$/u.test(last),first,last};
}
const api={words,norm,analyze};if(typeof module!=='undefined')module.exports=api;else root.Shorts=api;
})(globalThis);
