import { useState } from "react";

/* ================================================================
   ASSET FILE LIST — place these in your /public folder:

   kiko-k.png        K icon button (top-left corner, every screen)
   kiko-logo.png     KIKO block-letter logo (splash only)
   kiko-whale.png    Full Kiko whale shark illustration
   bg-home.png       Splash screen background
   bg-subjects.png   Subject select screen background
   bg-path.png       Math checkpoint path screen background
   bg-lesson.png     Lesson teach + check screen background
   starfish.png      Starfish overlay (LET'S TRY THIS header only)
   jellyfish.png     Jellyfish decoration (splash only, top-right)
================================================================ */

const OCEAN = "linear-gradient(168deg,#6DE4F0 0%,#3BBBD4 38%,#1894BC 68%,#0B72A0 100%)";
const LESSON_SEQ = ["1.1","1.2","1.3","ms1","2.1","2.2"];

/* ── Lesson content ─────────────────────────────────────────── */
const LESSONS = {
  "1.1": {
    key:"1.1", title:"Bilang 1 hanggang 5",
    slides:[
      {
        header:"ARALIN 1.1", title:"Matuto tayong magbilang!",
        body:"Habang nagbibilang, ituro ang bawat bagay. Magsimula tayo sa isa kasama si Kiko!",
        visual:{ type:"sequence", emoji:"🐟", entries:[
          {n:1,word:"Isa"},{n:2,word:"Dalawa"},{n:3,word:"Tatlo"},
          {n:4,word:"Apat"},{n:5,word:"Lima"},
        ]},
      },
      {
        header:"ARALIN 1.1", title:"Subukan natin!",
        body:"Bilangin ang mga alimango. Tukuyin kung ilan ang mayroon!",
        visual:{ type:"count-demo", emoji:"🦀", count:4, label:"Apat! (4) 🎉" },
      },
    ],
    check:{ q:"Ilan ang mga isda?", emoji:"🐟", count:3, opts:[2,3,4], ans:3 },
  },
  "1.2": {
    key:"1.2", title:"Bilang 1 hanggang 10",
    slides:[
      {
        header:"ARALIN 1.2", title:"Dagdag pa tayo!",
        body:"Napakagaling! Natutunan mo na ang 1-5. Ngayon, alamin natin ang 6 hanggang 10!",
        visual:{ type:"sequence", emoji:"🐙", entries:[
          {n:6,word:"Anim"},{n:7,word:"Pito"},{n:8,word:"Walo"},
          {n:9,word:"Siyam"},{n:10,word:"Sampu"},
        ]},
      },
      {
        header:"ARALIN 1.2", title:"Bilangin natin!",
        body:"Gamitin ang iyong mga daliri! Bilangin ang lahat ng pagong.",
        visual:{ type:"count-demo", emoji:"🐢", count:8, label:"Walo! (8) 🎉" },
      },
    ],
    check:{ q:"Ilan ang mga pagong?", emoji:"🐢", count:9, opts:[7,9,10], ans:9 },
  },
};

/* ── Supplementary materials ──────────────────────────────── */
const SUPP = [
  {
    id:"s1", title:"Karagdagang Pagsasanay", subtitle:"Bilang 1 hanggang 10",
    tag:"MATH", icon:"📝", type:"quiz",
    items:[
      {emoji:"⭐",count:6,q:"Ilan ang mga bituin?",  opts:[5,6,7], ans:6},
      {emoji:"🐠",count:4,q:"Ilan ang mga isda?",   opts:[3,4,5], ans:4},
      {emoji:"🦀",count:7,q:"Ilan ang mga alimango?",opts:[6,7,8],ans:7},
    ],
  },
  {
    id:"s2", title:"Kwento ni Kiko", subtitle:"Ang mga Kaibigan sa Dagat",
    tag:"KWENTO", icon:"📖", type:"story",
    pages:[
      "Si Kiko ay isang palakaibigang butanding. Mayroon siyang sampung kaibigan sa dagat.",
      "Una, lumangoy si Kiko at nakita niya ang tatlong isda. 1... 2... 3! Tatlo sila!",
      "Pagkatapos, nakita niya ang limang pagong. 1... 2... 3... 4... 5! Lima sila!",
      "Kasama ang lahat, si Kiko ngayon ay may sampung kaibigan. Salamat sa pagbilang kasama namin!",
    ],
  },
];

/* ── Path node layout ──────────────────────────────────────── */
const PATH_NODES = [
  {id:"n1",key:"1.1", type:"lesson",    cx:218,cy:470},
  {id:"n2",key:"1.2", type:"lesson",    cx:110,cy:386},
  {id:"n3",key:"1.3", type:"lesson",    cx:260,cy:302},
  {id:"n4",key:"ms1", type:"milestone", cx:130,cy:220},
  {id:"n5",key:"2.1", type:"lesson",    cx:256,cy:140},
  {id:"n6",key:"2.2", type:"lesson",    cx:168,cy:58 },
];

/* ================================================================
   SHARED COMPONENTS
================================================================ */
const BgImg = ({src, fallback=OCEAN}) => (
  <img src={src} alt="" draggable="false" style={{
    position:"absolute",inset:0,width:"100%",height:"100%",
    objectFit:"cover",zIndex:0,pointerEvents:"none",
  }} onError={e=>{e.target.style.display="none";}}/>
);

