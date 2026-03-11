import { useState, useEffect, useRef, useCallback } from "react";
import { QUESTION_BANK, PATTERN_GUIDES, TOPICS, BOILERPLATE } from "./data.js";

const API = import.meta.env.VITE_API_URL || "https://vertex-backend-1.onrender.com";
const apiFetch = {
  get: async (p) => { const r = await fetch(`${API}${p}`); if(!r.ok) throw new Error(await r.text()); return r.json(); },
  post: async (p, b) => { const r = await fetch(`${API}${p}`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}); if(!r.ok) throw new Error(await r.text()); return r.json(); },
};
const DARK = { bg:"#09090f", surface:"#0f0f18", card:"#13131e", border:"#1e1e2e", borderH:"#3a3a5c", accent:"#5b8af5", accentS:"#0d1a3d", text:"#f0f0f8", sub:"#7070a0", muted:"#3a3a55", ok:"#34d399", okS:"#052016", bad:"#f87171", badS:"#260a0a", warn:"#f59e0b", warnS:"#1a1200" };
const LIGHT = { bg:"#f4f4fb", surface:"#ffffff", card:"#ffffff", border:"#dcdcea", borderH:"#9999cc", accent:"#3b6fe0", accentS:"#e2ebff", text:"#0a0a18", sub:"#50507a", muted:"#b0b0cc", ok:"#10b981", okS:"#e0faf2", bad:"#ef4444", badS:"#fef0f0", warn:"#d97706", warnS:"#fffbea" };

const QUIZ_POOL = [
  {q:"Find the longest substring with at most K distinct characters.",opts:["Binary Search","Sliding Window","Prefix Sum","Two Pointers"],ans:1,pat:"Sliding Window",why:"Expand/contract window to maintain ≤K distinct chars."},
  {q:"Two sum in a sorted array — find pair summing to target.",opts:["Sliding Window","DFS","Two Pointers","Heap"],ans:2,pat:"Two Pointers",why:"Sorted + pair sum = converging two-pointer from both ends."},
  {q:"Count subarrays with sum equal to K.",opts:["Two Pointers","Sliding Window","Prefix Sum","Binary Search"],ans:2,pat:"Prefix Sum",why:"Store prefix sums in hashmap; check if (sum−K) exists."},
  {q:"K-th largest element in an unsorted array.",opts:["DFS","Heap","Sliding Window","Prefix Sum"],ans:1,pat:"Heap",why:"Min-heap of size K: top = K-th largest."},
  {q:"Check if a binary tree is a valid BST.",opts:["BFS","Heap","DFS","Two Pointers"],ans:2,pat:"DFS",why:"DFS propagates valid (min, max) range top-down."},
  {q:"Find all anagram positions of pattern P in string S.",opts:["Sliding Window","Prefix Sum","Binary Search","Heap"],ans:0,pat:"Sliding Window",why:"Fixed-size window with character frequency comparison."},
  {q:"Peak index in a mountain array in O(log n).",opts:["DFS","Two Pointers","Binary Search","Sliding Window"],ans:2,pat:"Binary Search",why:"If nums[mid] < nums[mid+1], peak is to the right."},
  {q:"Level-by-level traversal of a binary tree.",opts:["DFS","BFS","Two Pointers","Prefix Sum"],ans:1,pat:"BFS",why:"Queue processes nodes level by level."},
  {q:"Minimum meeting rooms required for N intervals.",opts:["Prefix Sum","Binary Search","Sliding Window","Heap"],ans:3,pat:"Heap",why:"Min-heap tracks end times; peak size = rooms needed."},
  {q:"Minimum element in a rotated sorted array.",opts:["Binary Search","Two Pointers","Sliding Window","DFS"],ans:0,pat:"Binary Search",why:"Compare nums[mid] with nums[right] to find unsorted half."},
  {q:"Check if there is a cycle in a linked list.",opts:["DFS","Two Pointers","Prefix Sum","Heap"],ans:1,pat:"Two Pointers",why:"Floyd's cycle detection: fast and slow pointers."},
  {q:"Maximum product subarray.",opts:["Sliding Window","DP","Prefix Sum","Two Pointers"],ans:1,pat:"Dynamic Programming",why:"Track both max and min at each step due to negatives."},
  {q:"Number of paths from top-left to bottom-right in a grid.",opts:["BFS","Binary Search","Dynamic Programming","DFS"],ans:2,pat:"Dynamic Programming",why:"dp[i][j] = dp[i-1][j] + dp[i][j-1]."},
  {q:"Shortest path in unweighted graph.",opts:["DFS","Heap","BFS","Binary Search"],ans:2,pat:"BFS",why:"BFS visits nodes layer by layer — first visit = shortest path."},
  {q:"Remove Nth node from end of linked list.",opts:["DFS","Prefix Sum","Binary Search","Two Pointers"],ans:3,pat:"Two Pointers",why:"Advance fast pointer N steps first, then move both."},
  {q:"Merge K sorted lists efficiently.",opts:["Sliding Window","Heap","DFS","Two Pointers"],ans:1,pat:"Heap",why:"Min-heap compares heads of all K lists simultaneously."},
  {q:"Subarray sum equals K using O(n) time.",opts:["Sliding Window","Binary Search","Prefix Sum","DFS"],ans:2,pat:"Prefix Sum",why:"HashMap stores prefix counts. If prefix[i]-K exists, found subarray."},
  {q:"Detect and return cycle start in linked list.",opts:["DFS","Two Pointers","Heap","Sliding Window"],ans:1,pat:"Two Pointers",why:"Floyd's: after meeting, move one to head. They meet at cycle start."},
  {q:"Find if string can be broken into dictionary words.",opts:["BFS","Heap","Two Pointers","Dynamic Programming"],ans:3,pat:"Dynamic Programming",why:"dp[i]=true if s[0..i] segments using dict."},
  {q:"All permutations of an array.",opts:["BFS","DFS + Backtracking","Sliding Window","Dynamic Programming"],ans:1,pat:"DFS",why:"Backtracking: swap in, recurse, swap back."},
];

