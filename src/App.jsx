import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// SCOPE CURSOR + ZOOM  — pure DOM, zero React overhead
// ─────────────────────────────────────────────────────────────
function ScopeCursor() {
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);

  useEffect(() => {
    const el = wrapRef.current, svg = svgRef.current;
    if (!el || !svg) return;

    const SN = 80, SZ = 140, SCALE = 2;
    let curS = SN, mx = window.innerWidth/2, my = window.innerHeight/2, zoomed = false;

    const build = s => {
      const cx=s/2, cy=s/2, r=s*0.4, gap=s*0.1, sw=s<100?1.0:1.5;
      const c="#FF6A00", cd="rgba(255,106,0,0.5)";
      const mv=[-2,-1,1,2].map(i=>{const l=Math.abs(i)===2?s*0.038:s*0.055,py=cy+i*(r/3.4);return`<line x1="${cx-l}" y1="${py}" x2="${cx+l}" y2="${py}" stroke="${c}" stroke-width="0.7" opacity="0.6"/>`;}).join('');
      const mh=[-2,-1,1,2].map(i=>{const l=Math.abs(i)===2?s*0.038:s*0.055,px=cx+i*(r/3.4);return`<line x1="${px}" y1="${cy-l}" x2="${px}" y2="${cy+l}" stroke="${c}" stroke-width="0.7" opacity="0.35"/>`;}).join('');
      const br=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy])=>{const bx=cx+sx*r*0.76,by=cy+sy*r*0.76,bl=s*0.07;return`<g opacity="0.5"><line x1="${bx}" y1="${by}" x2="${bx+sx*bl}" y2="${by}" stroke="${c}" stroke-width="${sw}"/><line x1="${bx}" y1="${by}" x2="${bx}" y2="${by+sy*bl}" stroke="${c}" stroke-width="${sw}"/></g>`;}).join('');
      const lbl=s>=100?`<text x="${cx+r*0.44}" y="${cy-r*0.58}" fill="${c}" font-size="${s*0.1}" font-family="Share Tech Mono,monospace" opacity="0.9">2x</text>`:'';
      return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${c}" stroke-width="${sw}" opacity="0.92"/>
        <circle cx="${cx}" cy="${cy}" r="${r*0.62}" stroke="${cd}" stroke-width="0.6" stroke-dasharray="3 4"/>
        <circle cx="${cx}" cy="${cy}" r="${r*0.3}" stroke="${cd}" stroke-width="0.5" opacity="0.55"/>
        <line x1="${cx}" y1="${cy-r+1}" x2="${cx}" y2="${cy-gap}" stroke="${c}" stroke-width="${sw}"/>
        <line x1="${cx}" y1="${cy+gap}" x2="${cx}" y2="${cy+r-1}" stroke="${c}" stroke-width="${sw}"/>
        <line x1="${cx-r+1}" y1="${cy}" x2="${cx-gap}" y2="${cy}" stroke="${c}" stroke-width="${sw}"/>
        <line x1="${cx+gap}" y1="${cy}" x2="${cx+r-1}" y2="${cy}" stroke="${c}" stroke-width="${sw}"/>
        ${mv}${mh}${br}
        <circle class="cdot" cx="${cx}" cy="${cy}" r="${s<100?2:3}" fill="${c}" opacity="0.88"/>
        <circle class="fr1" cx="${cx}" cy="${cy}" r="${r*0.22}" fill="${c}" opacity="0"/>
        <circle class="fr2" cx="${cx}" cy="${cy}" r="${r*0.5}" stroke="${c}" stroke-width="1" opacity="0"/>
        ${lbl}`;
    };

    const render = s => {
      svg.setAttribute('width',s); svg.setAttribute('height',s);
      svg.setAttribute('viewBox',`0 0 ${s} ${s}`);
      svg.innerHTML = build(s);
      el.style.width = s+'px'; el.style.height = s+'px';
    };

    render(curS);
    el.style.transform=`translate(${mx-curS/2}px,${my-curS/2}px)`;
    el.style.filter='drop-shadow(0 0 4px rgba(255,106,0,0.4))';

    const applyZoom = () => {
      const root = document.getElementById('zoom-root');
      if (!root) return;
      const sy = window.scrollY||0;
      root.style.transition='none';
      root.style.transformOrigin=`${mx}px ${my+sy}px`;
      root.style.transform=`scale(${SCALE})`;
    };

    const onMove = e => {
      mx=e.clientX; my=e.clientY;
      el.style.transform=`translate(${mx-curS/2}px,${my-curS/2}px)`;
      if (zoomed) applyZoom();
    };
    const onFire = () => {
      const r1=svg.querySelector('.fr1'),r2=svg.querySelector('.fr2'),dot=svg.querySelector('.cdot');
      if(r1)r1.setAttribute('opacity','0.55');
      if(r2)r2.setAttribute('opacity','0.3');
      if(dot)dot.setAttribute('opacity','1');
      el.style.filter='drop-shadow(0 0 20px #FF6A00)';
      setTimeout(()=>{
        if(r1)r1.setAttribute('opacity','0');
        if(r2)r2.setAttribute('opacity','0');
        if(dot)dot.setAttribute('opacity','0.88');
        el.style.filter='drop-shadow(0 0 4px rgba(255,106,0,0.4))';
      },120);
    };
    const onDown = e => {
      if(e.button!==2)return; e.preventDefault();
      zoomed=true; curS=SZ; render(curS);
      el.style.transform=`translate(${mx-curS/2}px,${my-curS/2}px)`;
      el.style.filter='drop-shadow(0 0 10px rgba(255,106,0,0.9))';
      applyZoom();
      const vig=document.getElementById('zoom-vig');
      if(vig)vig.style.opacity='1';
    };
    const onUp = e => {
      if(e.button!==2)return;
      zoomed=false; curS=SN; render(curS);
      el.style.transform=`translate(${mx-curS/2}px,${my-curS/2}px)`;
      el.style.filter='drop-shadow(0 0 4px rgba(255,106,0,0.4))';
      const root=document.getElementById('zoom-root');
      if(root){root.style.transition='transform 0.14s cubic-bezier(0.4,0,0.2,1)';root.style.transform='scale(1)';}
      const vig=document.getElementById('zoom-vig');
      if(vig)vig.style.opacity='0';
    };

    window.addEventListener('mousemove',onMove,{passive:true});
    window.addEventListener('click',onFire);
    window.addEventListener('mousedown',onDown);
    window.addEventListener('mouseup',onUp);
    window.addEventListener('contextmenu',e=>e.preventDefault());
    return()=>{
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('click',onFire);
      window.removeEventListener('mousedown',onDown);
      window.removeEventListener('mouseup',onUp);
    };
  },[]);

  return(
    <div ref={wrapRef} style={{position:'fixed',top:0,left:0,pointerEvents:'none',zIndex:9999,willChange:'transform'}}>
      <svg ref={svgRef} fill="none" style={{display:'block'}}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DECORATIVE BG TARGETS
// ─────────────────────────────────────────────────────────────
function BgTarget({pos,delay=0,seed=0}){
  const[vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t);},[delay]);
  const size=22+(seed%5)*6, opacity=0.07+(seed%4)*0.025;
  return(
    <div style={{position:'fixed',left:pos.x,top:pos.y,transform:`translate(-50%,-50%) scale(${vis?1:0.2})`,opacity:vis?opacity:0,transition:`transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, opacity 0.4s ease ${delay}ms`,pointerEvents:'none',zIndex:3,animation:'tFloat 5s ease-in-out infinite',animationDelay:`${delay}ms`}}>
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <circle cx={30} cy={30} r={28} stroke="#FF6A00" strokeWidth={1} strokeDasharray="4 5"/>
        <circle cx={30} cy={30} r={18} stroke="#FF6A00" strokeWidth={0.8}/>
        <circle cx={30} cy={30} r={7}  stroke="#FF6A00" strokeWidth={0.8}/>
        <circle cx={30} cy={30} r={2}  fill="#FF6A00" opacity={0.6}/>
        <line x1={30} y1={2}  x2={30} y2={11} stroke="#FF6A00" strokeWidth={0.8}/>
        <line x1={30} y1={49} x2={30} y2={58} stroke="#FF6A00" strokeWidth={0.8}/>
        <line x1={2}  y1={30} x2={11} y2={30} stroke="#FF6A00" strokeWidth={0.8}/>
        <line x1={49} y1={30} x2={58} y2={30} stroke="#FF6A00" strokeWidth={0.8}/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HIT FLASH
// ─────────────────────────────────────────────────────────────
function HitFlash(){
  return(
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',animation:'hitRing 0.38s ease forwards',zIndex:20}}>
      <svg width={170} height={170} viewBox="0 0 170 170" fill="none">
        <circle cx={85} cy={85} r={78} stroke="#FF6A00" strokeWidth={2} opacity={0.85}/>
        {[0,45,90,135,180,225,270,315].map((deg,i)=>{
          const rad=deg*Math.PI/180,inner=58,outer=i%2===0?78:68;
          return<line key={deg} x1={85+Math.cos(rad)*inner} y1={85+Math.sin(rad)*inner} x2={85+Math.cos(rad)*outer} y2={85+Math.sin(rad)*outer} stroke={i%2===0?"#FF6A00":"#FFAB00"} strokeWidth={i%2===0?1.6:1} opacity={0.9}/>;
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOARD VISUAL
// ─────────────────────────────────────────────────────────────
function BoardVisual({hits,holes,col,isHit,neutralized,hovered,project,width}){
  const mono="Share Tech Mono,monospace",amber="#FFAB00",red="#FF3D00";
  const rs=Math.round(width*0.82),cx=rs/2,cy=rs/2;
  const rings=[
    {r:cx*0.94,fill:'rgba(255,106,0,0.06)',stroke:col+'66'},
    {r:cx*0.72,fill:'rgba(255,106,0,0.10)',stroke:col+'88'},
    {r:cx*0.50,fill:'rgba(255,106,0,0.16)',stroke:col+'aa'},
    {r:cx*0.29,fill:'rgba(255,106,0,0.28)',stroke:col+'cc'},
    {r:cx*0.10,fill:col,stroke:'none'},
  ];
  const seed=project.num?project.num.charCodeAt(2)||1:1;
  const makeCracks=(s,n)=>Array.from({length:n},(_,i)=>{
    const r=x=>(((s*x*9301+49297)%233280)/233280);
    return{angle:r(i+1)*Math.PI*2,len:cx*0.22+r(i+4)*cx*0.55};
  });
  return(
    <div style={{width,animation:isHit?'boardShake 0.38s ease':neutralized?'none':'boardSway 5.5s ease-in-out infinite',transformOrigin:'top center'}}>
      <div style={{display:'flex',justifyContent:'space-between',padding:`0 ${width*0.22}px`}}>
        {[0,1].map(i=><div key={i} style={{width:1.5,height:16,background:'linear-gradient(180deg,rgba(255,106,0,0.7),rgba(255,106,0,0.15))'}}/>)}
      </div>
      <div style={{background:'linear-gradient(160deg,rgba(7,12,5,0.97),rgba(12,18,8,0.95))',border:`1px solid ${col}55`,borderTop:`2.5px solid ${col}bb`,padding:`${Math.round(width*0.055)}px`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:1,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)'}}/>
        <div style={{fontFamily:mono,fontSize:Math.max(6,width*0.065),letterSpacing:2,color:`${col}77`,textAlign:'center',marginBottom:5,textTransform:'uppercase',position:'relative',zIndex:2}}>TARGET · {project.num}</div>
        <div style={{position:'relative',zIndex:2}}>
          <svg width={rs} height={rs} viewBox={`0 0 ${rs} ${rs}`} fill="none" style={{display:'block',margin:'0 auto'}}>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>{
              const rad=deg*Math.PI/180,ro=cx*0.94,ri=cx*(i%3===0?0.86:0.90);
              return<line key={deg} x1={cx+Math.cos(rad)*ri} y1={cy+Math.sin(rad)*ri} x2={cx+Math.cos(rad)*ro} y2={cy+Math.sin(rad)*ro} stroke={col+'88'} strokeWidth={i%3===0?1.2:0.6}/>;
            })}
            {rings.map((r,i)=><circle key={i} cx={cx} cy={cy} r={r.r} fill={r.fill} stroke={r.stroke} strokeWidth={0.8}/>)}
            <line x1={cx} y1={3} x2={cx} y2={cy-cx*0.13} stroke={col+'44'} strokeWidth={0.9}/>
            <line x1={cx} y1={cy+cx*0.13} x2={cx} y2={rs-3} stroke={col+'44'} strokeWidth={0.9}/>
            <line x1={3} y1={cy} x2={cx-cx*0.13} y2={cy} stroke={col+'44'} strokeWidth={0.9}/>
            <line x1={cx+cx*0.13} y1={cy} x2={rs-3} y2={cy} stroke={col+'44'} strokeWidth={0.9}/>
            {hits>=1&&makeCracks(seed,3).map((c,i)=><line key={i} x1={cx} y1={cy} x2={cx+Math.cos(c.angle)*c.len} y2={cy+Math.sin(c.angle)*c.len} stroke={amber} strokeWidth={1.2} opacity={0.8}/>)}
            {hits>=2&&makeCracks(seed+5,4).map((c,i)=><line key={i} x1={cx} y1={cy} x2={cx+Math.cos(c.angle)*c.len} y2={cy+Math.sin(c.angle)*c.len} stroke={red} strokeWidth={1.6} opacity={0.88}/>)}
          </svg>
          {holes.map((hole,i)=>(
            <div key={i} style={{position:'absolute',left:`${hole.x}%`,top:`${hole.y}%`,width:8,height:8,borderRadius:'50%',background:'#040604',border:'1.5px solid rgba(255,61,0,0.75)',boxShadow:'0 0 7px rgba(255,61,0,0.55), inset 0 0 4px rgba(0,0,0,0.95)',transform:'translate(-50%,-50%)',zIndex:4}}/>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:7,marginTop:6,position:'relative',zIndex:2}}>
          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:i<hits?col:'transparent',border:`1px solid ${col}cc`,boxShadow:i<hits?`0 0 8px ${col}`:'none',transition:'all 0.25s'}}/>)}
        </div>
        {neutralized&&(
          <div style={{position:'absolute',inset:0,zIndex:10,overflow:'hidden'}}>
            {[{w:'55%',h:'44%',r:-24,x:'-6%',y:'4%',d:'0s'},{w:'50%',h:'38%',r:18,x:'36%',y:'16%',d:'0.04s'},{w:'42%',h:'34%',r:-40,x:'3%',y:'50%',d:'0.08s'},{w:'36%',h:'28%',r:55,x:'44%',y:'56%',d:'0.06s'},{w:'28%',h:'22%',r:-58,x:'18%',y:'76%',d:'0.11s'}].map((s,i)=>(
              <div key={i} style={{position:'absolute',left:s.x,top:s.y,width:s.w,height:s.h,background:'linear-gradient(135deg,rgba(8,14,5,0.93),rgba(4,7,2,0.85))',border:'1px solid rgba(255,61,0,0.22)',transform:`rotate(${s.r}deg)`,animation:`shardFall 0.55s cubic-bezier(0.2,0,0.4,1) ${s.d} both`}}/>
            ))}
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:'stampIn 0.45s cubic-bezier(0.2,0,0.3,1) 0.3s both',zIndex:15,textAlign:'center'}}>
              <div style={{border:'2px solid #FF3D00',padding:'5px 12px',background:'rgba(5,2,1,0.97)',transform:'rotate(-8deg)',boxShadow:'0 0 22px rgba(255,61,0,0.45)'}}>
                <div style={{fontFamily:mono,fontSize:Math.max(8,width*0.082),letterSpacing:3,color:'#FF3D00',whiteSpace:'nowrap',textShadow:'0 0 14px #FF3D00'}}>◈ NEUTRALISED</div>
              </div>
              {project.link&&<a href={project.link} target="_blank" rel="noreferrer" style={{display:'block',marginTop:6,fontFamily:mono,fontSize:Math.max(7,width*0.068),letterSpacing:2,color:'rgba(255,106,0,0.75)',textDecoration:'none',textShadow:'0 0 8px rgba(255,106,0,0.5)'}}>VIEW ——▸</a>}
            </div>
          </div>
        )}
      </div>
      {hits===0&&!neutralized&&!isHit&&(
        <div style={{textAlign:'center',marginTop:5,fontFamily:mono,fontSize:Math.max(6,width*0.062),letterSpacing:1,color:'rgba(255,106,0,0.25)'}}>CLICK × 3</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RANGE TARGET — float + edge modes
// ─────────────────────────────────────────────────────────────
function RangeTarget({project,pos,side,topPct,visible,onShot,mode}){
  const[hits,setHits]=useState(0);
  const[holes,setHoles]=useState([]);
  const[phase,setPhase]=useState('spawning');
  const mono="Share Tech Mono,monospace",orange="#FF6A00",amber="#FFAB00",red="#FF3D00";

  useEffect(()=>{
    if(!visible)return;
    setHits(0);setHoles([]);setPhase('spawning');
    const t=setTimeout(()=>setPhase('idle'),80);
    return()=>clearTimeout(t);
  },[visible,pos?.x,pos?.y]);

  const alive=phase==='idle'||phase==='hovered';

  const handleClick=()=>{
    if(!alive)return;
    const nh=hits+1;
    setHoles(h=>[...h,{x:14+Math.random()*72,y:10+Math.random()*72}]);
    if(nh>=3){
      setPhase('neutralized');
      onShot(project.id);
      setTimeout(()=>setPhase('gone'),1500);
    }else{
      setHits(nh);setPhase('hit');
      setTimeout(()=>setPhase('idle'),380);
    }
  };

  if(!visible||phase==='gone')return null;
  const spawning=phase==='spawning',isHit=phase==='hit',neutralized=phase==='neutralized',hovered=phase==='hovered';
  const col=hits===0?orange:hits===1?amber:red;

  const tooltip=hovered&&!neutralized&&(
    <div style={{position:'absolute',fontFamily:mono,fontSize:9,letterSpacing:2,color:orange,whiteSpace:'nowrap',textShadow:'0 0 10px #FF6A00',background:'rgba(4,7,2,0.92)',padding:'5px 11px',border:'1px solid rgba(255,106,0,0.35)',animation:'fadeUp 0.15s ease both',pointerEvents:'none',zIndex:2,...(mode==='edge'?{top:'50%',transform:'translateY(-50%)',[side==='left'?'left':'right']:132}:{bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)'})}}>
      {project.title}
    </div>
  );

  if(mode==='edge'){
    const isLeft=side==='left',BOARD_W=124,PEEK=66,FULL=108;
    const offset=spawning?BOARD_W:neutralized?BOARD_W+40:hovered?FULL:PEEK;
    return(
      <div onClick={handleClick} onMouseEnter={()=>alive&&setPhase('hovered')} onMouseLeave={()=>phase==='hovered'&&setPhase('idle')}
        style={{position:'fixed',top:`${topPct}%`,[isLeft?'left':'right']:-(BOARD_W-offset),transform:'translateY(-50%)',opacity:spawning||neutralized?0:1,transition:spawning?'left 0.7s cubic-bezier(0.34,1.56,0.64,1), right 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease':neutralized?'opacity 0.7s ease, left 0.5s ease, right 0.5s ease':'left 0.22s ease, right 0.22s ease',zIndex:42,pointerEvents:alive?'auto':'none'}}>
        {tooltip}
        <BoardVisual hits={hits} holes={holes} col={col} isHit={isHit} neutralized={neutralized} hovered={hovered} project={project} width={BOARD_W}/>
        {isHit&&<HitFlash/>}
      </div>
    );
  }

  return(
    <div onClick={handleClick} onMouseEnter={()=>alive&&setPhase('hovered')} onMouseLeave={()=>phase==='hovered'&&setPhase('idle')}
      style={{position:'fixed',left:pos.x,top:pos.y,transform:`translate(-50%,-50%) scale(${spawning?0.05:1})`,opacity:spawning||neutralized?0:1,transition:spawning?'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease':neutralized?'opacity 0.7s ease':'none',zIndex:40,pointerEvents:alive?'auto':'none'}}>
      {tooltip}
      <BoardVisual hits={hits} holes={holes} col={col} isHit={isHit} neutralized={neutralized} hovered={hovered} project={project} width={114}/>
      {isHit&&<HitFlash/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROJECT MODAL
// ─────────────────────────────────────────────────────────────
function ProjectModal({project,onClose}){
  const mono="Share Tech Mono,monospace",display="Bebas Neue,sans-serif",body="DM Sans,sans-serif";
  const orange="#FF6A00",text="#E8DFC8",muted="rgba(232,223,200,0.45)";
  const[vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),30);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,320);};
  return(
    <div onClick={close} style={{position:'fixed',inset:0,zIndex:800,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',opacity:vis?1:0,transition:'opacity 0.3s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(680px,90vw)',border:'1px solid rgba(255,106,0,0.45)',background:'rgba(4,7,2,0.97)',boxShadow:'0 0 80px rgba(255,106,0,0.2)',overflow:'hidden',position:'relative',transform:vis?'translateY(0) scale(1)':'translateY(32px) scale(0.96)',transition:'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}>
        {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i)=>{
          const isR=i===1||i===3,isB=i>=2;
          return<div key={i} style={{position:'absolute',width:20,height:20,pointerEvents:'none',zIndex:2,...pos,borderTop:!isB?'2px solid #FF6A00':undefined,borderBottom:isB?'2px solid #FF6A00':undefined,borderLeft:!isR?'2px solid #FF6A00':undefined,borderRight:isR?'2px solid #FF6A00':undefined}}/>;
        })}
        <div style={{borderBottom:'1px solid rgba(255,106,0,0.18)',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:orange}}>FILE DECLASSIFIED — PROJECT {project.num}</span>
          <button onClick={close} style={{background:'none',border:'1px solid rgba(255,106,0,0.35)',color:orange,fontFamily:mono,fontSize:10,letterSpacing:2,padding:'4px 12px',cursor:'none'}}>✕ CLOSE</button>
        </div>
        <div style={{height:project.image?200:90,overflow:'hidden',position:'relative',background:'rgba(3,6,2,0.98)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {project.image
            ?<><img src={project.image} alt={project.title} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85,filter:'saturate(0.7) contrast(1.1)'}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(4,7,2,0.8),transparent)'}}/></>
            :<><div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,106,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,0,0.04) 1px,transparent 1px)',backgroundSize:'18px 18px'}}/><span style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:'rgba(255,106,0,0.22)',position:'relative'}}>add image: "/yourfile.jpg" in App.jsx</span></>
          }
        </div>
        <div style={{padding:'28px 32px'}}>
          <div style={{fontFamily:display,fontSize:36,letterSpacing:4,color:text,marginBottom:12,lineHeight:1}}>{project.title}</div>
          <p style={{fontFamily:body,fontSize:14,lineHeight:1.9,color:muted,fontWeight:300,marginBottom:22}}>{project.desc}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24}}>
            {project.stack.map(t=><span key={t} style={{fontFamily:mono,fontSize:9,letterSpacing:1.5,padding:'4px 11px',border:'1px solid rgba(255,106,0,0.28)',color:muted,background:'rgba(255,106,0,0.04)'}}>{t}</span>)}
          </div>
          {project.link&&<a href={project.link} target="_blank" rel="noreferrer" style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:orange,textDecoration:'none',border:'1px solid rgba(255,106,0,0.4)',padding:'11px 22px',display:'inline-block',transition:'background 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,106,0,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>VIEW PROJECT ——▸</a>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────────────
function HUD({shots}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {[["SYS.STATUS","ONLINE"],["CLEARANCE","LEVEL-1"],["SIGNAL","STRONG"],["OPERATOR","AMINE"],["TARGETS HIT",String(shots).padStart(3,"0")],["MODE","LIVE"]].map(([k,v])=>(
        <div key={k} style={{fontFamily:"Share Tech Mono,monospace",fontSize:9,letterSpacing:2,color:"rgba(255,106,0,0.38)",display:"flex",gap:14}}>
          <span style={{minWidth:100}}>{k}</span>
          <span style={{color:"rgba(255,106,0,0.65)"}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────
function Section({id,children,dark}){return<section id={id} style={{position:"relative",zIndex:2,padding:"100px 60px",background:dark?"rgba(3,6,2,0.85)":"transparent"}}>{children}</section>;}
function SectionHeader({num,title}){
  return(
    <div style={{display:"flex",alignItems:"baseline",gap:20,marginBottom:52}}>
      <span style={{fontFamily:"Share Tech Mono,monospace",fontSize:11,letterSpacing:3,color:"#FF6A00"}}>{num}</span>
      <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:"clamp(38px,6vw,68px)",letterSpacing:5,color:"#E8DFC8",margin:0,textShadow:"0 0 40px rgba(255,106,0,0.18)"}}>{title}</h2>
      <div style={{flex:1,height:1,background:"linear-gradient(90deg,rgba(255,106,0,0.4),transparent)"}}/>
    </div>
  );
}
function Divider(){return<div style={{height:1,margin:"0 60px",position:"relative",zIndex:2,background:"linear-gradient(90deg,#FF6A00,rgba(255,106,0,0.1),transparent)"}}/>;}
function Tag({children}){return<span style={{fontFamily:"Share Tech Mono,monospace",fontSize:9,letterSpacing:1.5,padding:"5px 12px",border:"1px solid rgba(255,106,0,0.28)",color:"rgba(232,223,200,0.45)",background:"rgba(255,106,0,0.04)"}}>{children}</span>;}

// ─────────────────────────────────────────────────────────────
// POSITION GENERATORS — side corridors only, never over content
// ─────────────────────────────────────────────────────────────
function genPositions(count,existing=[]){
  const minDist=180,result=[...existing];
  const W=window.innerWidth,H=window.innerHeight;
  // Text block is left-aligned, roughly 0–52% of width, 20–80% of viewport height
  // Safe zone: right of 55% width, or below the hero (y > H)
  // Also allow anywhere in the right 45% of screen at any scroll depth
  const textRight=W*0.54; // text ends around here
  let attempts=0;
  while(result.length<existing.length+count&&attempts<3000){
    attempts++;
    const x=textRight+Math.random()*(W-textRight-40); // right of text
    const y=80+Math.random()*(H*0.85); // within hero height
    if(!result.some(p=>Math.hypot(p.x-x,p.y-y)<minDist))result.push({x,y});
  }
  return result.slice(existing.length);
}
function genBgPositions(count,existing=[]){
  const minDist=120,result=[...existing];
  const W=window.innerWidth,H=window.innerHeight;
  const sideW=Math.max(W*0.12,60);
  let attempts=0;
  while(result.length<existing.length+count&&attempts<3000){
    attempts++;
    const x=Math.random()<0.5?20+Math.random()*sideW:W-20-Math.random()*sideW;
    const y=80+Math.random()*(H-120);
    if(!result.some(p=>Math.hypot(p.x-x,p.y-y)<minDist))result.push({x,y});
  }
  return result.slice(existing.length);
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function App(){
  const[revealed,setRevealed]=useState(false);
  const[shots,setShots]=useState(0);
  const[modal,setModal]=useState(null);
  const[tState,setTState]=useState({});
  const[bgTargets,setBgTargets]=useState([]);
  const[sideState,setSideState]=useState({});
  const bulletsRef=useRef(null);
  const bulletId=useRef(0);
  const[formStatus,setFormStatus]=useState('idle'); // idle | sending | sent | error
  const formRef=useRef(null);

  const projects=[
    {id:'p1',num:'001',
      title:"NEXUS DASHBOARD",
      desc:"Real-time SaaS analytics platform built for scale. Tracks user funnels, revenue metrics, and system health across distributed services. Handles 50k+ events/day with sub-100ms query response. Built solo in 6 weeks.",
      stack:["React","Node.js","PostgreSQL","Redis","Chart.js"],
      link:"https://github.com/",
      image:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"},
    {id:'p2',num:'002',
      title:"DROPFORGE CLI",
      desc:"Developer productivity tool that scaffolds full-stack projects from a single command. Supports 12 templates, custom config files, and auto-installs dependencies. Used by 200+ developers on GitHub.",
      stack:["TypeScript","Node.js","Commander.js","Inquirer"],
      link:"https://github.com/",
      image:"https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80"},
    {id:'p3',num:'003',
      title:"CARTWAVE",
      desc:"Headless e-commerce engine with a custom storefront. Features cart persistence, Stripe payments, inventory sync, and an admin panel. Processes real transactions — launched for a local clothing brand.",
      stack:["Next.js","Stripe","Supabase","Tailwind","Vercel"],
      link:"https://github.com/",
      image:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"},
  ];

  const sideTargets=[
    {...projects[0],sid:'s1',side:'right',topPct:38},
    {...projects[1],sid:'s2',side:'left', topPct:58},
    {...projects[2],sid:'s3',side:'right',topPct:76},
  ];

  useEffect(()=>{
    const pp=genPositions(projects.length);
    const s={};
    projects.forEach((p,i)=>{s[p.id]={pos:pp[i],visible:true};});
    setTState(s);
    setBgTargets(genBgPositions(8));
    const ss={};['s1','s2','s3'].forEach(sid=>{ss[sid]=true;});
    setTimeout(()=>setSideState(ss),900);
    setTimeout(()=>setRevealed(true),300);
  },[]);

  // Bullet injection — pure DOM, zero React re-render
  useEffect(()=>{
    const container=bulletsRef.current;
    const h=e=>{
      if(!container)return;
      const el=document.createElement('div');
      el.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:9998;pointer-events:none;will-change:transform,opacity;filter:drop-shadow(0 0 4px rgba(255,160,0,0.6));transform:translate(-50%,-50%) rotate(15deg);`;
      el.innerHTML=`<svg width="38" height="14" viewBox="0 0 38 14" fill="none">
        <defs>
          <linearGradient id="bcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFE08A"/>
            <stop offset="40%" stop-color="#C8880A"/>
            <stop offset="100%" stop-color="#7A4A00"/>
          </linearGradient>
          <linearGradient id="blg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#D8D8D8"/>
            <stop offset="45%" stop-color="#A0A0A0"/>
            <stop offset="100%" stop-color="#606060"/>
          </linearGradient>
        </defs>
        <rect x="13" y="2" width="22" height="10" rx="1" fill="url(#bcg)"/>
        <rect x="15" y="2.5" width="18" height="2" rx="0.5" fill="rgba(255,230,140,0.3)"/>
        <rect x="11" y="1.5" width="3" height="11" rx="0.5" fill="#5A3A00"/>
        <path d="M13 3 Q22 3 36 7 Q22 11 13 11 Z" fill="url(#blg)"/>
        <path d="M22 3.5 Q32 5 36 7 Q32 6 22 5 Z" fill="rgba(255,255,255,0.15)"/>
        <circle cx="12.5" cy="7" r="1.8" fill="#3A2800"/>
        <ellipse cx="10" cy="7" rx="4" ry="5" fill="#FF6A00" opacity="0.12"/>
      </svg>`;
      container.appendChild(el);
      const dur=260;let start=null;
      const tick=ts=>{
        if(!start)start=ts;
        const t=Math.min((ts-start)/dur,1);
        const ease=1-Math.pow(1-t,2);
        el.style.transform=`translate(-50%,-50%) rotate(15deg) scale(${1-ease*0.93})`;
        el.style.opacity=t<0.25?1:1-(t-0.25)/0.75;
        if(t<1)requestAnimationFrame(tick);else el.remove();
      };
      requestAnimationFrame(tick);
    };
    window.addEventListener('click',h);
    return()=>window.removeEventListener('click',h);
  },[]);

  // ── EmailJS — replace the 3 values below with yours ──────────
  const EMAILJS_SERVICE  = 'service_s68q7vs';   // e.g. service_abc123
  const EMAILJS_TEMPLATE = 'template_u0a1vjl';  // e.g. template_abc123
  const EMAILJS_KEY      = 'XPCZiDMRrlySJ7rvj';   // Account → API Keys

  const handleFormSubmit = useCallback(async e => {
    e.preventDefault();
    if(formStatus==='sending'||formStatus==='sent') return;
    setFormStatus('sending');
    try {
      const res = await fetch(`https://api.emailjs.com/api/v1.0/email/send`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          service_id:EMAILJS_SERVICE,
          template_id:EMAILJS_TEMPLATE,
          user_id:EMAILJS_KEY,
          template_params:{
            name:formRef.current.querySelector('[name="name"]').value,
            email:formRef.current.querySelector('[name="email"]').value,
            message:formRef.current.querySelector('[name="message"]').value,
          }
        })
      });
      setFormStatus(res.ok?'sent':'error');
    } catch(err){ setFormStatus('error'); }
  },[formStatus]);

  const handleShot=useCallback(pid=>{
    setShots(n=>n+1);
    const proj=projects.find(p=>p.id===pid);
    setTState(prev=>({...prev,[pid]:{...prev[pid],visible:false}}));
    setTimeout(()=>setModal(proj),500);
    setTimeout(()=>{
      setTState(prev=>{
        const occ=Object.entries(prev).filter(([k,v])=>k!==pid&&v.visible).map(([,v])=>v.pos);
        const[np]=genPositions(1,occ);
        const H=window.innerHeight,W=window.innerWidth;const tx=W*0.54;const fb={x:tx+Math.random()*(W-tx-40),y:80+Math.random()*(H*0.85)};return{...prev,[pid]:{pos:np||fb,visible:true}};
      });
    },2800);
  },[]);

  const handleSideShot=useCallback(sid=>{
    setShots(n=>n+1);
    const st=[{sid:'s1',id:'p1'},{sid:'s2',id:'p2'},{sid:'s3',id:'p3'}].find(x=>x.sid===sid);
    const proj=projects.find(p=>p.id===st.id);
    setSideState(prev=>({...prev,[sid]:false}));
    setTimeout(()=>setModal(proj),500);
    setTimeout(()=>setSideState(prev=>({...prev,[sid]:true})),3000);
  },[]);

  const mono="Share Tech Mono,monospace",display="Bebas Neue,sans-serif",body="DM Sans,sans-serif";
  const orange="#FF6A00",text="#E8DFC8",muted="rgba(232,223,200,0.45)";
  const skills=[
    {cat:"Frontend",name:"INTERFACES",tags:["React","HTML","CSS","JavaScript","TypeScript"]},
    {cat:"Backend", name:"SYSTEMS",   tags:["Node.js","Python","REST APIs","SQL","Java"]},
    {cat:"Tooling", name:"WORKFLOW",  tags:["Git","Linux","Docker","VS Code","CI/CD"]},
  ];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=DM+Sans:wght@300;400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:#040703;overflow-x:hidden;cursor:none!important;}
        *{cursor:none!important;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#040703;}::-webkit-scrollbar-thumb{background:#FF6A00;}
        @keyframes boardSway{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}
        @keyframes boardShake{0%{transform:rotate(-1.8deg) translateX(0)}25%{transform:rotate(-6deg) translateX(-7px)}50%{transform:rotate(4deg) translateX(7px)}75%{transform:rotate(-3deg) translateX(-3px)}100%{transform:rotate(-1.8deg) translateX(0)}}
        @keyframes shardFall{0%{opacity:1;transform:rotate(var(--r,0deg)) scale(1)}50%{opacity:0.7}100%{opacity:0.3;transform:rotate(calc(var(--r,0deg) + 25deg)) scale(0.9) translateY(10px)}}
        @keyframes stampIn{0%{transform:translate(-50%,-50%) scale(2.8) rotate(-15deg);opacity:0}60%{transform:translate(-50%,-50%) scale(0.88) rotate(4deg);opacity:1}100%{transform:translate(-50%,-50%) scale(1) rotate(-8deg);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes glowPulse{0%,100%{text-shadow:0 0 20px rgba(255,106,0,0.25)}50%{text-shadow:0 0 60px rgba(255,106,0,0.6),0 0 100px rgba(255,106,0,0.15)}}
        @keyframes tFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-9px)}}
        @keyframes hitRing{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0.9}100%{transform:translate(-50%,-50%) scale(1.7);opacity:0}}
        @keyframes scanLine{0%{top:0%}100%{top:100%}}
        .nav-link{font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:3px;color:rgba(232,223,200,0.4);text-decoration:none;text-transform:uppercase;transition:all 0.2s;position:relative;}
        .nav-link::after{content:'';position:absolute;left:0;bottom:-3px;width:0;height:1px;background:#FF6A00;transition:width 0.2s;}
        .nav-link:hover{color:#FF6A00;}.nav-link:hover::after{width:100%;}
        .skill-card{border:1px solid rgba(255,106,0,0.18);padding:32px 26px;background:rgba(4,7,2,0.9);transition:all 0.35s ease;position:relative;overflow:hidden;}
        .skill-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#FF6A00,transparent);transform:scaleX(0);transition:transform 0.4s ease;}
        .skill-card:hover{border-color:rgba(255,106,0,0.6);background:rgba(255,106,0,0.05);transform:translateY(-6px);box-shadow:0 14px 44px rgba(0,0,0,0.55);}
        .skill-card:hover::before{transform:scaleX(1);}
        .contact-row{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border:1px solid rgba(255,106,0,0.18);background:rgba(4,7,2,0.9);text-decoration:none;transition:all 0.25s;position:relative;overflow:hidden;}
        .contact-row::before{content:'';position:absolute;left:-100%;top:0;bottom:0;width:100%;background:linear-gradient(90deg,transparent,rgba(255,106,0,0.06),transparent);transition:left 0.4s ease;}
        .contact-row:hover{border-color:#FF6A00;padding-left:32px;}.contact-row:hover::before{left:100%;}
        .btn-primary{font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;background:#FF6A00;color:#040703;border:none;text-decoration:none;font-weight:bold;transition:all 0.2s;display:inline-block;}
        .btn-primary:hover{background:#FF8C00;transform:translateY(-3px);box-shadow:0 6px 32px rgba(255,106,0,0.5);}
        .btn-outline{font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:16px 36px;background:transparent;color:#FF6A00;border:1px solid #FF6A00;text-decoration:none;display:inline-block;transition:all 0.2s;}
        .btn-outline:hover{background:rgba(255,106,0,0.1);transform:translateY(-3px);}
        .stat-card{border:1px solid rgba(255,106,0,0.18);padding:26px 22px;background:rgba(3,6,2,0.95);position:relative;overflow:hidden;transition:all 0.25s;}
        .stat-bar{position:absolute;top:0;left:0;width:3px;height:0;background:linear-gradient(180deg,#FF6A00,#FF3D00);transition:height 0.45s ease;}
        .stat-card:hover{border-color:rgba(255,106,0,0.5);}.stat-card:hover .stat-bar{height:100%!important;}
        input,textarea{width:100%;background:rgba(4,7,2,0.95);border:1px solid rgba(255,106,0,0.2);color:#E8DFC8;font-family:Share Tech Mono,monospace;font-size:13px;padding:14px 18px;outline:none;transition:all 0.2s;resize:none;}
        input:focus,textarea:focus{border-color:#FF6A00;box-shadow:0 0 18px rgba(255,106,0,0.12);}
        input::placeholder,textarea::placeholder{color:rgba(232,223,200,0.2);}
        #hero,#about{user-select:none;-webkit-user-select:none;}
        @media(max-width:900px){nav{padding:14px 24px!important;}.nav-desktop{display:none!important;}section{padding:80px 24px!important;}.about-grid,.contact-grid{grid-template-columns:1fr!important;gap:40px!important;}.skills-grid{grid-template-columns:1fr 1fr!important;}.hud-corner,.tfloat{display:none!important;}}
      `}</style>

      <div id="zoom-root" style={{willChange:'transform',contain:'layout style'}}>

        {/* Backgrounds */}
        <div style={{position:"fixed",inset:0,zIndex:0,background:"#040703"}}/>
        <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse 60% 45% at 20% 30%,rgba(24,32,10,0.7),transparent),radial-gradient(ellipse 50% 40% at 80% 70%,rgba(18,26,8,0.65),transparent)"}}/>
        <svg style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:0.055,width:"100%",height:"100%"}}>
          <defs><pattern id="hexgrid" x="0" y="0" width="52" height="60" patternUnits="userSpaceOnUse"><polygon points="26,1 51,15 51,45 26,59 1,45 1,15" fill="none" stroke="#FF6A00" strokeWidth="0.6"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#hexgrid)"/>
        </svg>
        <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:0.018,backgroundImage:"linear-gradient(rgba(255,106,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,0,1) 1px,transparent 1px)",backgroundSize:"22px 22px"}}/>
        <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)"}}/>
        <div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.75) 100%)"}}/>
        <div style={{position:"fixed",left:0,right:0,top:0,height:2,zIndex:2,pointerEvents:"none",background:"linear-gradient(90deg,transparent,rgba(255,106,0,0.08),transparent)",animation:"scanLine 8s linear infinite"}}/>

        {bgTargets.map((pos,i)=><BgTarget key={i} pos={pos} delay={i*120+400} seed={i*7+3}/>)}

        {projects.map(p=>{
          const ts=tState[p.id];if(!ts)return null;
          return<RangeTarget key={p.id} mode="float" project={p} pos={ts.pos} visible={ts.visible} onShot={handleShot}/>;
        })}

        {sideTargets.map(st=>(
          <RangeTarget key={st.sid} mode="edge" project={st} side={st.side} topPct={st.topPct} visible={!!sideState[st.sid]} onShot={()=>handleSideShot(st.sid)}/>
        ))}

        {/* NAV */}
        <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 60px",borderBottom:"1px solid rgba(255,106,0,0.15)",background:"rgba(2,4,1,0.96)",backdropFilter:"blur(20px)"}}>
          <span style={{fontFamily:display,fontSize:22,letterSpacing:5,color:orange}}>AMINE</span>
          <ul className="nav-desktop" style={{display:"flex",gap:36,listStyle:"none"}}>
            {["about","skills","projects","contact"].map(s=>(
              <li key={s}><a href={`#${s}`} className="nav-link">◈ {s}</a></li>
            ))}
          </ul>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:"rgba(255,106,0,0.5)"}}>
              TARGETS HIT: {String(shots).padStart(3,"0")} · HOLD RMB: 2× ZOOM
            </div>
            <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:"#FFAB00",display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#FFAB00",animation:"pulse 2s infinite"}}/>
              AVAILABLE FOR HIRE
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section id="hero" style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",padding:"120px 60px 80px",position:"relative",zIndex:2}}>
          <div className="hud-corner" style={{position:"absolute",top:90,right:60}}><HUD shots={shots}/></div>
          <div style={{position:"relative",zIndex:2}}>
            <div style={{fontFamily:mono,fontSize:11,letterSpacing:4,color:orange,marginBottom:28,opacity:revealed?1:0,animation:revealed?"fadeUp 0.6s ease 0.2s both":"none"}}>
              ◈ FILE #0047 — SUBJECT PROFILE — CLEARANCE: OPEN
            </div>
            <div style={{marginBottom:10,opacity:revealed?1:0,animation:revealed?"fadeUp 0.8s ease 0.4s both":"none"}}>
              <span style={{fontFamily:display,fontSize:"clamp(90px,17vw,200px)",lineHeight:0.85,letterSpacing:6,color:orange,display:"block",animation:"glowPulse 4s ease infinite"}}>AMINE</span>
            </div>
            <div style={{fontFamily:display,fontSize:"clamp(18px,3.5vw,46px)",letterSpacing:7,color:muted,marginBottom:44,opacity:revealed?1:0,animation:revealed?"fadeUp 0.8s ease 0.6s both":"none"}}>
              Software Engineer
            </div>
            <p style={{maxWidth:520,fontSize:15,lineHeight:1.95,color:muted,fontWeight:300,fontFamily:body,marginBottom:52,borderLeft:`2px solid ${orange}`,paddingLeft:22,opacity:revealed?1:0,animation:revealed?"fadeUp 0.8s ease 0.8s both":"none"}}>
              Degree in Software Engineering. Bold, experimental, built to disrupt. I write code that works and build systems that don't look like everything else. Currently undeployed — but not for long.
            </p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",opacity:revealed?1:0,animation:revealed?"fadeUp 0.8s ease 1s both":"none"}}>
              <a href="#about" className="btn-primary">▸ ENTER DOSSIER</a>
              <a href="#contact" className="btn-outline">◈ MAKE CONTACT</a>
            </div>
          </div>
          <div style={{position:"absolute",bottom:32,left:60,right:60,display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:9,letterSpacing:2,color:"rgba(255,106,0,0.22)",borderTop:"1px solid rgba(255,106,0,0.1)",paddingTop:12,zIndex:2}}>
            <span>SHOOT TARGETS × 3 TO VIEW PROJECTS · HOLD RIGHT-CLICK: 2× SCOPE ZOOM</span>
            <span>SUBJECT-AMINE · REF-2025-SE</span>
          </div>
        </section>

        <Divider/>

        {/* ABOUT */}
        <Section id="about">
          <SectionHeader num="◈ 01" title="DOSSIER"/>
          <div className="about-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:72,alignItems:"start"}}>
            <div style={{fontFamily:body,fontSize:15,lineHeight:2.05,color:muted,fontWeight:300}}>
              <p><strong style={{color:text,fontWeight:400}}>AMINE</strong> is a software engineering graduate with a sharp eye for systems, structure, and code that actually ships. The degree is done. The skills are real. The right opportunity hasn't arrived yet — but it will.</p>
              <p style={{marginTop:22}}>Experimental by nature, methodical by training. Whether architecting a backend, building a frontend from scratch, or solving a problem nobody else thought to look at — the approach is always the same: <strong style={{color:text,fontWeight:400}}>go further than expected.</strong></p>
              <p style={{marginTop:22}}>Available. Ambitious. Ready to deploy.</p>
              <div style={{marginTop:32,padding:"16px 20px",border:"1px solid rgba(255,106,0,0.18)",background:"rgba(255,106,0,0.03)",fontFamily:mono,fontSize:10,letterSpacing:2,color:"rgba(255,106,0,0.6)",lineHeight:2.2}}>
                ▸ STATUS: SEEKING DEPLOYMENT<br/>
                ▸ FIELD: SOFTWARE ENGINEERING<br/>
                ▸ CLEARANCE: OPEN
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
              {[["SE","Degree Field"],["∞","Problems Solved"],["01","Status: Ready"],["4M","Identity Code"]].map(([val,lbl])=>(
                <div key={lbl} className="stat-card">
                  <div className="stat-bar"/>
                  <div style={{fontFamily:display,fontSize:52,color:orange,letterSpacing:2,lineHeight:1,marginBottom:8,textShadow:`0 0 20px ${orange}44`}}>{val}</div>
                  <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:muted,textTransform:"uppercase"}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Divider/>

        {/* SKILLS */}
        <Section id="skills" dark>
          <SectionHeader num="◈ 02" title="CAPABILITIES"/>
          <div className="skills-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
            {skills.map(s=>(
              <div key={s.name} className="skill-card">
                <div style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:orange,textTransform:"uppercase",marginBottom:14}}>{s.cat}</div>
                <div style={{fontFamily:display,fontSize:30,letterSpacing:3,color:text,marginBottom:14}}>{s.name}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{s.tags.map(t=><Tag key={t}>{t}</Tag>)}</div>
              </div>
            ))}
          </div>
        </Section>

        <Divider/>

        {/* PROJECTS */}
        <Section id="projects">
          <SectionHeader num="◈ 03" title="OPERATIONS"/>
          <p style={{fontFamily:mono,fontSize:11,letterSpacing:2,color:"rgba(255,106,0,0.4)",marginBottom:36,borderLeft:"2px solid rgba(255,106,0,0.25)",paddingLeft:16}}>
            ◈ SHOOT THE FLOATING TARGETS 3× TO NEUTRALIZE — OR BROWSE BELOW
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:2}}>
            <div style={{gridColumn:"span 2",display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,border:"1px solid rgba(255,106,0,0.18)",background:"rgba(3,6,2,0.95)",position:"relative",overflow:"hidden",transition:"all 0.35s ease"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,106,0,0.55)";e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 18px 52px rgba(0,0,0,0.6)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,106,0,0.18)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:"linear-gradient(180deg,#FF6A00,#FF3D00)",opacity:0.7}}/>
              <div style={{padding:"38px 34px"}}>
                <div style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:"rgba(255,106,0,0.4)",marginBottom:16}}>PROJECT — {projects[0].num} · FEATURED</div>
                <div style={{fontFamily:display,fontSize:38,letterSpacing:3,color:text,marginBottom:12,lineHeight:1.05}}>{projects[0].title}</div>
                <p style={{fontFamily:body,fontSize:13,lineHeight:1.85,color:muted,fontWeight:300,marginBottom:22}}>{projects[0].desc}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:24}}>{projects[0].stack.map(t=><Tag key={t}>{t}</Tag>)}</div>
                {projects[0].link&&<a href={projects[0].link} target="_blank" rel="noreferrer" style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:orange,textDecoration:"none"}}>VIEW PROJECT ——▸</a>}
              </div>
              <div style={{position:"relative",overflow:"hidden",minHeight:220,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,6,2,0.98)"}}>
                {projects[0].image
                  ?<img src={projects[0].image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.85,filter:"saturate(0.7) contrast(1.1)",position:"absolute",inset:0}}/>
                  :<><div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,106,0,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,0,0.035) 1px,transparent 1px)",backgroundSize:"18px 18px"}}/><span style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:"rgba(255,106,0,0.22)",position:"relative",textAlign:"center",lineHeight:2}}>ADD IMAGE IN App.jsx<br/>image: "/yourfile.jpg"</span></>
                }
              </div>
            </div>
            {projects.slice(1).map(p=>(
              <div key={p.id} style={{border:"1px solid rgba(255,106,0,0.18)",background:"rgba(3,6,2,0.95)",position:"relative",overflow:"hidden",transition:"all 0.35s ease"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,106,0,0.55)";e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 18px 52px rgba(0,0,0,0.6)";const b=e.currentTarget.querySelector(".pbar");if(b)b.style.height="100%";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,106,0,0.18)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";const b=e.currentTarget.querySelector(".pbar");if(b)b.style.height="0";}}>
                <div className="pbar" style={{position:"absolute",top:0,left:0,width:3,height:0,background:"linear-gradient(180deg,#FF6A00,#FF3D00)",transition:"height 0.4s ease"}}/>
                <div style={{height:170,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,6,2,0.98)"}}>
                  {p.image
                    ?<img src={p.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.85,filter:"saturate(0.7) contrast(1.1)"}}/>
                    :<><div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,106,0,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,106,0,0.035) 1px,transparent 1px)",backgroundSize:"18px 18px"}}/><span style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:"rgba(255,106,0,0.22)",position:"relative"}}>ADD IMAGE</span></>
                  }
                </div>
                <div style={{padding:"26px 30px"}}>
                  <div style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:"rgba(255,106,0,0.4)",marginBottom:12}}>PROJECT — {p.num}</div>
                  <div style={{fontFamily:display,fontSize:30,letterSpacing:3,color:text,marginBottom:10,lineHeight:1.05}}>{p.title}</div>
                  <p style={{fontFamily:body,fontSize:13,lineHeight:1.85,color:muted,fontWeight:300,marginBottom:18}}>{p.desc}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:20}}>{p.stack.map(t=><Tag key={t}>{t}</Tag>)}</div>
                  {p.link&&<a href={p.link} target="_blank" rel="noreferrer" style={{fontFamily:mono,fontSize:10,letterSpacing:3,color:orange,textDecoration:"none"}}>VIEW PROJECT ——▸</a>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Divider/>

        {/* CONTACT */}
        <Section id="contact" dark>
          <SectionHeader num="◈ 04" title="MAKE CONTACT"/>
          <div className="contact-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:88,alignItems:"start"}}>
            <div>
              <p style={{fontFamily:body,fontSize:15,lineHeight:2.05,color:muted,fontWeight:300,marginBottom:44}}>
                Available for full-time roles, freelance contracts, and interesting problems. If you've got something worth building — let's talk.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {[["◈ Email","mailto:you@email.com"],["◈ GitHub","https://github.com/"],["◈ LinkedIn","https://linkedin.com/"]].map(([label,href])=>(
                  <a key={label} href={href} className="contact-row" target="_blank" rel="noreferrer">
                    <span style={{fontFamily:mono,fontSize:11,letterSpacing:3,color:muted,textTransform:"uppercase"}}>{label}</span>
                    <span style={{fontFamily:mono,fontSize:16,color:orange}}>——▸</span>
                  </a>
                ))}
              </div>
            </div>
            <form ref={formRef} onSubmit={handleFormSubmit} style={{display:"flex",flexDirection:"column",gap:2}}>
              <div style={{marginBottom:2}}>
                <label style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:orange,textTransform:"uppercase",display:"block",marginBottom:7}}>◈ Name</label>
                <input type="text" name="name" placeholder="Your name" required/>
              </div>
              <div style={{marginBottom:2}}>
                <label style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:orange,textTransform:"uppercase",display:"block",marginBottom:7}}>◈ Email</label>
                <input type="email" name="email" placeholder="your@email.com" required/>
              </div>
              <div style={{marginBottom:2}}>
                <label style={{fontFamily:mono,fontSize:9,letterSpacing:3,color:orange,textTransform:"uppercase",display:"block",marginBottom:7}}>◈ Message</label>
                <textarea name="message" placeholder="What are you working on?" style={{height:130}} required/>
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:10,alignSelf:"flex-start",opacity:formStatus==='sending'?0.6:1,transition:'opacity 0.2s'}}>
                {formStatus==='idle'   && '▸ TRANSMIT MESSAGE'}
                {formStatus==='sending'&& '▸ TRANSMITTING...'}
                {formStatus==='sent'   && '✓ MESSAGE RECEIVED'}
                {formStatus==='error'  && '✕ TRANSMISSION FAILED — RETRY'}
              </button>
              {formStatus==='sent' && <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:orange,marginTop:10}}>◈ TRANSMISSION CONFIRMED. STANDING BY.</div>}
              {formStatus==='error'&& <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:'#FF3D00',marginTop:10}}>◈ SIGNAL LOST. CHECK YOUR IDs OR TRY AGAIN.</div>}
            </form>
          </div>
        </Section>

        {/* FOOTER */}
        <footer style={{padding:"28px 60px",borderTop:"1px solid rgba(255,106,0,0.14)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:2,background:"rgba(2,4,1,0.98)"}}>
          <span style={{fontFamily:display,fontSize:17,letterSpacing:4,color:orange}}>AMINE</span>
          <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:"rgba(232,223,200,0.12)"}}>© 2025 · ALL RIGHTS RESERVED</div>
          <div style={{fontFamily:mono,fontSize:10,letterSpacing:2,color:"rgba(255,106,0,0.28)"}}>CLEARANCE: OPEN · FILE #0047</div>
        </footer>

      </div>

      <ScopeCursor/>
      <div ref={bulletsRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9998}}/>
      <div id="zoom-vig" style={{position:"fixed",inset:0,zIndex:9990,pointerEvents:"none",opacity:0,transition:"opacity 0.1s ease",background:"radial-gradient(ellipse 50% 50% at center,transparent 0%,rgba(0,0,0,0.88) 100%)",boxShadow:"inset 0 0 0 3px rgba(255,106,0,0.4)"}}/>
      {modal&&<ProjectModal project={modal} onClose={()=>setModal(null)}/>}
    </>
  );
}