const SBar = () => (
  <div style={{position:"absolute",top:0,left:0,right:0,height:28,zIndex:100,
    padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
    background:"rgba(0,0,0,0.10)"}}>
    <span style={{color:"#FFF",fontSize:12,fontWeight:700}}>9:41</span>
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="6" width="3" height="6" rx="1"/><rect x="4.5" y="4" width="3" height="8" rx="1"/><rect x="9" y="2" width="3" height="10" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1" opacity=".35"/></svg>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="0" y="1" width="20" height="10" rx="2" stroke="white" strokeWidth="1.5"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="white"/><rect x="21" y="3.5" width="2.5" height="5" rx="1" fill="white" opacity=".5"/></svg>
    </div>
  </div>
);

const HBar = () => (
  <div style={{position:"absolute",bottom:0,left:0,right:0,height:24,zIndex:100,
    display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.10)"}}>
    <div style={{width:90,height:4,borderRadius:2,background:"rgba(255,255,255,.55)"}}/>
  </div>
);

const KLogo = ({notif=0, onClick}) => (
  <button onClick={onClick} style={{position:"relative",width:44,height:44,
    background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
    <img src="kiko-k.png" alt="K" style={{width:"100%",height:"100%",objectFit:"contain"}}
      onError={e=>{
        e.target.style.display="none";
        e.target.parentNode.style.background="rgba(0,0,0,0.25)";
        e.target.parentNode.style.borderRadius="12px";
        e.target.parentNode.innerHTML+="<span style='color:#FFF;font-weight:900;font-size:20px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)'>K</span>";
      }}/>
    {notif>0&&<div style={{position:"absolute",top:-3,right:-3,width:18,height:18,
      borderRadius:"50%",background:"#FF3B30",color:"#FFF",fontSize:10,fontWeight:900,
      display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #FFF"}}>{notif}</div>}
  </button>
);

const NiModal = ({onClose}) => (
  <div style={{position:"absolute",inset:0,zIndex:999,background:"rgba(0,0,0,0.55)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
    <div style={{background:"#FFF",borderRadius:24,padding:"30px 24px",
      width:"100%",maxWidth:330,textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,0.28)"}}>
      <div style={{fontSize:52,marginBottom:12}}>🚧</div>
      <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:20,marginBottom:10}}>Hindi pa available</h3>
      <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:24}}>
        Sa demo na ito, hindi pa available ang feature na ito. Salamat sa iyong pasensya!
      </p>
      <button onClick={onClose} style={{background:"#007A87",color:"#FFF",border:"none",
        borderRadius:14,padding:"14px 0",fontWeight:800,fontSize:16,
        cursor:"pointer",fontFamily:"inherit",width:"100%"}}>OK, naiintindihan!</button>
    </div>
  </div>
);

/* Lesson slide visual renderer */
const SlideVisual = ({visual}) => {
  if (visual.type==="sequence") return (
    <div style={{background:"#F0F9FF",borderRadius:14,padding:"10px 14px"}}>
      {visual.entries.map((e,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",
          borderBottom:i<visual.entries.length-1?"1px solid #DCF0F8":"none"}}>
          <span style={{fontWeight:900,fontSize:20,color:"#007A87",minWidth:28,textAlign:"center"}}>{e.n}</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:2,flex:1}}>
            {Array.from({length:e.n}).map((_,j)=>(
              <span key={j} style={{fontSize:15}}>{visual.emoji}</span>
            ))}
          </div>
          <span style={{fontWeight:700,fontSize:14,color:"#5A5A72",minWidth:52,textAlign:"right"}}>{e.word}</span>
        </div>
      ))}
    </div>
  );
  if (visual.type==="count-demo") return (
    <div style={{textAlign:"center"}}>
      <div style={{background:"#F0F9FF",borderRadius:14,padding:"14px",
        display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:12}}>
        {Array.from({length:visual.count}).map((_,i)=>(
          <span key={i} style={{fontSize:28}}>{visual.emoji}</span>
        ))}
      </div>
      <div style={{background:"#007A87",color:"#FFF",borderRadius:20,padding:"8px 24px",
        display:"inline-block",fontWeight:800,fontSize:16}}>{visual.label}</div>
    </div>
  );
  return null;
};

/* Kiko at bottom with speech bubble — reused in Check + Supp Quiz */
const KikoBottom = ({msg="YOU CAN\nDO THIS!"}) => (
  <div style={{position:"absolute",bottom:-28,left:0,right:0,height:290,
    display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:15,pointerEvents:"none"}}>
    <div style={{position:"absolute",top:14,right:48,background:"#FFF",
      borderRadius:14,padding:"10px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",zIndex:2}}>
      <div style={{fontWeight:900,fontSize:13,color:"#1C1C2E",textAlign:"center",lineHeight:1.35}}>
        {msg.split("\n").map((l,i)=><span key={i}>{l}{i<msg.split("\n").length-1&&<br/>}</span>)}
      </div>
      <div style={{position:"absolute",bottom:-11,left:18,width:0,height:0,
        borderLeft:"11px solid transparent",borderRight:"6px solid transparent",
        borderTop:"11px solid #FFF"}}/>
    </div>
    <img src="kiko-whale.png" alt="Kiko" style={{width:275,height:"auto",position:"relative",zIndex:1}}/>
  </div>
);

/* ================================================================
   SCREEN: SPLASH
================================================================ */
const Splash = ({go, openMenu, notif}) => (
  <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
    background:OCEAN,display:"flex",flexDirection:"column",alignItems:"center"}}>
    <BgImg src="bg-home.png"/>
    <SBar/>
    <div style={{position:"absolute",top:34,left:16,zIndex:30}}><KLogo notif={notif} onClick={openMenu}/></div>
    <img src="jellyfish.png" alt="" style={{position:"absolute",top:44,right:18,width:74,pointerEvents:"none",zIndex:1}}/>
    <img src="kiko-logo.png" alt="KIKO" style={{width:230,height:"auto",marginTop:130,position:"relative",zIndex:2}}/>
    <p style={{color:"rgba(255,255,255,0.93)",fontSize:14,fontWeight:700,marginTop:10,
      letterSpacing:0.5,textAlign:"center",position:"relative",zIndex:2,
      textShadow:"0 1px 6px rgba(0,0,0,0.2)"}}>Bawat aral, bagong tuklas.</p>
    <button onClick={()=>go("subjects")} style={{marginTop:34,background:"#F5B800",color:"#1C1C2E",
      border:"none",borderRadius:32,padding:"17px 64px",fontWeight:900,fontSize:17,
      cursor:"pointer",fontFamily:"inherit",letterSpacing:1.4,textTransform:"uppercase",
      boxShadow:"0 8px 28px rgba(0,0,0,0.25)",position:"relative",zIndex:2}}>Get Started</button>
    <img src="kiko-whale.png" alt="Kiko" style={{position:"absolute",bottom:36,left:"50%",
      transform:"translateX(-50%)",width:245,pointerEvents:"none",zIndex:1}}/>
    <HBar/>
  </div>
);