function Spinner({ T, size=14 }) {
  return <span style={{display:"inline-block",width:size,height:size,border:`2px solid ${T.muted}`,borderTopColor:T.accent,borderRadius:"50%",animation:"vspin 0.65s linear infinite",flexShrink:0}} />;
}
function Chip({ label, color, bg }) {
  return <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.04em",padding:"2px 8px",borderRadius:4,background:bg,color,fontFamily:"'DM Mono',monospace"}}>{label}</span>;
}
function DiffChip({ d, T }) {
  const m={Easy:[T.ok,T.okS],Medium:[T.warn,T.warnS],Hard:[T.bad,T.badS]};
  const [c,b]=m[d]||[T.muted,T.border];
  return <Chip label={d} color={c} bg={b}/>;
}
function Btn({ children, onClick, variant="default", disabled, T, style={} }) {
  const [h,setH]=useState(false);
  const s={default:{bg:h?T.border:T.surface,col:h?T.text:T.sub,bd:T.border},primary:{bg:h?"#4070d0":T.accent,col:"#fff",bd:"transparent"},ok:{bg:h?T.ok+"30":T.okS,col:T.ok,bd:T.ok+"40"},bad:{bg:h?T.bad+"30":T.badS,col:T.bad,bd:T.bad+"40"},warn:{bg:h?T.warn+"30":T.warnS,col:T.warn,bd:T.warn+"40"},ghost:{bg:"transparent",col:h?T.text:T.sub,bd:"transparent"}}[variant]||{bg:T.surface,col:T.sub,bd:T.border};
  return <button onClick={disabled?undefined:onClick} onMouseEnter={()=>!disabled&&setH(true)} onMouseLeave={()=>setH(false)} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${s.bd}`,background:s.bg,color:s.col,cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,transition:"all 0.15s",opacity:disabled?0.4:1,display:"flex",alignItems:"center",gap:6,...style}}>{children}</button>;
}

function Topbar({ topView, setTopView, dark, setDark, T, onSearch }) {
  return (
    <div style={{height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",borderBottom:`1px solid ${T.border}`,background:T.surface,position:"sticky",top:0,zIndex:100,flexShrink:0}}>
      <div onClick={()=>setTopView("topics")} style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",userSelect:"none"}}>
        <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.accent},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontWeight:900,fontSize:10,color:"#fff"}}>Vx</span>
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:16,color:T.text,letterSpacing:"-0.04em"}}>Vertex</span>
      </div>
      <div style={{display:"flex",gap:2,background:T.bg,borderRadius:8,padding:3}}>
        {[["topics","Topics"],["quiz","Quiz"]].map(([id,l])=>(
          <button key={id} onClick={()=>setTopView(id)} style={{padding:"5px 18px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,background:topView===id?T.accent:"transparent",color:topView===id?"#fff":T.sub,transition:"all 0.2s"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSearch} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.sub,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}} onMouseLeave={e=>{e.currentTarget.style.color=T.sub;e.currentTarget.style.borderColor=T.border;}}>Search</button>
        <button onClick={()=>setDark(d=>!d)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.sub,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.sub}>{dark?"Light":"Dark"}</button>
      </div>
    </div>
  );
}

function SearchModal({ T, onClose, onSelect }) {
  const [q,setQ]=useState("");
  const all=Object.values(QUESTION_BANK).flat();
  const filtered=q.length>1?all.filter(p=>p.title.toLowerCase().includes(q.toLowerCase())||p.pattern.toLowerCase().includes(q.toLowerCase())||p.topic.toLowerCase().includes(q.toLowerCase())):[];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.borderH}`,borderRadius:16,width:520,maxHeight:460,display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search problems, patterns, topics..." style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:"'DM Mono',monospace",fontSize:14,color:T.text,padding:0}} />
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {q.length<=1&&<div style={{padding:28,textAlign:"center",color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:12}}>Type to search 80+ problems</div>}
          {q.length>1&&filtered.length===0&&<div style={{padding:28,textAlign:"center",color:T.muted,fontFamily:"'DM Mono',monospace",fontSize:12}}>No results</div>}
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>{onSelect(p);onClose();}} style={{padding:"12px 20px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,transition:"background 0.12s"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{flex:1}}><div style={{fontSize:13,color:T.text,fontWeight:500}}>{p.title}</div><div style={{fontSize:11,color:T.sub,fontFamily:"'DM Mono',monospace",marginTop:2}}>{p.topic} · {p.pattern}</div></div>
              <DiffChip d={p.difficulty} T={T}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCanvas({ dark }) {
  const canvasRef=useRef(null);
  const stateRef=useRef({scene:0,t:0,trail:[],starfield:[],graphNodes:[],graphEdges:[],lastTime:0});
  const [sceneIdx,setSceneIdx]=useState(0);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    const S=stateRef.current;
    S.starfield=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:0.5+Math.random()*1.5,twinkle:Math.random()*Math.PI*2}));
    S.graphNodes=[{x:0.5,y:0.28},{x:0.28,y:0.55},{x:0.72,y:0.55},{x:0.18,y:0.78},{x:0.42,y:0.82},{x:0.58,y:0.78},{x:0.82,y:0.72}];
    S.graphEdges=[[0,1],[0,2],[1,2],[1,3],[1,4],[2,5],[2,6],[3,4],[4,5],[5,6]];
    const DUR=5000; let raf, sceneStart=performance.now();
    const draw=(now)=>{
      canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
      const W=canvas.width,H=canvas.height;
      const elapsed=now-sceneStart,sp=elapsed/DUR;
      const dt=now-S.lastTime; S.lastTime=now; S.t+=dt*0.001;
      if(sp>=1){S.scene=(S.scene+1)%3;setSceneIdx(S.scene);sceneStart=now;S.trail=[];raf=requestAnimationFrame(draw);return;}
      const fa=sp<0.12?sp/0.12:sp>0.85?(1-sp)/0.15:1;
      ctx.clearRect(0,0,W,H);
      if(S.scene===0){
        const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#020610");sky.addColorStop(1,"#0f1820");
        ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
        S.starfield.forEach(s=>{const tw=0.4+0.6*Math.sin(S.t*1.5+s.twinkle);ctx.beginPath();ctx.arc(s.x*W,s.y*H*0.7,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(200,220,255,${0.3*tw*fa})`;ctx.fill();});
        const dm=(pts,fc)=>{ctx.beginPath();ctx.moveTo(0,H);pts.forEach(([px,py])=>ctx.lineTo(px*W,py*H));ctx.lineTo(W,H);ctx.closePath();ctx.fillStyle=fc;ctx.fill();};
        dm([[0,0.72],[0.08,0.52],[0.15,0.42],[0.22,0.5],[0.3,0.32],[0.38,0.44],[0.48,0.28],[0.55,0.40],[0.65,0.22],[0.72,0.36],[0.82,0.30],[0.9,0.42],[1,0.55]],"rgba(15,20,40,0.9)");
        dm([[0,0.78],[0.05,0.62],[0.12,0.54],[0.2,0.60],[0.28,0.48],[0.36,0.58],[0.45,0.42],[0.52,0.54],[0.6,0.40],[0.68,0.50],[0.78,0.44],[0.88,0.56],[1,0.62]],"rgba(20,28,55,0.95)");
        dm([[0,0.85],[0.1,0.72],[0.18,0.65],[0.25,0.72],[0.35,0.60],[0.42,0.70],[0.5,0.58],[0.58,0.68],[0.68,0.62],[0.75,0.70],[0.85,0.65],[0.92,0.72],[1,0.70]],"rgba(25,35,65,0.98)");
        const ap=Math.max(0,(sp-0.05)/0.80);
        if(ap>0){
          const bz=(t,a,b,c)=>(1-t)*(1-t)*a+2*(1-t)*t*b+t*t*c;
          const p0=[W*0.35,H*0.72],p1=[W*0.45,H*0.3],p2=[W*0.58,H*-0.15];
          const ax=bz(ap,p0[0],p1[0],p2[0]),ay=bz(ap,p0[1],p1[1],p2[1]);
          const axP=bz(Math.max(0,ap-0.02),p0[0],p1[0],p2[0]),ayP=bz(Math.max(0,ap-0.02),p0[1],p1[1],p2[1]);
          const angle=Math.atan2(ay-ayP,ax-axP);
          S.trail.push({x:ax,y:ay}); if(S.trail.length>60) S.trail.shift();
          S.trail.forEach((pt,i)=>{const age=i/S.trail.length;ctx.beginPath();ctx.arc(pt.x,pt.y,3*(1-age)*2,0,Math.PI*2);ctx.globalAlpha=age*0.6*fa;ctx.fillStyle=age>0.6?"#ff9a00":age>0.3?"#ff3300":"#6600ff";ctx.fill();ctx.globalAlpha=1;});
          const glow=ctx.createRadialGradient(ax,ay,0,ax,ay,30);glow.addColorStop(0,`rgba(255,160,50,${0.5*fa})`);glow.addColorStop(1,"transparent");
          ctx.beginPath();ctx.arc(ax,ay,30,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
          ctx.save();ctx.translate(ax,ay);ctx.rotate(angle);
          ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,6);ctx.lineTo(-3,0);ctx.lineTo(-6,-6);ctx.closePath();
          ctx.fillStyle=`rgba(255,200,80,${fa})`;ctx.fill();ctx.restore();
        }
      }
      if(S.scene===1){
        const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#04040e");bg.addColorStop(1,"#0a0818");
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
        [[0.25,0.4,80,"#4060ff"],[0.7,0.3,60,"#800080"],[0.5,0.7,50,"#0080ff"]].forEach(([nx,ny,nr,nc])=>{const ng=ctx.createRadialGradient(nx*W,ny*H,0,nx*W,ny*H,nr);ng.addColorStop(0,nc+"33");ng.addColorStop(1,"transparent");ctx.beginPath();ctx.arc(nx*W,ny*H,nr,0,Math.PI*2);ctx.fillStyle=ng;ctx.fill();});
        S.starfield.forEach(s=>{const tw=0.4+0.6*Math.sin(S.t*2+s.twinkle);ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,200,255,${0.5*tw*fa})`;ctx.fill();});
        const pulse=1+0.04*Math.sin(S.t*2);
        ctx.save();ctx.font=`bold ${Math.round(72*pulse)}px 'DM Mono',monospace`;ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.shadowColor="#5b8af5";ctx.shadowBlur=40*fa;ctx.fillStyle=`rgba(100,180,255,${0.85*fa})`;ctx.fillText("< / >",W/2,H/2);ctx.shadowBlur=0;ctx.restore();
      }
      if(S.scene===2){
        const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#030508");bg.addColorStop(1,"#080e18");
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
        ctx.strokeStyle="rgba(79,142,247,0.04)";ctx.lineWidth=1;
        for(let gx=0;gx<W;gx+=32){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
        for(let gy=0;gy<H;gy+=32){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
        const nR=Math.min(sp/0.6,1),eR=Math.max(0,(sp-0.3)/0.5);
        S.graphEdges.forEach(([a,b],i)=>{if(!eR)return;const eP=Math.min(eR*S.graphEdges.length-i,1);if(eP<=0)return;const n1=S.graphNodes[a],n2=S.graphNodes[b];const ex=n1.x*W+(n2.x-n1.x)*W*eP,ey=n1.y*H+(n2.y-n1.y)*H*eP;const eg=ctx.createLinearGradient(n1.x*W,n1.y*H,n2.x*W,n2.y*H);eg.addColorStop(0,`rgba(79,142,247,${0.5*fa})`);eg.addColorStop(1,`rgba(79,142,247,${0.2*fa})`);ctx.beginPath();ctx.moveTo(n1.x*W,n1.y*H);ctx.lineTo(ex,ey);ctx.strokeStyle=eg;ctx.lineWidth=1.5;ctx.stroke();});
        S.graphNodes.forEach((node,i)=>{const nP=Math.min(nR*S.graphNodes.length-i,1);if(nP<=0)return;const nx=node.x*W,ny=node.y*H;const gr=ctx.createRadialGradient(nx,ny,0,nx,ny,20);gr.addColorStop(0,`rgba(79,142,247,${0.3*nP*fa})`);gr.addColorStop(1,"transparent");ctx.beginPath();ctx.arc(nx,ny,20,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();ctx.beginPath();ctx.arc(nx,ny,7*nP,0,Math.PI*2);ctx.fillStyle=`rgba(79,142,247,${0.9*nP*fa})`;ctx.fill();ctx.beginPath();ctx.arc(nx,ny,4*nP,0,Math.PI*2);ctx.fillStyle=`rgba(200,220,255,${0.9*nP*fa})`;ctx.fill();});
      }
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf);
  },[dark]);
  const SCENES=[{label:"</>",tag:"Code. Pattern. Master."},{label:"{ }",tag:"Think in Patterns."},{label:"=>",tag:"Connect the Dots."}];
  return (
    <div style={{position:"relative",width:"100%",height:300,overflow:"hidden",background:"#07070a",flexShrink:0}}>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,pointerEvents:"none"}}>
        <div style={{fontSize:52,fontWeight:900,fontFamily:"'DM Mono',monospace",color:"rgba(200,220,255,0.92)",letterSpacing:"-0.04em",filter:"drop-shadow(0 0 24px rgba(100,150,255,0.6))",lineHeight:1,transition:"opacity 0.4s"}}>{SCENES[sceneIdx].label}</div>
        <div style={{fontSize:17,fontWeight:700,color:"rgba(200,220,255,0.85)",fontFamily:"'Syne',sans-serif",transition:"opacity 0.4s"}}>{SCENES[sceneIdx].tag}</div>
        <p style={{fontSize:13,color:"rgba(150,170,210,0.7)",textAlign:"center",maxWidth:460,lineHeight:1.7,margin:0}}>AI-powered DSA practice. Learn patterns, solve real problems, get instant code review.</p>
        <div style={{display:"flex",gap:6,marginTop:4}}>{SCENES.map((_,i)=><div key={i} style={{width:i===sceneIdx?20:6,height:6,borderRadius:3,background:i===sceneIdx?"rgba(100,160,255,0.9)":"rgba(100,120,200,0.3)",transition:"all 0.4s"}}/>)}</div>
      </div>
    </div>
  );
}

function TopicsPage({ T, dark, onTopicClick }) {
  return (
    <div>
      <HeroCanvas dark={dark}/>
      <div style={{padding:"40px 40px 48px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{marginBottom:36}}><h1 style={{margin:"0 0 8px",fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.04em"}}>Topics</h1><p style={{margin:0,fontSize:14,color:T.sub}}>Choose a topic to explore patterns and problems.</p></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          {TOPICS.map(t=><TopicCard key={t.id} topic={t} onClick={()=>onTopicClick(t)} T={T}/>)}
        </div>
      </div>
    </div>
  );
}
function TopicCard({ topic, onClick, T }) {
  const [h,setH]=useState(false);
  const count=Object.entries(QUESTION_BANK).filter(([pat])=>topic.patterns.includes(pat)).reduce((s,[,qs])=>s+qs.length,0);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:T.card,border:`1px solid ${h?T.accent+"70":T.border}`,borderRadius:16,padding:24,cursor:"pointer",transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",transform:h?"translateY(-3px) scale(1.02)":"none",boxShadow:h?"0 12px 32px rgba(0,0,0,0.3)":"none"}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:T.text,marginBottom:4}}>{topic.id}</div>
      <div style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace",marginBottom:14}}>{count} problems</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {topic.patterns.map(p=><span key={p} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:h?T.accentS:T.bg,color:h?T.accent:T.sub,fontFamily:"'DM Mono',monospace",fontWeight:600,transition:"all 0.2s"}}>{p}</span>)}
      </div>
    </div>
  );
}