/* ================================================================
   SCREEN: SUBJECTS
================================================================ */
const Subjects = ({go, notImpl, openMenu, notif}) => {
  const cards = [
    {k:"math",   label:"MATH",    icon:"3+2",  is:{fontSize:28,fontWeight:900,color:"#FFF",fontStyle:"italic"}, bg:"linear-gradient(135deg,#D4AB32,#A07A10)", action:()=>go("mathPath")},
    {k:"english",label:"ENGLiSH", icon:"ABC",  is:{fontSize:24,fontWeight:900,color:"#FFF"},                    bg:"linear-gradient(135deg,#9870CC,#6040A0)", action:notImpl},
    {k:"science",label:"SCiENCE", icon:"🌱",   is:{fontSize:36},                                                  bg:"linear-gradient(135deg,#60C060,#3A8A3A)", action:notImpl},
  ];
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-subjects.png"/>
      <SBar/>
      <div style={{padding:"34px 20px 14px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu}/>
      </div>
      <div style={{flex:1,padding:"4px 20px 0",display:"flex",flexDirection:"column",gap:16,position:"relative",zIndex:2}}>
        {cards.map(c=>(
          <button key={c.k} onClick={c.action} style={{background:c.bg,border:"none",borderRadius:22,
            padding:"22px 20px",display:"flex",alignItems:"center",cursor:"pointer",
            fontFamily:"inherit",boxShadow:"0 8px 26px rgba(0,0,0,0.18)",textAlign:"left"}}>
            <div style={{width:68,height:68,background:"rgba(255,255,255,0.18)",borderRadius:18,
              flexShrink:0,marginRight:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={c.is}>{c.icon}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{color:"#FFF",fontWeight:900,fontSize:22,marginBottom:5}}>{c.label}</div>
              <div style={{color:"rgba(255,255,255,0.78)",fontSize:13,fontWeight:600}}>10 checkpoints left</div>
            </div>
            <div style={{width:38,height:38,background:"rgba(0,0,0,0.14)",borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:22,fontWeight:700}}>›</div>
          </button>
        ))}
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: MATH PATH
================================================================ */
const MathPath = ({go, notImpl, openMenu, notif, completed, startLesson}) => {
  const SVG_H = 530;
  const getStatus = (key) => {
    if (completed.includes(key)) return "done";
    const next = LESSON_SEQ.find(k=>!completed.includes(k));
    return key===next ? "current" : "locked";
  };
  let d=`M ${PATH_NODES[0].cx} ${PATH_NODES[0].cy}`;
  for(let i=1;i<PATH_NODES.length;i++){
    const p=PATH_NODES[i-1],c=PATH_NODES[i],mx=(p.cx+c.cx)/2;
    d+=` C ${mx} ${p.cy-8}, ${mx} ${c.cy+8}, ${c.cx} ${c.cy}`;
  }
  const nv=(status,type)=>{
    if(type==="milestone") return status==="done"?{bg:"#FFD700",border:"#C8A000",icon:"🏆",sz:20}
      :status==="current"?{bg:"#FFB800",border:"#C08000",icon:"🏆",sz:20}
      :{bg:"#B8C8D0",border:"#8098A8",icon:"🏆",sz:16};
    return status==="done"?{bg:"#6ACC7A",border:"#469856",icon:"✓",sz:22}
      :status==="current"?{bg:"#E07070",border:"#B04848",icon:"●",sz:18}
      :{bg:"#8AB8C8",border:"#5A8898",icon:"🔒",sz:16};
  };
  const handleTap=(node)=>{
    const s=getStatus(node.key);
    if(node.type==="milestone"||s==="locked"||s==="done"){notImpl();return;}
    startLesson(node.key);
  };
  const currentKey=LESSON_SEQ.find(k=>!completed.includes(k));
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-path.png"/>
      <SBar/>
      <div style={{padding:"34px 20px 10px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu}/>
        <button onClick={()=>go("subjects")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Paksa</button>
      </div>
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <svg width={390} height={SVG_H} viewBox={`0 0 390 ${SVG_H}`} style={{position:"absolute",top:0,left:0}}>
          <path d={d} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={26} strokeLinecap="round" transform="translate(0,3)"/>
          <path d={d} fill="none" stroke="#9EDAEA" strokeWidth={24} strokeLinecap="round"/>
          <path d={d} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={8} strokeLinecap="round" strokeDasharray="1 18"/>
        </svg>
        {PATH_NODES.map(n=>{
          const st=getStatus(n.key),v=nv(st,n.type),isMs=n.type==="milestone",sz=isMs?62:54;
          return (
            <button key={n.id} onClick={()=>handleTap(n)} style={{position:"absolute",
              left:n.cx,top:n.cy,transform:"translate(-50%,-50%)",
              width:sz,height:sz,borderRadius:isMs?"16px":"50%",
              background:v.bg,border:`4px solid ${v.border}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#FFF",fontSize:v.sz,fontWeight:900,cursor:"pointer",
              fontFamily:"inherit",boxShadow:"0 4px 18px rgba(0,0,0,0.24)",zIndex:10}}>{v.icon}</button>
          );
        })}
      </div>
      {currentKey&&LESSONS[currentKey]&&(
        <div style={{margin:"0 16px 48px",
          background:"linear-gradient(135deg,#D4AB32,#A07A10)",
          borderRadius:20,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,
          boxShadow:"0 12px 32px rgba(0,0,0,0.28)",position:"relative",zIndex:20}}>
          <div style={{width:46,height:46,background:"rgba(255,255,255,0.18)",borderRadius:14,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:18,fontWeight:900,color:"#FFF",fontStyle:"italic"}}>3+2</span>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"rgba(255,255,255,0.72)",fontSize:10,fontWeight:800,letterSpacing:1}}>MATH</div>
            <div style={{color:"#FFF",fontWeight:900,fontSize:16,lineHeight:1.2,marginTop:1}}>Lesson {currentKey}</div>
            <div style={{color:"rgba(255,255,255,0.82)",fontSize:12,fontWeight:600,marginTop:2}}>{LESSONS[currentKey].title}</div>
          </div>
          <button onClick={()=>startLesson(currentKey)} style={{width:44,height:44,
            background:"rgba(0,0,0,0.15)",borderRadius:"50%",border:"none",
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"#FFF",fontSize:22,fontWeight:700,cursor:"pointer"}}>›</button>
        </div>
      )}
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: LESSON TEACH (slides)
================================================================ */
const LessonTeach = ({lesson, go, openMenu, notif}) => {
  const [idx,setIdx]=useState(0);
  const slide=lesson.slides[idx];
  const isLast=idx===lesson.slides.length-1;
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-lesson.png"/>
      <SBar/>
      <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu}/>
        <button onClick={()=>go("mathPath")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {lesson.slides.map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",
              background:i===idx?"#FFF":"rgba(255,255,255,0.35)",transition:"background 0.2s"}}/>
          ))}
        </div>
      </div>
      <div style={{flex:1,margin:"0 18px",background:"rgba(255,255,255,0.97)",borderRadius:24,
        padding:"22px 20px",display:"flex",flexDirection:"column",position:"relative",zIndex:2,
        boxShadow:"0 16px 44px rgba(0,0,0,0.16)",overflow:"auto"}}>
        <span style={{display:"inline-block",background:"#C8A030",color:"#FFF",borderRadius:20,
          padding:"4px 14px",fontSize:11,fontWeight:800,letterSpacing:1.2,marginBottom:14}}>{slide.header}</span>
        <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:22,marginBottom:10}}>{slide.title}</h2>
        <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:18}}>{slide.body}</p>
        <SlideVisual visual={slide.visual}/>
      </div>
      <div style={{padding:"16px 18px 52px",position:"relative",zIndex:2}}>
        <button onClick={()=>isLast?go("lessonCheck"):setIdx(i=>i+1)} style={{width:"100%",
          background:isLast?"#F5B800":"#007A87",color:isLast?"#1C1C2E":"#FFF",
          border:"none",borderRadius:18,padding:"19px",fontWeight:900,fontSize:17,
          cursor:"pointer",fontFamily:"inherit",letterSpacing:0.5,textTransform:"uppercase",
          boxShadow:"0 8px 24px rgba(0,0,0,0.18)"}}>
          {isLast?"Subukan Natin! 🎯":"Susunod →"}
        </button>
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: LESSON CHECK  — matches the "LET'S TRY THIS!" UI
================================================================ */
const LessonCheck = ({lesson, go, openMenu, notif, onComplete}) => {
  const [selected,setSelected]=useState(null);
  const [answered,setAnswered]=useState(false);
  const ex=lesson.check;
  const handleAnswer=(opt)=>{
    if(answered)return;
    setSelected(opt);setAnswered(true);
    if(opt===ex.ans){setTimeout(()=>{onComplete();go("lessonComplete");},1300);}
    else{setTimeout(()=>{setSelected(null);setAnswered(false);},1700);}
  };
  const cBg=(opt)=>{
    if(!answered)return "#E87878";
    if(opt===ex.ans)return "#6ACC7A";
    if(opt===selected)return "#888";
    return "#E87878";
  };
  const cBd=(opt)=>{
    if(!answered)return "#B04848";
    if(opt===ex.ans)return "#469856";
    if(opt===selected)return "#666";
    return "#B04848";
  };
  const correct=answered&&selected===ex.ans;
  const wrong=answered&&selected!==ex.ans;
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-lesson.png"/>
      <SBar/>

      {/* K logo */}
      <div style={{position:"absolute",top:34,left:16,zIndex:30}}><KLogo notif={notif} onClick={openMenu}/></div>

      {/* "LET'S TRY THIS!" header bar */}
      <div style={{marginTop:60,padding:"14px 24px 14px 80px",
        background:"rgba(10,70,130,0.80)",
        position:"relative",zIndex:10,display:"flex",alignItems:"center"}}>
        {/* Starfish overlapping top-left of header */}
        <img src="starfish.png" alt="" style={{position:"absolute",left:10,top:-26,
          width:60,pointerEvents:"none",zIndex:15}}/>
        <span style={{color:"#FFF",fontWeight:900,fontSize:20,
          textShadow:"0 2px 8px rgba(0,0,0,0.3)",letterSpacing:1,textTransform:"uppercase"}}>
          Let's Try This!
        </span>
      </div>

      {/* Progress bar */}
      <div style={{height:13,background:"rgba(0,0,0,0.15)",position:"relative",zIndex:10}}>
        <div style={{height:"100%",width:"65%",background:"#3A8ED4"}}/>
      </div>

      {/* Golden question card */}
      <div style={{margin:"14px 18px 0",
        background:"linear-gradient(160deg,#D9B040,#B08020)",
        borderRadius:24,padding:"22px 20px 22px",
        display:"flex",flexDirection:"column",alignItems:"center",
        position:"relative",zIndex:10,
        minHeight:275,
        boxShadow:"0 10px 32px rgba(0,0,0,0.22)"}}>
        <p style={{color:"rgba(255,255,255,0.92)",fontWeight:800,fontSize:16,
          textAlign:"center",marginBottom:14,textShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
          {ex.q}
        </p>
        {/* Emoji objects to count */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",
          padding:"6px 0",flex:1,alignContent:"flex-start",width:"100%"}}>
          {Array.from({length:ex.count}).map((_,i)=>(
            <span key={i} style={{fontSize:32,lineHeight:1.25}}>{ex.emoji}</span>
          ))}
        </div>
        {/* Answer circles */}
        <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:18}}>
          {ex.opts.map(opt=>(
            <button key={opt} onClick={()=>handleAnswer(opt)} disabled={answered} style={{
              width:70,height:70,borderRadius:"50%",
              background:cBg(opt),border:`5px solid ${cBd(opt)}`,
              color:"#FFF",fontSize:26,fontWeight:900,
              cursor:answered?"default":"pointer",fontFamily:"inherit",
              boxShadow:"0 4px 14px rgba(0,0,0,0.22)",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.2s"}}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback banner */}
      {(correct||wrong)&&(
        <div style={{position:"absolute",bottom:220,left:18,right:18,zIndex:20,
          padding:"13px 20px",borderRadius:16,
          background:correct?"rgba(106,204,122,0.95)":"rgba(224,112,112,0.95)",
          color:"#FFF",fontWeight:800,fontSize:15,textAlign:"center",
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          {correct?"Tama! Napakagaling mo! 🎉":"Hindi tama. Subukan ulit! 💪"}
        </div>
      )}

      {/* Kiko large at bottom */}
      <KikoBottom msg={"YOU CAN\nDO THIS!"}/>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: LESSON COMPLETE
================================================================ */
const LessonComplete = ({lessonKey, go}) => {
  const lesson=LESSONS[lessonKey]||{};
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
      <BgImg src="bg-lesson.png"/>
      <SBar/>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:28,padding:"32px 24px",
        width:"100%",textAlign:"center",boxShadow:"0 20px 52px rgba(0,0,0,0.20)",
        position:"relative",zIndex:2}}>
        <div style={{fontSize:64,marginBottom:16}}>🌟</div>
        <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:24,marginBottom:8}}>Aralin Tapos Na!</h2>
        <p style={{color:"#5A5A72",fontSize:15,lineHeight:1.65,marginBottom:6}}>Natapos mo ang</p>
        <p style={{color:"#007A87",fontWeight:900,fontSize:18,marginBottom:20}}>
          Lesson {lessonKey}: {lesson.title}
        </p>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>
          {[1,2,3].map(i=><span key={i} style={{fontSize:44}}>⭐</span>)}
        </div>
        <p style={{color:"#5A5A72",fontSize:13,lineHeight:1.65,marginBottom:24}}>
          Naka-unlock ka ng bagong aralin! Patuloy sa iyong paglalakbay kay Kiko.
        </p>
        <button onClick={()=>go("mathPath")} style={{width:"100%",background:"#F5B800",
          color:"#1C1C2E",border:"none",borderRadius:16,padding:"17px",
          fontWeight:900,fontSize:17,cursor:"pointer",fontFamily:"inherit",
          textTransform:"uppercase",letterSpacing:0.5,boxShadow:"0 8px 24px rgba(0,0,0,0.18)"}}>
          Magpatuloy
        </button>
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: SUPPLEMENTARY MATERIALS
================================================================ */
const Materials = ({go, openMenu, notif, synced}) => {
  const [viewing,setViewing]=useState(null);
  const [storyPage,setStoryPage]=useState(0);
  const [qIdx,setQIdx]=useState(0);
  const [qSel,setQSel]=useState(null);
  const [qAns,setQAns]=useState(false);

  if(viewing){
    const mat=SUPP.find(m=>m.id===viewing);
    if(!mat){setViewing(null);return null;}

    // ── Story viewer ──
    if(mat.type==="story") return (
      <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
        background:OCEAN,display:"flex",flexDirection:"column"}}>
        <BgImg src="bg-lesson.png"/>
        <SBar/>
        <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
          <KLogo notif={notif} onClick={openMenu}/>
          <button onClick={()=>{setViewing(null);setStoryPage(0);}} style={{
            background:"rgba(0,0,0,0.15)",border:"none",borderRadius:10,
            padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
            cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
        </div>
        <div style={{flex:1,margin:"0 18px",background:"rgba(255,255,255,0.97)",borderRadius:24,
          padding:"26px 22px",display:"flex",flexDirection:"column",
          position:"relative",zIndex:2,boxShadow:"0 16px 44px rgba(0,0,0,0.16)"}}>
          <span style={{display:"inline-block",background:"#007A87",color:"#FFF",borderRadius:20,
            padding:"4px 14px",fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:16}}>KWENTO</span>
          <p style={{color:"#1C1C2E",fontSize:18,lineHeight:1.85,flex:1,fontWeight:600}}>
            {mat.pages[storyPage]}
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:24}}>
            <span style={{color:"#5A5A72",fontSize:13,fontWeight:700}}>
              Pahina {storyPage+1} sa {mat.pages.length}
            </span>
            <div style={{display:"flex",gap:8}}>
              {storyPage>0&&<button onClick={()=>setStoryPage(p=>p-1)} style={{background:"rgba(0,0,0,0.08)",
                border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,
                cursor:"pointer",fontFamily:"inherit",color:"#1C1C2E"}}>‹</button>}
              {storyPage<mat.pages.length-1
                ?<button onClick={()=>setStoryPage(p=>p+1)} style={{background:"#007A87",border:"none",
                  borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,
                  cursor:"pointer",fontFamily:"inherit",color:"#FFF"}}>Susunod ›</button>
                :<button onClick={()=>{setViewing(null);setStoryPage(0);}} style={{background:"#F5B800",
                  border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,
                  cursor:"pointer",fontFamily:"inherit",color:"#1C1C2E"}}>Tapos na! ✓</button>}
            </div>
          </div>
        </div>
        <div style={{height:52}}/>
        <HBar/>
      </div>
    );

    // ── Quiz viewer ──
    if(mat.type==="quiz"){
      const q=mat.items[qIdx];
      const handleQ=(opt)=>{
        if(qAns)return;
        setQSel(opt);setQAns(true);
        setTimeout(()=>{
          if(qIdx+1<mat.items.length){setQIdx(i=>i+1);setQSel(null);setQAns(false);}
          else{setViewing(null);setQIdx(0);setQSel(null);setQAns(false);}
        },1300);
      };
      const qBg=(opt)=>{if(!qAns)return"#E87878";if(opt===q.ans)return"#6ACC7A";if(opt===qSel)return"#888";return"#E87878";};
      const qBd=(opt)=>{if(!qAns)return"#B04848";if(opt===q.ans)return"#469856";if(opt===qSel)return"#666";return"#B04848";};
      return (
        <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
          background:OCEAN,display:"flex",flexDirection:"column"}}>
          <BgImg src="bg-lesson.png"/>
          <SBar/>
          <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
            <KLogo notif={notif} onClick={openMenu}/>
            <button onClick={()=>{setViewing(null);setQIdx(0);setQSel(null);setQAns(false);}} style={{
              background:"rgba(0,0,0,0.15)",border:"none",borderRadius:10,padding:"8px 14px",
              color:"#FFF",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
            <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.8)",fontSize:13,fontWeight:700}}>
              {qIdx+1} / {mat.items.length}
            </span>
          </div>
          {/* Reuse "LET'S TRY THIS!" header */}
          <div style={{padding:"14px 24px 14px 80px",background:"rgba(10,70,130,0.80)",
            position:"relative",zIndex:10,display:"flex",alignItems:"center"}}>
            <img src="starfish.png" alt="" style={{position:"absolute",left:10,top:-26,
              width:60,pointerEvents:"none",zIndex:15}}/>
            <span style={{color:"#FFF",fontWeight:900,fontSize:20,letterSpacing:1,textTransform:"uppercase"}}>
              Pagsasanay!
            </span>
          </div>
          <div style={{height:13,background:"rgba(0,0,0,0.15)",position:"relative",zIndex:10}}>
            <div style={{height:"100%",width:`${((qIdx+1)/mat.items.length)*100}%`,background:"#3A8ED4",transition:"width 0.3s"}}/>
          </div>
          <div style={{margin:"14px 18px 0",background:"linear-gradient(160deg,#D9B040,#B08020)",
            borderRadius:24,padding:"22px 20px",display:"flex",flexDirection:"column",alignItems:"center",
            position:"relative",zIndex:10,minHeight:250,boxShadow:"0 10px 32px rgba(0,0,0,0.22)"}}>
            <p style={{color:"rgba(255,255,255,0.92)",fontWeight:800,fontSize:16,
              textAlign:"center",marginBottom:12}}>{q.q}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",
              padding:"4px 0",flex:1,alignContent:"flex-start",width:"100%"}}>
              {Array.from({length:q.count}).map((_,i)=><span key={i} style={{fontSize:30,lineHeight:1.25}}>{q.emoji}</span>)}
            </div>
            <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:16}}>
              {q.opts.map(opt=>(
                <button key={opt} onClick={()=>handleQ(opt)} disabled={qAns} style={{
                  width:68,height:68,borderRadius:"50%",background:qBg(opt),
                  border:`5px solid ${qBd(opt)}`,color:"#FFF",fontSize:24,fontWeight:900,
                  cursor:qAns?"default":"pointer",fontFamily:"inherit",
                  boxShadow:"0 4px 14px rgba(0,0,0,0.22)",
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          {qAns&&<div style={{position:"absolute",bottom:218,left:18,right:18,zIndex:20,
            padding:"13px 20px",borderRadius:16,textAlign:"center",
            background:qSel===q.ans?"rgba(106,204,122,0.95)":"rgba(224,112,112,0.95)",
            color:"#FFF",fontWeight:800,fontSize:15}}>
            {qSel===q.ans?"Tama! 🎉":"Hindi tama. Ang sagot ay "+q.ans+" 💪"}
          </div>}
          <KikoBottom msg={"KAYA MO\nITO!"}/>
          <HBar/>
        </div>
      );
    }
  }

  // ── Materials list ──
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-subjects.png"/>
      <SBar/>
      <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu}/>
        <button onClick={()=>go("mathPath")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
      </div>
      <h2 style={{color:"#FFF",fontWeight:900,fontSize:20,padding:"0 20px 16px",
        position:"relative",zIndex:2,textShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
        Mga Naka-download
      </h2>
      <div style={{flex:1,padding:"0 18px",display:"flex",flexDirection:"column",gap:14,
        position:"relative",zIndex:2,overflow:"auto"}}>
        {synced ? SUPP.map(m=>(
          <button key={m.id} onClick={()=>setViewing(m.id)} style={{background:"rgba(255,255,255,0.95)",
            border:"none",borderRadius:20,padding:"18px 20px",
            display:"flex",alignItems:"center",gap:16,cursor:"pointer",
            fontFamily:"inherit",textAlign:"left",boxShadow:"0 6px 20px rgba(0,0,0,0.12)"}}>
            <div style={{width:54,height:54,background:"#E0F4F6",borderRadius:16,flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{m.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:16,color:"#1C1C2E",marginBottom:4}}>{m.title}</div>
              <div style={{fontSize:13,color:"#5A5A72",fontWeight:600}}>{m.subtitle}</div>
            </div>
            <span style={{background:"#007A87",color:"#FFF",borderRadius:20,
              padding:"4px 12px",fontSize:10,fontWeight:800,letterSpacing:0.8,flexShrink:0}}>{m.tag}</span>
          </button>
        )) : (
          <div style={{background:"rgba(255,255,255,0.92)",borderRadius:20,padding:"32px 24px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>📡</div>
            <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:18,marginBottom:8}}>Walang na-sync pa</h3>
            <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.6}}>
              I-open ang menu at i-sync ang iyong materyales kapag may WiFi.
            </p>
          </div>
        )}
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   OVERLAY: MENU (bottom sheet)
================================================================ */
const MenuOverlay = ({onClose, go, notif, synced, onSync}) => {
  const [localSynced,setLocalSynced]=useState(synced);
  const [syncing,setSyncing]=useState(false);
  const doSync=()=>{
    setSyncing(true);
    setTimeout(()=>{setSyncing(false);setLocalSynced(true);onSync();},2200);
  };
  return (
    <div style={{position:"absolute",inset:0,zIndex:999,background:"rgba(0,0,0,0.52)",
      display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FFF",borderRadius:"28px 28px 0 0",
        padding:"8px 0 36px",width:"100%",boxShadow:"0 -20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{width:48,height:5,borderRadius:3,background:"#DDD",margin:"8px auto 20px"}}/>
        {/* User row */}
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"0 24px 18px",
          borderBottom:"1px solid #F0F0F0",marginBottom:8}}>
          <div style={{width:50,height:50,borderRadius:"50%",
            background:"linear-gradient(135deg,#6DE4F0,#007A87)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🦈</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:"#1C1C2E"}}>Mag-aaral</div>
            <div style={{fontSize:13,color:"#5A5A72",fontWeight:600}}>Math · Lesson 1.2</div>
          </div>
        </div>
        {/* Items */}
        {[
          {icon:"📥", label:"Mga Naka-download", action:()=>{onClose();go("materials");}},
          {icon:"⚙️", label:"Mga Setting", action:null},
          {icon:"👤", label:"Profile", action:null},
        ].map((item,i)=>(
          <button key={i} onClick={item.action||onClose} style={{width:"100%",background:"none",border:"none",
            padding:"14px 24px",display:"flex",alignItems:"center",gap:16,
            cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <span style={{fontSize:22,width:28}}>{item.icon}</span>
            <span style={{fontWeight:700,fontSize:16,color:"#1C1C2E"}}>{item.label}</span>
            {!item.action&&<span style={{marginLeft:"auto",fontSize:12,color:"#AAA",fontWeight:600}}>Demo</span>}
          </button>
        ))}
        {/* Sync card */}
        <div style={{margin:"8px 18px 0",padding:"16px",
          background:localSynced?"#E8FFF0":"#F0F8FF",borderRadius:16,
          border:`1px solid ${localSynced?"#90D4A8":"#A8D4E8"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:localSynced?0:12}}>
            <span style={{fontSize:22}}>{localSynced?"✅":"📡"}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E"}}>
                {localSynced?"Naka-sync na!":"May bagong materyales"}
              </div>
              <div style={{fontSize:12,color:"#5A5A72",fontWeight:600,marginTop:2}}>
                {localSynced?"2 materyales available offline":"Kumonekta sa WiFi para i-download"}
              </div>
            </div>
            {notif>0&&!localSynced&&<div style={{background:"#FF3B30",color:"#FFF",
              borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:900}}>{notif} bago</div>}
          </div>
          {!localSynced&&(
            <button onClick={doSync} disabled={syncing} style={{width:"100%",
              background:syncing?"#5A5A72":"#007A87",color:"#FFF",border:"none",
              borderRadius:12,padding:"12px",fontWeight:800,fontSize:14,
              cursor:syncing?"default":"pointer",fontFamily:"inherit"}}>
              {syncing?"Nag-do-download... 📡":"I-download Ngayon"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN APP
================================================================ */
export default function KikoApp() {
  const [screen,setScreen]=useState("splash");
  const [menuOpen,setMenuOpen]=useState(false);
  const [modalOpen,setModalOpen]=useState(false);
  const [completed,setCompleted]=useState(["1.1"]);
  const [currentKey,setCurrentKey]=useState(null);
  const [synced,setSynced]=useState(false);
  const [notif,setNotif]=useState(1);

  const go=(s)=>setScreen(s);
  const notImpl=()=>setModalOpen(true);
  const openMenu=()=>setMenuOpen(true);
  const startLesson=(key)=>{setCurrentKey(key);go("lessonTeach");};
  const completeLesson=(key)=>setCompleted(p=>p.includes(key)?p:[...p,key]);
  const handleSync=()=>{setSynced(true);setNotif(0);};
  const lesson=currentKey?LESSONS[currentKey]:null;

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"#0D1B2A",padding:20,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:'Nunito',system-ui,sans-serif;}
        button:not(:disabled):active{transform:scale(0.96);transition:transform 0.08s;}
      `}</style>
      <div style={{width:390,height:820,borderRadius:46,overflow:"hidden",
        boxShadow:"0 40px 100px rgba(0,0,0,0.65),0 0 0 2px #555,0 0 0 9px #1E1E1E,0 0 0 11px #333",
        position:"relative",flexShrink:0}}>
        {screen==="splash"         && <Splash go={go} openMenu={openMenu} notif={notif}/>}
        {screen==="subjects"       && <Subjects go={go} notImpl={notImpl} openMenu={openMenu} notif={notif}/>}
        {screen==="mathPath"       && <MathPath go={go} notImpl={notImpl} openMenu={openMenu} notif={notif} completed={completed} startLesson={startLesson}/>}
        {screen==="lessonTeach"    && lesson && <LessonTeach lesson={lesson} go={go} openMenu={openMenu} notif={notif}/>}
        {screen==="lessonCheck"    && lesson && <LessonCheck lesson={lesson} go={go} openMenu={openMenu} notif={notif} onComplete={()=>completeLesson(currentKey)}/>}
        {screen==="lessonComplete" && <LessonComplete lessonKey={currentKey} go={go}/>}
        {screen==="materials"      && <Materials go={go} openMenu={openMenu} notif={notif} synced={synced}/>}
        {menuOpen  && <MenuOverlay onClose={()=>setMenuOpen(false)} go={go} notif={notif} synced={synced} onSync={handleSync}/>}
        {modalOpen && <NiModal onClose={()=>setModalOpen(false)}/>}
      </div>
    </div>
  );
}