function PatternsPage({ topic, T, onPatternClick, onBack }) {
  return (
    <div style={{padding:"40px",maxWidth:1100,margin:"0 auto"}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,padding:0,marginBottom:28}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.muted}>← Topics</button>
      <h2 style={{margin:"0 0 6px",fontSize:26,fontWeight:800,color:T.text}}>{topic.id}</h2>
      <p style={{margin:"0 0 36px",fontSize:14,color:T.sub}}>Select a pattern to see its approach guide and practice problems.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {topic.patterns.map(pat=><PatternCard key={pat} pattern={pat} onClick={()=>onPatternClick(pat)} T={T}/>)}
      </div>
    </div>
  );
}
function PatternCard({ pattern, onClick, T }) {
  const [h,setH]=useState(false);
  const guide=PATTERN_GUIDES[pattern];
  const count=(QUESTION_BANK[pattern]||[]).length;
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:T.card,border:`1px solid ${h?T.accent+"60":T.border}`,borderRadius:14,padding:24,cursor:"pointer",transition:"all 0.2s",boxShadow:h?"0 8px 24px rgba(0,0,0,0.25)":"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{pattern}</div>
        <div style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:T.muted,background:T.bg,padding:"3px 9px",borderRadius:4}}>{count} problems</div>
      </div>
      {guide&&<p style={{margin:"0 0 14px",fontSize:13,color:T.sub,lineHeight:1.6}}>{guide.summary}</p>}
      {guide&&<div style={{display:"flex",gap:20}}>
        <div><div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>TIME</div><div style={{fontSize:12,fontWeight:700,color:T.accent,fontFamily:"'DM Mono',monospace"}}>{guide.complexity.time}</div></div>
        <div><div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>SPACE</div><div style={{fontSize:12,fontWeight:700,color:T.accent,fontFamily:"'DM Mono',monospace"}}>{guide.complexity.space}</div></div>
      </div>}
      {!guide&&<p style={{margin:0,fontSize:13,color:T.muted}}>Browse {count} problems →</p>}
    </div>
  );
}

function PatternPage({ pattern, topic, T, onSelectQuestion, onBack }) {
  const [tab,setTab]=useState("learn");
  const [questions,setQuestions]=useState([]);
  const [loading,setLoading]=useState(true);
  const guide=PATTERN_GUIDES[pattern];
  const fallback=QUESTION_BANK[pattern]||[];

  useEffect(()=>{
    setLoading(true);
    apiFetch.get(`/questions?page=0&size=20&pattern=${encodeURIComponent(pattern)}`).then(data=>{
      const fromDB=(data.content||[]).map(q=>({...q,fromDB:true}));
      const combined=fromDB.length>=5?fromDB:[...fromDB,...fallback.slice(0,Math.max(0,10-fromDB.length))];
      setQuestions(combined);
    }).catch(()=>setQuestions(fallback)).finally(()=>setLoading(false));
  },[pattern]);

  const getTitle=q=>{ if(q.title) return q.title; const l=(q.question||"").split("\n").find(x=>x.toLowerCase().startsWith("title:")); return l?l.replace(/title:/i,"").trim():(q.question||"").substring(0,50); };

  return (
    <div style={{display:"flex",height:"calc(100vh - 54px)",overflow:"hidden"}}>
      <div style={{width:340,flexShrink:0,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",background:T.surface}}>
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.border}`}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,padding:0,marginBottom:12}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.muted}>← Back</button>
          <div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:"'Syne',sans-serif"}}>{pattern}</div>
          <div style={{fontSize:12,color:T.sub,marginTop:4}}>{topic}</div>
        </div>
        <div style={{display:"flex",padding:"12px 24px 0",borderBottom:`1px solid ${T.border}`,gap:4}}>
          {[["learn","Approach"],["problems","Problems"]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,background:tab===id?T.accent:"transparent",color:tab===id?"#fff":T.sub,marginBottom:12,transition:"all 0.2s"}}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          {tab==="learn"&&guide&&(
            <div>
              <p style={{margin:"0 0 20px",fontSize:13,color:T.text,lineHeight:1.75}}>{guide.summary}</p>
              <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>USE WHEN</div><p style={{margin:0,fontSize:12,color:T.sub,lineHeight:1.6}}>{guide.when}</p></div>
              <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>COMPLEXITY</div><div style={{display:"flex",gap:20}}><div><div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>Time</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:T.accent}}>{guide.complexity.time}</div></div><div><div style={{fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace"}}>Space</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:T.accent}}>{guide.complexity.space}</div></div></div></div>
              <div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>STEPS</div>{guide.steps.map((s,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:8}}><div style={{width:20,height:20,borderRadius:"50%",background:T.accentS,color:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{i+1}</div><div style={{fontSize:12,color:T.text,lineHeight:1.5}}>{s}</div></div>)}</div>
              <div><div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>TEMPLATE</div><pre style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",fontFamily:"'DM Mono',monospace",fontSize:11,color:T.text,lineHeight:1.65,overflowX:"auto",margin:0,whiteSpace:"pre-wrap"}}>{guide.template}</pre></div>
            </div>
          )}
          {tab==="learn"&&!guide&&<div style={{color:T.muted,fontSize:13}}>No guide available yet.</div>}
          {tab==="problems"&&(loading?<div style={{display:"flex",justifyContent:"center",padding:40}}><Spinner T={T}/></div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {questions.map((q,i)=><div key={q.id||i} onClick={()=>{onSelectQuestion(q);}} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,cursor:"pointer",transition:"all 0.15s",background:T.card}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}><div style={{fontSize:13,color:T.text,fontWeight:500,marginBottom:4}}>{getTitle(q)}</div><DiffChip d={q.difficulty} T={T}/></div>)}
            {questions.length===0&&<div style={{color:T.muted,fontSize:12,fontFamily:"'DM Mono',monospace"}}>No problems yet.</div>}
          </div>)}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"32px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <div><h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,color:T.text}}>{pattern} Problems</h2><span style={{fontSize:13,color:T.sub,fontFamily:"'DM Mono',monospace"}}>{questions.length} problems</span></div>
        </div>
        {loading&&<div style={{display:"flex",justifyContent:"center",padding:60}}><Spinner T={T} size={20}/></div>}
        {!loading&&<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"36px 1fr 100px 80px",padding:"10px 20px",borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.muted,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"0.08em"}}><span>#</span><span>TITLE</span><span>DIFFICULTY</span><span>TOPIC</span></div>
          {questions.map((q,i)=>(
            <div key={q.id||i} onClick={()=>onSelectQuestion(q)} style={{display:"grid",gridTemplateColumns:"36px 1fr 100px 80px",padding:"13px 20px",borderBottom:i<questions.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",transition:"background 0.12s",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{i+1}</span>
              <span style={{fontSize:13,color:T.text,fontWeight:500}}>{getTitle(q)}</span>
              <span>{q.difficulty?<DiffChip d={q.difficulty} T={T}/>:"—"}</span>
              <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace"}}>{q.topic||"—"}</span>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

function CodeEditor({ problem, T, onBack }) {
  const [lang,setLang]=useState("Java");
  const [code,setCode]=useState(BOILERPLATE.Java);
  const [panelTab,setPanelTab]=useState(null);
  const [panelResult,setPanelResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [splitPct,setSplitPct]=useState(42);
  const [panelH,setPanelH]=useState(240);
  const [showHint,setShowHint]=useState(false);
  const dragV=useRef(false),dragH=useRef(false),containerRef=useRef(null),rightRef=useRef(null);

  const getTitle=()=>{ if(problem.title) return problem.title; const l=(problem.question||"").split("\n").find(x=>x.toLowerCase().startsWith("title:")); return l?l.replace(/title:/i,"").trim():(problem.question||"").substring(0,60); };
  const getSection=sec=>{ if(!problem?.question) return null; const l=problem.question.split("\n").find(x=>x.toLowerCase().includes(sec.toLowerCase()+":")); return l?l.replace(new RegExp(sec+":","i"),"").trim():null; };
  const hint=getSection("hint");

  const changeLang=l=>{setLang(l);setCode(BOILERPLATE[l]||BOILERPLATE.Java);};

  const callAPI=async(mode)=>{
    setLoading(true);setPanelTab(mode);setPanelResult(null);
    try {
      const qid = problem.id && problem.id > 0 ? problem.id : null;
      if(!qid) { setPanelResult({text:`⚠ This is a local practice problem (not saved in your database yet).\n\nTo get AI feedback, first generate questions via the backend so they have real IDs.\n\nFor now, here's what your code does:\n\nCode submitted in ${lang}:\n${code.substring(0,200)}...`}); setLoading(false); return; }
      const data=await apiFetch.post("/questions/review-code",{questionId:qid,language:lang,code,mode});
      setPanelResult({text:data.feedback||"No response."});
    } catch(e) { setPanelResult({text:`Error: ${e.message}`,error:true}); }
    finally { setLoading(false); }
  };

  const onMove=useCallback(e=>{
    if(dragV.current&&containerRef.current){const r=containerRef.current.getBoundingClientRect();setSplitPct(Math.max(28,Math.min(58,((e.clientX-r.left)/r.width)*100)));}
    if(dragH.current&&rightRef.current){const r=rightRef.current.getBoundingClientRect();setPanelH(Math.max(140,Math.min(380,r.bottom-e.clientY)));}
  },[]);
  const onUp=()=>{dragV.current=false;dragH.current=false;};
  useEffect(()=>{window.addEventListener("mousemove",onMove);window.addEventListener("mouseup",onUp);return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};},[onMove]);

  const pInfo={run:{label:"RUN OUTPUT",col:T.ok},submit:{label:"JUDGE RESULT",col:T.warn},review:{label:"AI REVIEW",col:T.accent}};
  const pi=pInfo[panelTab]||pInfo.run;
  const txt=panelResult?.text||"";
  const isOK=txt.includes("ALL_PASSED")||txt.includes("ACCEPTED")||txt.includes("IS OPTIMAL: YES");
  const isFail=txt.includes("COMPILE_ERROR")||txt.includes("WRONG_ANSWER")||txt.includes("RUNTIME_ERROR")||txt.includes("SOME_FAILED");

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",flexDirection:"column"}}>
      <div style={{height:46,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",borderBottom:`1px solid ${T.border}`,background:T.surface,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,padding:0,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.muted}>← Back</button>
          <span style={{width:1,height:14,background:T.border}}/>
          <span style={{fontSize:13,fontWeight:600,color:T.text}}>{getTitle()}</span>
          {problem.difficulty&&<DiffChip d={problem.difficulty} T={T}/>}
          {problem.pattern&&<Chip label={problem.pattern} color={T.accent} bg={T.accentS}/>}
        </div>
      </div>
      <div ref={containerRef} style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:`${splitPct}%`,display:"flex",flexDirection:"column",borderRight:`1px solid ${T.border}`}}>
          <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
            <pre style={{fontFamily:"inherit",fontSize:13,color:T.text,lineHeight:1.85,whiteSpace:"pre-wrap",margin:"0 0 20px"}}>{problem.question}</pre>
            {hint&&!showHint&&<button onClick={()=>setShowHint(true)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.sub,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}}>Show Hint</button>}
            {hint&&showHint&&<div style={{background:T.accentS,border:`1px solid ${T.accent}22`,borderRadius:10,padding:"12px 16px"}}><span style={{fontSize:10,fontWeight:700,color:T.accent,fontFamily:"'DM Mono',monospace"}}>HINT — </span><span style={{fontSize:13,color:T.text}}>{hint}</span></div>}
          </div>
        </div>
        <div onMouseDown={()=>dragV.current=true} style={{width:4,flexShrink:0,cursor:"col-resize",background:T.border,transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background=T.accent} onMouseLeave={e=>e.currentTarget.style.background=T.border}/>
        <div ref={rightRef} style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",gap:3}}>
                {["Java","Python","C++","JavaScript"].map(l=>(
                  <button key={l} onClick={()=>changeLang(l)} style={{padding:"3px 10px",borderRadius:5,border:`1px solid ${lang===l?T.accent:T.border}`,background:lang===l?T.accentS:"transparent",color:lang===l?T.accent:T.sub,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,transition:"all 0.15s"}}>{l}</button>
                ))}
              </div>
              <span style={{fontSize:11,color:T.muted,fontFamily:"'DM Mono',monospace",marginLeft:4}}>Solution.{lang==="JavaScript"?"js":lang==="Python"?"py":lang==="C++"?"cpp":"java"}</span>
            </div>
            <div style={{display:"flex",gap:5}}>
              <Btn T={T} variant="ok" onClick={()=>callAPI("run")} disabled={loading} style={{fontSize:11,padding:"5px 14px"}}>
                {loading&&panelTab==="run"?<><Spinner T={T} size={11}/> Running...</>:"▶ Run"}
              </Btn>
              <Btn T={T} variant="warn" onClick={()=>callAPI("submit")} disabled={loading} style={{fontSize:11,padding:"5px 14px"}}>
                {loading&&panelTab==="submit"?<><Spinner T={T} size={11}/> Submitting...</>:"⬆ Submit"}
              </Btn>
              <Btn T={T} variant="default" onClick={()=>callAPI("review")} disabled={loading} style={{fontSize:11,padding:"5px 14px"}}>
                {loading&&panelTab==="review"?<><Spinner T={T} size={11}/> Reviewing...</>:"✦ AI Review"}
              </Btn>
            </div>
          </div>
          <div style={{flex:1,overflow:"hidden",display:"flex",background:T.bg,minHeight:0}}>
            <div style={{width:40,flexShrink:0,background:T.surface,borderRight:`1px solid ${T.border}`,paddingTop:16,fontFamily:"'DM Mono',monospace",fontSize:12,color:T.muted,textAlign:"center",lineHeight:"21px",overflowY:"hidden"}}>
              {code.split("\n").map((_,i)=><div key={i} style={{height:21,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>)}
            </div>
            <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} style={{flex:1,background:T.bg,border:"none",outline:"none",resize:"none",fontFamily:"'DM Mono',monospace",fontSize:13,color:T.text,lineHeight:"21px",padding:"16px 18px",caretColor:T.accent,tabSize:4}}/>
          </div>
          {panelTab&&<div onMouseDown={()=>dragH.current=true} style={{height:4,flexShrink:0,cursor:"row-resize",background:T.border}} onMouseEnter={e=>e.currentTarget.style.background=T.accent} onMouseLeave={e=>e.currentTarget.style.background=T.border}/>}
          {panelTab&&(
            <div style={{height:panelH,flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",padding:"0 14px",height:36,borderBottom:`1px solid ${T.border}`,gap:10,flexShrink:0}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:isOK?T.ok:isFail?T.bad:loading?T.warn:pi.col}}/>
                <span style={{fontSize:11,fontWeight:700,color:pi.col,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>{pi.label}</span>
                <button onClick={()=>setPanelTab(null)} style={{marginLeft:"auto",background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:14}}>
                {loading&&<div style={{display:"flex",alignItems:"center",gap:10,color:T.sub,fontFamily:"'DM Mono',monospace",fontSize:12,padding:12}}><Spinner T={T}/>{panelTab==="run"?"Checking compile errors and running examples...":panelTab==="submit"?"Judging against all edge cases...":"Analysing for a better approach..."}</div>}
                {!loading&&panelResult&&<pre style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:T.text,lineHeight:1.85,whiteSpace:"pre-wrap",margin:0}}>{panelResult.text}</pre>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function seededShuffle(arr,seed){const a=[...arr];let s=seed;for(let i=a.length-1;i>0;i--){s=(s*1664525+1013904223)&0xffffffff;const j=((s>>>0)%(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function getDailyQuiz(n=10){const d=new Date();const seed=d.getFullYear()*10000+d.getMonth()*100+d.getDate();return seededShuffle(QUIZ_POOL,seed).slice(0,n);}

const QUIZ_MODES=[{id:"quick",label:"Quick Drill",count:5,timer:null,desc:"5 questions, no timer"},{id:"daily",label:"Daily Challenge",count:10,timer:null,desc:"10 fresh questions daily"},{id:"speed",label:"Speed Round",count:10,timer:20,desc:"20 seconds per question"}];

function QuizPage({ T }) {
  const [mode,setMode]=useState(null);
  const [st,setSt]=useState({q:0,sel:null,confirmed:false,answers:[],done:false,timeLeft:null});
  const timer=useRef(null);
  const qList=mode?getDailyQuiz(mode.count):[];

  const startQuiz=m=>{setMode(m);setSt({q:0,sel:null,confirmed:false,answers:[],done:false,timeLeft:m.timer});};
  const reset=()=>{clearInterval(timer.current);setMode(null);setSt({q:0,sel:null,confirmed:false,answers:[],done:false,timeLeft:null});};

  useEffect(()=>{
    if(!mode||!mode.timer||st.confirmed||st.done){clearInterval(timer.current);return;}
    setSt(s=>({...s,timeLeft:mode.timer}));
    timer.current=setInterval(()=>setSt(s=>{if(s.timeLeft<=1){clearInterval(timer.current);return{...s,timeLeft:0,confirmed:true,answers:[...s.answers,{correct:false,timedOut:true}]};}return{...s,timeLeft:s.timeLeft-1};}),1000);
    return()=>clearInterval(timer.current);
  },[st.q,mode]);

  const confirm=()=>{if(st.sel===null)return;clearInterval(timer.current);setSt(s=>({...s,confirmed:true,answers:[...s.answers,{correct:s.sel===qList[s.q].ans,sel:s.sel}]}));};
  const next=()=>{if(st.q+1>=qList.length){setSt(s=>({...s,done:true}));return;}setSt(s=>({...s,q:s.q+1,sel:null,confirmed:false,timeLeft:mode?.timer}));};

  if(!mode) return (
    <div style={{padding:"48px 40px",maxWidth:780,margin:"0 auto"}}>
      <h2 style={{margin:"0 0 6px",fontSize:26,fontWeight:800,color:T.text}}>Pattern Quiz</h2>
      <p style={{margin:"0 0 36px",fontSize:14,color:T.sub}}>Questions rotate daily based on today's date. Train pattern recognition for interviews.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:40}}>
        {QUIZ_MODES.map(m=>(
          <div key={m.id} onClick={()=>startQuiz(m)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:24,cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accentS;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
            <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:"'Syne',sans-serif",marginBottom:6}}>{m.label}</div>
            <div style={{fontSize:12,color:T.sub,marginBottom:16}}>{m.desc}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}><span style={{fontSize:24,fontWeight:700,color:T.text}}>{m.count}</span> questions{m.timer?`, ${m.timer}s each`:""}</div>
          </div>
        ))}
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:24}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,fontFamily:"'DM Mono',monospace",marginBottom:14,letterSpacing:"0.08em"}}>TODAY'S PATTERNS</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{getDailyQuiz(10).map((q,i)=><span key={i} style={{fontSize:11,padding:"4px 10px",borderRadius:6,background:T.bg,color:T.sub,fontFamily:"'DM Mono',monospace"}}>{q.pat}</span>)}</div>
      </div>
    </div>
  );

  if(st.done) {
    const score=st.answers.filter(a=>a.correct).length;
    const pct=Math.round((score/qList.length)*100);
    const byPat={};
    qList.forEach((q,i)=>{if(!byPat[q.pat])byPat[q.pat]={c:0,t:0};byPat[q.pat].t++;if(st.answers[i]?.correct)byPat[q.pat].c++;});
    return (
      <div style={{padding:"48px 40px",maxWidth:600,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:72,fontWeight:700,color:T.text,lineHeight:1}}>{score}<span style={{fontSize:32,color:T.muted}}>/{qList.length}</span></div>
          <div style={{fontSize:15,color:pct>=80?T.ok:pct>=50?T.warn:T.bad,marginTop:8,fontWeight:600}}>{pct>=80?"Excellent!":pct>=50?"Good — review the misses.":"Keep practising!"}</div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:24,marginBottom:24}}>
          {Object.entries(byPat).map(([pat,s])=>{const p=Math.round((s.c/s.t)*100);const c=p===100?T.ok:p===0?T.bad:T.warn;return(
            <div key={pat} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{flex:1}}><div style={{fontSize:13,color:T.text,marginBottom:4}}>{pat}</div><div style={{background:T.border,borderRadius:99,height:3}}><div style={{width:`${p}%`,height:"100%",background:c,borderRadius:99}}/></div></div>
              <span style={{fontSize:12,fontWeight:700,color:c,fontFamily:"'DM Mono',monospace",width:32,textAlign:"right"}}>{s.c}/{s.t}</span>
            </div>
          );})}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <Btn T={T} onClick={reset}>Back</Btn>
          <Btn T={T} variant="primary" onClick={()=>startQuiz(mode)}>Try Again</Btn>
        </div>
      </div>
    );
  }

  const q=qList[st.q];
  return (
    <div style={{padding:"40px",maxWidth:620,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}>QUESTION</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:T.text}}>{st.q+1}<span style={{color:T.muted}}>/{qList.length}</span></div></div>
        {mode.timer&&<div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.muted}}>TIME</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:st.timeLeft<6?T.bad:T.ok}}>{st.timeLeft}s</div></div>}
        <button onClick={reset} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.muted}>✕ Quit</button>
      </div>
      <div style={{background:T.border,borderRadius:99,height:2,marginBottom:28}}><div style={{width:`${(st.q/qList.length)*100}%`,height:"100%",background:T.accent,borderRadius:99,transition:"width 0.4s"}}/></div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:28,marginBottom:14}}>
        <p style={{margin:"0 0 24px",fontSize:15,color:T.text,lineHeight:1.65,fontWeight:500}}>{q.q}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.opts.map((opt,i)=>{
            let bg=T.bg,bd=T.border,col=T.text;
            if(st.confirmed){if(i===q.ans){bg=T.okS;bd=T.ok+"50";col=T.ok;}else if(i===st.sel&&i!==q.ans){bg=T.badS;bd=T.bad+"50";col=T.bad;}else col=T.muted;}
            else if(st.sel===i){bg=T.accentS;bd=T.accent+"60";col=T.accent;}
            return <button key={i} onClick={()=>!st.confirmed&&setSt(s=>({...s,sel:i}))} style={{padding:"12px 16px",borderRadius:10,border:`1px solid ${bd}`,background:bg,color:col,cursor:st.confirmed?"default":"pointer",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,textAlign:"left",transition:"all 0.15s"}}>{opt}</button>;
          })}
        </div>
        {st.confirmed&&<div style={{marginTop:16,background:T.accentS,borderRadius:10,padding:"12px 14px"}}><span style={{fontSize:10,fontWeight:700,color:T.accent,fontFamily:"'DM Mono',monospace"}}>WHY — </span><span style={{fontSize:13,color:T.text}}>{q.why}</span></div>}
        {st.confirmed&&st.answers[st.q]?.timedOut&&<div style={{marginTop:8,background:T.badS,borderRadius:10,padding:"10px 14px"}}><span style={{fontSize:12,color:T.bad,fontFamily:"'DM Mono',monospace"}}>⏱ Time's up! Answer: {q.opts[q.ans]}</span></div>}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        {!st.confirmed?<Btn T={T} variant={st.sel!==null?"primary":"default"} onClick={confirm} style={{opacity:st.sel===null?0.5:1}}>Confirm →</Btn>:<Btn T={T} variant="primary" onClick={next}>{st.q+1===qList.length?"See Results →":"Next →"}</Btn>}
      </div>
    </div>
  );
}

export default function App() {
  const [dark,setDark]=useState(true);
  const T=dark?DARK:LIGHT;
  const [navStack,setNavStack]=useState([{view:"topics"}]);
  const [searchOpen,setSearchOpen]=useState(false);
  const cur=navStack[navStack.length-1];
  const push=f=>setNavStack(s=>[...s,f]);
  const pop=()=>setNavStack(s=>s.length>1?s.slice(0,-1):s);
  const goTo=v=>setNavStack([{view:v}]);
  const topView=cur.view==="quiz"?"quiz":"topics";

  return (
    <div style={{background:T.bg,height:"100vh",display:"flex",flexDirection:"column",color:T.text,fontFamily:"'Syne',sans-serif",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}@keyframes vspin{to{transform:rotate(360deg)}}`}</style>
      {cur.view!=="editor"&&<Topbar topView={topView} setTopView={v=>{if(v==="quiz")push({view:"quiz"});else goTo("topics");}} dark={dark} setDark={setDark} T={T} onSearch={()=>setSearchOpen(true)}/>}
      {searchOpen&&<SearchModal T={T} onClose={()=>setSearchOpen(false)} onSelect={q=>{push({view:"editor",problem:q});setSearchOpen(false);}}/>}
      <div style={{flex:1,overflow:cur.view==="editor"||cur.view==="pattern"?"hidden":"auto"}}>
        {cur.view==="topics"&&<TopicsPage T={T} dark={dark} onTopicClick={t=>push({view:"patterns",topic:t})}/>}
        {cur.view==="patterns"&&<PatternsPage topic={cur.topic} T={T} onPatternClick={p=>push({view:"pattern",pattern:p,topic:cur.topic.id})} onBack={pop}/>}
        {cur.view==="pattern"&&<PatternPage pattern={cur.pattern} topic={cur.topic} T={T} onSelectQuestion={q=>push({view:"editor",problem:q})} onBack={pop}/>}
        {cur.view==="editor"&&<CodeEditor problem={cur.problem} T={T} onBack={pop}/>}
        {cur.view==="quiz"&&<div style={{overflowY:"auto",height:"calc(100vh - 54px)"}}><QuizPage T={T}/></div>}
      </div>
    </div>
  );
}
