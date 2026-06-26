import { useState, useRef, useEffect } from "react";
import { MATH } from "./content/loader.js";

/* ================================================================
   ASSET FILE LIST  (/public folder)
   kiko-k.png  kiko-logo.png  kiko-whale.png
   bg-home.png  bg-subjects.png  bg-path.png  bg-lesson.png
   starfish.png  jellyfish.png
   Admin PIN: 1234

   LESSON CONTENT
   Add new lessons by dropping a JSON file into:
     src/content/lessons/
   Use _TEMPLATE.json as your starting point.
   Restart the dev server after adding a file.
================================================================ */

const OCEAN  = "linear-gradient(168deg,#6DE4F0 0%,#3BBBD4 38%,#1894BC 68%,#0B72A0 100%)";

// ── All lesson data now comes from src/content/lessons/*.json ───
const LESSONS    = MATH.lessons;   // { [id]: lessonObject }
const LESSON_SEQ = MATH.seq;       // ordered array of IDs
const PATH_NODES = MATH.nodes;     // auto-generated zigzag positions
const PATH_SVG_H = MATH.svgH || 530; // total canvas height for the path
const MASTERY_1  = MATH.mastery || { title:"Mastery Test", checks:[], passThreshold:4 };

const MOCK_STUDENT = {
  name:"Juan dela Cruz", grade:"Grade 1", age:6,
  school:"Paaralang Elementarya ng Bagong Pag-asa",
  avatar:"🦈", joinDate:"Enero 2025", streak:3,
};

const STATIC_SUPP = [
  { id:"s1", title:"Karagdagang Pagsasanay", subtitle:"Bilang 1-10",
    tag:"MATH", icon:"📝", type:"quiz",
    items:[
      {emoji:"⭐",count:6,q:"Ilan ang mga bituin?",  opts:[4,5,6,7], ans:6},
      {emoji:"🐠",count:4,q:"Ilan ang mga isda?",    opts:[2,3,4,5], ans:4},
      {emoji:"🦀",count:8,q:"Ilan ang mga alimango?",opts:[6,7,8,9], ans:8},
    ]},
  { id:"s2", title:"Kwento ni Kiko", subtitle:"Ang mga Kaibigan sa Dagat",
    tag:"KWENTO", icon:"📖", type:"story",
    pages:[
      "Si Kiko ay isang palakaibigang butanding. Mayroon siyang sampung kaibigan sa dagat.",
      "Una, lumangoy si Kiko at nakita niya ang tatlong isda. 1... 2... 3! Tatlo sila!",
      "Pagkatapos, nakita niya ang limang pagong. 1... 2... 3... 4... 5! Lima sila!",
      "Kasama ang lahat, si Kiko ngayon ay may sampung kaibigan. Salamat sa pagbilang kasama namin!",
    ]},
];

/* ── Gemini AI ─────────────────────────────────────────────────── */
const generateWithGemini = async (apiKey, weakAreas) => {
  const focus = weakAreas.length ? `Focus on: ${weakAreas.join(", ")}.` : "Mixed counting 1-10.";
  const prompt = `You are a Filipino Grade 1 math teacher. Create 3 counting exercises about sea creatures. ${focus}
Return ONLY a valid JSON array, no markdown:
[{"emoji":"🐟","count":6,"q":"Ilan ang mga isda?","opts":[4,5,6,7],"ans":6}]
Rules: counts 1-10, opts = 4 ascending numbers including ans, q in Filipino, use: 🐟 🦀 🐢 🐙 ⭐ 🐠 🦞, each different emoji.`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.8,maxOutputTokens:400}}) }
  );
  if(!res.ok) {
    const body = await res.text().catch(()=>"");
    if(res.status===400) throw new Error("API key invalid o maling format. Siguraduhing tama ang key.");
    if(res.status===403) throw new Error("API key wala permission. I-check ang Google AI Studio.");
    if(res.status===429) throw new Error("Rate limit na. Maghintay ng 1 minuto tapos subukan ulit.");
    throw new Error(`Gemini error ${res.status}. ${body.slice(0,80)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text||"";
  const m = text.match(/\[[\s\S]*?\]/);
  if(!m) throw new Error("No JSON in response");
  return JSON.parse(m[0]);
};

/* ── Utility ───────────────────────────────────────────────────── */
const getWeakAreas = (key, score, total) => {
  if(score===total) return [];
  const map = {"1.1":["Bilang 1-3","Bilang 4-5"],"1.2":["Bilang 6-8","Bilang 9-10"],"1.3":["Mixed counting"]};
  const areas = map[key]||[];
  return score<2 ? areas : areas.slice(-1);
};

const computeAiPreview = (lessonScores) => {
  const entries = Object.entries(lessonScores);
  if(!entries.length) return null;
  const weak = entries.flatMap(([k,d])=>d.weakAreas||[]).filter(Boolean);
  const avgPct = entries.reduce((s,[,d])=>s+d.score/d.total,0)/entries.length;
  return {
    weak, avgPct,
    exercises: weak.length
      ? [{label:`3 exercises focused sa ${weak.slice(0,2).join(" at ")}`,icon:"📝"}]
      : [{label:"3 advanced exercises para sa susunod na level",icon:"🚀"}],
    story: {label: weak.length
      ? `1 kwento na may mga grupo ng ${weak.includes("Bilang 9-10")?"9-10":"6-8"} na bagay`
      : "1 kwento para sa advanced learner",icon:"📖"},
    difficulty: avgPct>=0.9?"Advanced":avgPct>=0.7?"On-Level":"Remedial",
    tokens_est: 380,
  };
};

/* ================================================================
   SHARED UI
================================================================ */
const BgImg = ({src}) => (
  <img src={src} alt="" draggable="false"
    style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,pointerEvents:"none"}}
    onError={e=>e.target.style.display="none"}/>
);

const SBar = ({isOnline=true}) => (
  <div style={{position:"absolute",top:0,left:0,right:0,height:28,zIndex:100,padding:"0 18px",
    display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.10)"}}>
    <span style={{color:"#FFF",fontSize:12,fontWeight:700}}>9:41</span>
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      {isOnline
        ? <svg width="16" height="12" viewBox="0 0 24 18" fill="white">
            <path d="M12 4C8.5 4 5.3 5.4 3 7.7L0 4.7C3.1 1.7 7.3 0 12 0s8.9 1.7 12 4.7l-3 3C18.7 5.4 15.5 4 12 4z"/>
            <path d="M12 10c-2 0-3.8.8-5.1 2.1L4 9.2C5.9 7.2 8.8 6 12 6s6.1 1.2 8 3.2l-2.9 2.9C15.8 10.8 14 10 12 10z"/>
            <circle cx="12" cy="18" r="3"/>
          </svg>
        : <span style={{color:"#FF6B6B",fontSize:13,fontWeight:900}}>✕ WiFi</span>}
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
        <rect x="0" y="1" width="20" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
        <rect x="1.5" y="2.5" width="14" height="7" rx="1" fill={isOnline?"white":"rgba(255,255,255,0.4)"}/>
        <rect x="21" y="3.5" width="2.5" height="5" rx="1" fill="white" opacity=".5"/>
      </svg>
    </div>
  </div>
);

const HBar = () => (
  <div style={{position:"absolute",bottom:0,left:0,right:0,height:24,zIndex:100,
    display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.10)"}}>
    <div style={{width:90,height:4,borderRadius:2,background:"rgba(255,255,255,.55)"}}/>
  </div>
);

const KLogo = ({notif=0,onClick,isOnline}) => (
  <button onClick={onClick} style={{position:"relative",width:44,height:44,
    background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
    <img src="kiko-k.png" alt="K" style={{width:"100%",height:"100%",objectFit:"contain"}}
      onError={e=>{e.target.style.display="none";
        const p=e.target.parentNode;
        p.style.cssText+="background:rgba(0,0,0,0.25);border-radius:12px;display:flex;align-items:center;justify-content:center;";
        if(!p.querySelector("span")){const s=document.createElement("span");s.textContent="K";s.style.cssText="color:#FFF;font-weight:900;font-size:20px;position:absolute;";p.appendChild(s);}}}/>
    {notif>0&&<div style={{position:"absolute",top:-3,right:-3,width:18,height:18,borderRadius:"50%",
      background:"#FF3B30",color:"#FFF",fontSize:10,fontWeight:900,
      display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #FFF"}}>{notif}</div>}
    {!isOnline&&<div style={{position:"absolute",bottom:-2,right:-2,width:14,height:14,
      borderRadius:"50%",background:"#FF6B6B",border:"2px solid #FFF",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>✕</div>}
  </button>
);

const NiModal = ({onClose}) => (
  <div style={{position:"absolute",inset:0,zIndex:999,background:"rgba(0,0,0,0.55)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
    <div style={{background:"#FFF",borderRadius:24,padding:"30px 24px",width:"100%",maxWidth:330,
      textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,0.28)"}}>
      <div style={{fontSize:52,marginBottom:12}}>🚧</div>
      <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:20,marginBottom:10}}>Hindi pa available</h3>
      <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:24}}>
        Sa demo na ito, hindi pa available ang feature na ito.
      </p>
      <button onClick={onClose} style={{background:"#007A87",color:"#FFF",border:"none",borderRadius:14,
        padding:"14px 0",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
        OK, naiintindihan!
      </button>
    </div>
  </div>
);

// Separate modal for lessons the student hasn't unlocked yet
const LockedModal = ({onClose}) => (
  <div style={{position:"absolute",inset:0,zIndex:999,background:"rgba(0,0,0,0.55)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
    <div style={{background:"#FFF",borderRadius:24,padding:"30px 24px",width:"100%",maxWidth:330,
      textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,0.28)"}}>
      <div style={{fontSize:52,marginBottom:12}}>🔒</div>
      <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:20,marginBottom:10}}>Naka-lock pa ito</h3>
      <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:24}}>
        Kumpletuhin muna ang nakaraang aralin para ma-unlock ang lesson na ito. Kaya mo yan!
      </p>
      <button onClick={onClose} style={{background:"#F5B800",color:"#1C1C2E",border:"none",borderRadius:14,
        padding:"14px 0",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
        Bumalik sa Mapa
      </button>
    </div>
  </div>
);

const SlideVisual = ({visual}) => {
  if(visual.type==="sequence") return (
    <div style={{background:"#F0F9FF",borderRadius:14,padding:"10px 14px",maxHeight:240,overflowY:"auto"}}>
      {visual.entries.map((e,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",
          borderBottom:i<visual.entries.length-1?"1px solid #DCF0F8":"none"}}>
          <span style={{fontWeight:900,fontSize:18,color:"#007A87",minWidth:26,textAlign:"center"}}>{e.n}</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:1,flex:1}}>
            {Array.from({length:Math.min(e.n,10)}).map((_,j)=><span key={j} style={{fontSize:14}}>{visual.emoji}</span>)}
          </div>
          <span style={{fontWeight:700,fontSize:13,color:"#5A5A72",minWidth:48,textAlign:"right"}}>{e.word}</span>
        </div>
      ))}
    </div>
  );
  if(visual.type==="count-demo") return (
    <div style={{textAlign:"center"}}>
      <div style={{background:"#F0F9FF",borderRadius:14,padding:"14px",
        display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:12}}>
        {Array.from({length:visual.count}).map((_,i)=><span key={i} style={{fontSize:26}}>{visual.emoji}</span>)}
      </div>
      <div style={{background:"#007A87",color:"#FFF",borderRadius:20,padding:"8px 24px",
        display:"inline-block",fontWeight:800,fontSize:15}}>{visual.label}</div>
    </div>
  );
  return null;
};

const KikoBottom = ({msg="YOU CAN\nDO THIS!"}) => (
  <div style={{position:"absolute",bottom:-28,left:0,right:0,height:285,
    display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:15,pointerEvents:"none"}}>
    <div style={{position:"absolute",top:18,right:46,background:"#FFF",borderRadius:14,
      padding:"10px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",zIndex:2}}>
      <div style={{fontWeight:900,fontSize:13,color:"#1C1C2E",textAlign:"center",lineHeight:1.35}}>
        {msg.split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
      </div>
      <div style={{position:"absolute",bottom:-11,left:18,width:0,height:0,
        borderLeft:"11px solid transparent",borderRight:"6px solid transparent",borderTop:"11px solid #FFF"}}/>
    </div>
    <img src="kiko-whale.png" alt="Kiko" style={{width:275,height:"auto",position:"relative",zIndex:1}}
      onError={e=>e.target.style.display="none"}/>
  </div>
);

/* ================================================================
   QUIZ RUNNER
================================================================ */
const QuizRunner = ({questions,passThreshold,headerText,headerColor,onPass,onFail}) => {
  const [qIdx,    setQIdx]   = useState(0);
  const [selected,setSel]    = useState(null);
  const [answered,setAns]    = useState(false);
  const [done,    setDone]   = useState(false);
  const [finalScore,setFS]   = useState(0);
  const scoreRef = useRef(0);

  const q = questions[qIdx];

  const handleAnswer = (opt) => {
    if(answered||done) return;
    if(opt===q.ans) scoreRef.current+=1;
    setSel(opt); setAns(true);
    setTimeout(()=>{
      if(qIdx+1<questions.length){setQIdx(i=>i+1);setSel(null);setAns(false);}
      else{setFS(scoreRef.current);setDone(true);}
    },1200);
  };

  const reset = () => {
    scoreRef.current=0; setQIdx(0); setSel(null); setAns(false); setDone(false); setFS(0);
  };

  const cBg=(o)=>{ if(!answered)return"#E87878"; if(o===q.ans)return"#6ACC7A"; if(o===selected)return"#888"; return"#E87878"; };
  const cBd=(o)=>{ if(!answered)return"#B04848"; if(o===q.ans)return"#469856"; if(o===selected)return"#666"; return"#B04848"; };

  if(done){
    const passed=finalScore>=passThreshold;
    return (
      <div style={{position:"absolute",inset:0,zIndex:80,
        background:passed?"linear-gradient(168deg,#6DE4F0,#0B72A0)":"linear-gradient(168deg,#E07070,#8B2020)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px"}}>
        <div style={{fontSize:72,marginBottom:16}}>{passed?"🌟":"💪"}</div>
        <h2 style={{color:"#FFF",fontWeight:900,fontSize:26,textAlign:"center",marginBottom:10,textShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
          {passed?"Pumasa ka!":"Subukan ulit!"}
        </h2>
        <p style={{color:"rgba(255,255,255,0.88)",fontSize:17,fontWeight:700,marginBottom:30,textAlign:"center"}}>
          {finalScore} sa {questions.length} ang tama{!passed&&` (kailangan: ${passThreshold})`}
        </p>
        {passed
          ? <button onClick={()=>onPass(finalScore,questions.length)} style={{background:"#F5B800",color:"#1C1C2E",
              border:"none",borderRadius:20,padding:"18px 56px",fontWeight:900,fontSize:18,
              cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
              Magpatuloy 🎉
            </button>
          : <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:310}}>
              <button onClick={reset} style={{background:"#F5B800",color:"#1C1C2E",border:"none",
                borderRadius:16,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                Subukan Ulit
              </button>
              <button onClick={onFail} style={{background:"rgba(255,255,255,0.18)",color:"#FFF",
                border:"2px solid rgba(255,255,255,0.4)",borderRadius:16,padding:"14px",
                fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                Aralin Ulit
              </button>
            </div>}
      </div>
    );
  }

  return (
    <>
      <div style={{marginTop:60,padding:"14px 24px 14px 80px",
        background:headerColor||"rgba(10,70,130,0.80)",
        position:"relative",zIndex:10,display:"flex",alignItems:"center"}}>
        <img src="starfish.png" alt="" style={{position:"absolute",left:10,top:-26,width:60,pointerEvents:"none",zIndex:15}}
          onError={e=>e.target.style.display="none"}/>
        <span style={{color:"#FFF",fontWeight:900,fontSize:20,letterSpacing:1,textTransform:"uppercase"}}>
          {headerText||"Let's Try This!"}
        </span>
      </div>
      <div style={{height:13,background:"rgba(0,0,0,0.15)",position:"relative",zIndex:10}}>
        <div style={{height:"100%",background:"#3A8ED4",transition:"width 0.4s",
          width:`${(qIdx/questions.length)*100}%`}}/>
      </div>
      <div style={{padding:"8px 20px 6px",textAlign:"right",position:"relative",zIndex:5}}>
        <div style={{display:"flex",gap:5,justifyContent:"flex-end"}}>
          {questions.map((_,i)=>(
            <div key={i} style={{width:28,height:6,borderRadius:3,
              background:i<qIdx?"#6ACC7A":i===qIdx?"#F5B800":"rgba(255,255,255,0.3)",transition:"background 0.3s"}}/>
          ))}
        </div>
        <span style={{color:"rgba(255,255,255,0.72)",fontSize:11,fontWeight:700}}>
          Tanong {qIdx+1} sa {questions.length}
        </span>
      </div>
      <div style={{margin:"6px 18px 0",background:"linear-gradient(160deg,#D9B040,#B08020)",
        borderRadius:24,padding:"20px 20px",display:"flex",flexDirection:"column",alignItems:"center",
        position:"relative",zIndex:10,minHeight:248,boxShadow:"0 10px 32px rgba(0,0,0,0.22)"}}>
        <p style={{color:"rgba(255,255,255,0.92)",fontWeight:800,fontSize:16,textAlign:"center",marginBottom:12}}>{q.q}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center",
          padding:"4px 0",flex:1,alignContent:"flex-start",width:"100%",maxHeight:130,overflow:"hidden"}}>
          {Array.from({length:q.count}).map((_,i)=><span key={i} style={{fontSize:30,lineHeight:1.25}}>{q.emoji}</span>)}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}>
          {q.opts.map(opt=>(
            <button key={opt} onClick={()=>handleAnswer(opt)} disabled={answered} style={{
              width:66,height:66,borderRadius:"50%",background:cBg(opt),border:`5px solid ${cBd(opt)}`,
              color:"#FFF",fontSize:24,fontWeight:900,cursor:answered?"default":"pointer",fontFamily:"inherit",
              boxShadow:"0 4px 14px rgba(0,0,0,0.22)",
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      {answered&&(
        <div style={{margin:"10px 18px 0",padding:"12px 20px",borderRadius:16,textAlign:"center",
          background:selected===q.ans?"rgba(106,204,122,0.95)":"rgba(224,112,112,0.95)",
          color:"#FFF",fontWeight:800,fontSize:15,position:"relative",zIndex:5}}>
          {selected===q.ans?"Tama! Napakagaling mo! 🎉":"Hindi tama. Subukan ulit! 💪"}
        </div>
      )}
    </>
  );
};

/* ================================================================
   SCREEN: SPLASH
================================================================ */
const Splash = ({go,openMenu,notif,isOnline}) => (
  <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
    background:OCEAN,display:"flex",flexDirection:"column",alignItems:"center"}}>
    <BgImg src="bg-home.png"/>
    <SBar isOnline={isOnline}/>

    {/* K logo — top left */}
    <div style={{position:"absolute",top:34,left:16,zIndex:30}}>
      <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
    </div>

    {/* Jellyfish — top right */}
    <img src="jellyfish.png" alt=""
      style={{position:"absolute",top:40,right:14,width:90,pointerEvents:"none",zIndex:3}}
      onError={e=>e.target.style.display="none"}/>

    {/* KIKO logo — tagline is baked into the image, no separate text */}
    <img src="kiko-logo.png" alt="KIKO"
      style={{width:440,height:"auto",marginTop:110,position:"relative",zIndex:4}}
      onError={e=>e.target.style.display="none"}/>

    {/* GET STARTED button */}
    <button onClick={()=>go("subjects")} style={{
      marginTop:-40,
      background:"#F5B800",color:"#1C1C2E",
      border:"none",borderRadius:32,
      padding:"16px 52px",
      fontWeight:900,fontSize:18,
      cursor:"pointer",fontFamily:"inherit",
      letterSpacing:1.4,textTransform:"uppercase",
      boxShadow:"0 8px 28px rgba(0,0,0,0.28)",
      position:"relative",zIndex:4,
    }}>Get Started</button>

    {/* Kiko — very large, centered, bottom cut off */}
    <img src="kiko-whale.png" alt="Kiko"
      style={{
        position:"absolute",
        bottom:-60,
        left:"65%",
        transform:"translateX(-46%)",
        width:520,
        pointerEvents:"none",
        zIndex:2,
      }}
      onError={e=>e.target.style.display="none"}/>

    <HBar/>
  </div>
);

/* ================================================================
   SCREEN: SUBJECTS
================================================================ */
const Subjects = ({go,notImpl,openMenu,notif,isOnline}) => {
  const cards=[
    {k:"math",  label:"MATH",    icon:"3+2",is:{fontSize:28,fontWeight:900,color:"#FFF",fontStyle:"italic"},bg:"linear-gradient(135deg,#D4AB32,#A07A10)",action:()=>go("mathPath"), available:true},
    {k:"eng",   label:"ENGLiSH", icon:"ABC",is:{fontSize:24,fontWeight:900,color:"#FFF"},                  bg:"linear-gradient(135deg,#9870CC,#6040A0)",action:notImpl,             available:false},
    {k:"sci",   label:"SCiENCE", icon:"🌱", is:{fontSize:36},                                                bg:"linear-gradient(135deg,#60C060,#3A8A3A)",action:notImpl,             available:false},
  ];
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-subjects.png"/>
      <SBar isOnline={isOnline}/>
      <div style={{padding:"34px 20px 14px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
      </div>
      {!isOnline&&<div style={{margin:"0 18px 8px",background:"rgba(255,107,107,0.9)",borderRadius:12,
        padding:"10px 16px",display:"flex",alignItems:"center",gap:10,position:"relative",zIndex:2}}>
        <span style={{fontSize:18}}>✕</span>
        <div>
          <div style={{color:"#FFF",fontWeight:800,fontSize:13}}>Offline Mode</div>
          <div style={{color:"rgba(255,255,255,0.85)",fontSize:11}}>Mga naka-download na aralin lang ang available</div>
        </div>
      </div>}
      <div style={{flex:1,padding:"4px 20px 0",display:"flex",flexDirection:"column",gap:16,position:"relative",zIndex:2}}>
        {cards.map(c=>(
          <button key={c.k} onClick={c.action} style={{background:c.bg,border:"none",borderRadius:22,
            padding:"22px 20px",display:"flex",alignItems:"center",
            cursor:c.available?"pointer":"default",fontFamily:"inherit",
            boxShadow:"0 8px 26px rgba(0,0,0,0.18)",textAlign:"left",
            opacity:c.available?1:0.55, position:"relative",overflow:"hidden"}}>
            <div style={{width:68,height:68,background:"rgba(255,255,255,0.18)",borderRadius:18,
              flexShrink:0,marginRight:18,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={c.is}>{c.icon}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{color:"#FFF",fontWeight:900,fontSize:22,marginBottom:5}}>{c.label}</div>
              <div style={{color:"rgba(255,255,255,0.78)",fontSize:13,fontWeight:600}}>
                {c.available
                  ? `10 checkpoints left${!isOnline&&c.k==="math"?" · 📥 Naka-download":""}`
                  : "Paparating sa susunod na update"}
              </div>
            </div>
            {c.available
              ? <div style={{width:38,height:38,background:"rgba(0,0,0,0.14)",borderRadius:"50%",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"#FFF",fontSize:22,fontWeight:700}}>›</div>
              : <div style={{background:"rgba(0,0,0,0.25)",borderRadius:20,padding:"4px 12px",
                  color:"rgba(255,255,255,0.9)",fontSize:12,fontWeight:800,letterSpacing:0.5}}>
                  Coming Soon
                </div>}
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
const MathPath = ({go,notImpl,onLocked,openMenu,notif,completed,startLesson,isOnline}) => {
  const scrollRef = useRef(null);

  const getStatus=(key)=>{
    if(completed.includes(key))return"done";
    const next=LESSON_SEQ.find(k=>!completed.includes(k));
    return key===next?"current":"locked";
  };

  // Scroll to bottom on mount so the first lesson is visible
  useEffect(()=>{
    if(scrollRef.current){
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  },[]);

  let d=`M ${PATH_NODES[0]?.cx||200} ${PATH_NODES[0]?.cy||480}`;
  for(let i=1;i<PATH_NODES.length;i++){
    const p=PATH_NODES[i-1],c=PATH_NODES[i],mx=(p.cx+c.cx)/2;
    d+=` C ${mx} ${p.cy-8}, ${mx} ${c.cy+8}, ${c.cx} ${c.cy}`;
  }

  const nv=(s,t)=>{
    if(t==="milestone")return s==="done"?{bg:"#FFD700",bd:"#C8A000",icon:"🏆",sz:20}
      :s==="current"?{bg:"#FFB800",bd:"#C08000",icon:"🏆",sz:20}:{bg:"#B8C8D0",bd:"#8098A8",icon:"🏆",sz:16};
    return s==="done"?{bg:"#6ACC7A",bd:"#469856",icon:"✓",sz:22}
      :s==="current"?{bg:"#E07070",bd:"#B04848",icon:"●",sz:18}:{bg:"#8AB8C8",bd:"#5A8898",icon:"🔒",sz:16};
  };

  const handleTap=(node)=>{
    const s=getStatus(node.key);
    if(s==="locked"){onLocked();return;}
    if(s==="done")  {notImpl();return;}
    startLesson(node.key);
  };

  const currentKey=LESSON_SEQ.find(k=>!completed.includes(k));
  const isMastery=currentKey==="ms1";

  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-path.png"/>
      <SBar isOnline={isOnline}/>

      {/* Header */}
      <div style={{padding:"34px 20px 10px",display:"flex",alignItems:"center",gap:12,
        position:"relative",zIndex:2,flexShrink:0}}>
        <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
        <button onClick={()=>go("subjects")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Paksa</button>
      </div>

      {/* Scrollable path area */}
      <div ref={scrollRef} style={{
        flex:1,
        overflowY:"auto",
        position:"relative",
        /* hide scrollbar visually — touch scroll still works */
        scrollbarWidth:"none",
        msOverflowStyle:"none",
      }}>
        <style>{`.path-scroll::-webkit-scrollbar{display:none}`}</style>
        {/* Inner canvas sized to fit all nodes */}
        <div style={{position:"relative",width:"100%",height:PATH_SVG_H}}>
          <svg width={390} height={PATH_SVG_H} viewBox={`0 0 390 ${PATH_SVG_H}`}
            style={{position:"absolute",top:0,left:0}}>
            <path d={d} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={26}
              strokeLinecap="round" transform="translate(0,3)"/>
            <path d={d} fill="none" stroke="#9EDAEA" strokeWidth={24} strokeLinecap="round"/>
            <path d={d} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={8}
              strokeLinecap="round" strokeDasharray="1 18"/>
          </svg>

          {PATH_NODES.map(n=>{
            const st=getStatus(n.key),v=nv(st,n.type),isMs=n.type==="milestone",sz=isMs?62:54;
            return (
              <button key={n.id} onClick={()=>handleTap(n)} style={{
                position:"absolute",left:n.cx,top:n.cy,
                transform:"translate(-50%,-50%)",
                width:sz,height:sz,borderRadius:isMs?"16px":"50%",
                background:v.bg,border:`4px solid ${v.bd}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#FFF",fontSize:v.sz,fontWeight:900,
                cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 18px rgba(0,0,0,0.24)",zIndex:10,
              }}>{v.icon}</button>
            );
          })}
        </div>
      </div>

      {/* Current lesson card — pinned above home bar */}
      {currentKey&&(LESSONS[currentKey]||isMastery)&&(
        <div style={{margin:"0 16px 48px",flexShrink:0,
          background:isMastery?"linear-gradient(135deg,#FFB800,#C08000)":"linear-gradient(135deg,#D4AB32,#A07A10)",
          borderRadius:20,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,
          boxShadow:"0 12px 32px rgba(0,0,0,0.28)",position:"relative",zIndex:20}}>
          <div style={{width:46,height:46,background:"rgba(255,255,255,0.18)",borderRadius:14,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:isMastery?24:18}}>
            {isMastery?"🏆":<span style={{fontWeight:900,color:"#FFF",fontStyle:"italic"}}>3+2</span>}
          </div>
          <div style={{flex:1}}>
            <div style={{color:"rgba(255,255,255,0.72)",fontSize:10,fontWeight:800,letterSpacing:1}}>MATH</div>
            <div style={{color:"#FFF",fontWeight:900,fontSize:16,lineHeight:1.2,marginTop:1}}>
              {isMastery?"Mastery Test":`Lesson ${currentKey}`}
            </div>
            <div style={{color:"rgba(255,255,255,0.82)",fontSize:12,fontWeight:600,marginTop:2}}>
              {isMastery?"Pagbilang 1 hanggang 10":LESSONS[currentKey]?.title}
            </div>
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
   SCREEN: LESSON TEACH
================================================================ */
const LessonTeach = ({lesson,go,openMenu,notif,isOnline}) => {
  const [idx,setIdx]=useState(0);
  const slide=lesson.slides[idx];
  const isLast=idx===lesson.slides.length-1;
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-lesson.png"/>
      <SBar isOnline={isOnline}/>
      <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
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

const LessonCheck = ({lesson,go,openMenu,notif,onComplete,isOnline}) => (
  <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
    background:OCEAN,display:"flex",flexDirection:"column"}}>
    <BgImg src="bg-lesson.png"/>
    <SBar isOnline={isOnline}/>
    <div style={{position:"absolute",top:34,left:16,zIndex:30}}>
      <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
    </div>
    <QuizRunner questions={lesson.checks} passThreshold={lesson.passThreshold}
      onPass={(s,t)=>{onComplete(s,t);go("lessonComplete");}}
      onFail={()=>go("lessonTeach")}/>
    <KikoBottom/>
    <HBar/>
  </div>
);

const LessonComplete = ({lessonKey, go, score=3, total=3}) => {
  const lesson = LESSONS[lessonKey] || {};
  const pct    = total > 0 ? score / total : 1;
  const stars  = pct === 1 ? 3 : pct >= 0.7 ? 2 : 1;
  const msgs   = [
    "Subukan mo ulit sa ibang pagkakataon para makakuha ng mas maraming bituin!",
    "Magaling! Patuloy ka lang!",
    "Perpekto! Napakagaling mo!",
  ];
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
      <BgImg src="bg-lesson.png"/>
      <SBar/>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:28,padding:"32px 24px",
        width:"100%",textAlign:"center",boxShadow:"0 20px 52px rgba(0,0,0,0.20)",position:"relative",zIndex:2}}>
        <div style={{fontSize:64,marginBottom:16}}>{stars===3?"🌟":"⭐"}</div>
        <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:24,marginBottom:8}}>Aralin Tapos Na!</h2>
        <p style={{color:"#5A5A72",fontSize:15,lineHeight:1.65,marginBottom:6}}>Natapos mo ang</p>
        <p style={{color:"#007A87",fontWeight:900,fontSize:18,marginBottom:16}}>
          Lesson {lessonKey}: {lesson.title}
        </p>
        {/* Stars — earned ones full, unearned greyed out */}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
          {[1,2,3].map(i=>(
            <span key={i} style={{fontSize:44, opacity: i<=stars ? 1 : 0.2}}>⭐</span>
          ))}
        </div>
        <p style={{color:"#5A5A72",fontSize:13,marginBottom:8,fontWeight:700}}>
          {score}/{total} ang tama
        </p>
        <p style={{color:"#5A5A72",fontSize:13,lineHeight:1.65,marginBottom:24}}>
          {msgs[stars-1]}
        </p>
        <button onClick={()=>go("mathPath")} style={{width:"100%",background:"#F5B800",color:"#1C1C2E",
          border:"none",borderRadius:16,padding:"17px",fontWeight:900,fontSize:17,
          cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:0.5,
          boxShadow:"0 8px 24px rgba(0,0,0,0.18)"}}>Magpatuloy</button>
      </div>
      <HBar/>
    </div>
  );
};

const MasteryTest = ({go,openMenu,notif,onComplete,isOnline}) => (
  <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
    background:OCEAN,display:"flex",flexDirection:"column"}}>
    <BgImg src="bg-lesson.png"/>
    <SBar isOnline={isOnline}/>
    <div style={{position:"absolute",top:34,left:16,zIndex:30}}>
      <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
    </div>
    <QuizRunner questions={MASTERY_1.checks} passThreshold={MASTERY_1.passThreshold}
      headerText="MASTERY TEST 🏆" headerColor="rgba(120,60,0,0.85)"
      onPass={(s,t)=>{onComplete(s,t);go("masteryComplete");}}
      onFail={()=>go("mathPath")}/>
    <KikoBottom msg={"KAYA MO\nITO!"}/>
    <HBar/>
  </div>
);

const MasteryComplete = ({go, score=5, total=5}) => {
  const pct   = total > 0 ? score / total : 1;
  const stars = pct === 1 ? 5 : pct >= 0.8 ? 4 : pct >= 0.6 ? 3 : 2;
  return (
  <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
    background:OCEAN,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
    <BgImg src="bg-lesson.png"/>
    <SBar/>
    <div style={{background:"rgba(255,255,255,0.97)",borderRadius:28,padding:"32px 24px",
      width:"100%",textAlign:"center",boxShadow:"0 20px 52px rgba(0,0,0,0.20)",position:"relative",zIndex:2}}>
      <div style={{fontSize:72,marginBottom:16}}>🏆</div>
      <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:26,marginBottom:12}}>Mastery Test Tapos Na!</h2>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8}}>
        {[1,2,3,4,5].map(i=>(
          <span key={i} style={{fontSize:32, opacity: i<=stars ? 1 : 0.2}}>⭐</span>
        ))}
      </div>
      <p style={{color:"#5A5A72",fontSize:13,marginBottom:16,fontWeight:700}}>
        {score}/{total} ang tama
      </p>
      <p style={{color:"#5A5A72",fontSize:15,lineHeight:1.7,marginBottom:24}}>
        {pct===1
          ? "Perpekto! Napatunayan mo na alam mo ang lahat!"
          : "Napakagaling! Na-unlock mo ang susunod na paksa."}
      </p>
      <button onClick={()=>go("mathPath")} style={{width:"100%",background:"#F5B800",color:"#1C1C2E",
        border:"none",borderRadius:16,padding:"17px",fontWeight:900,fontSize:17,
        cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:0.5,
        boxShadow:"0 8px 24px rgba(0,0,0,0.18)"}}>Magpatuloy</button>
    </div>
    <HBar/>
  </div>
  );
};

/* ================================================================
   SCREEN: PROFILE
================================================================ */
const ProfileScreen = ({go,openMenu,notif,lessonScores,completed,isOnline}) => {
  const lessonsDone = completed.filter(k=>LESSONS[k]);
  // 3 stars = perfect, 2 stars = passed with one wrong, 1 star = scraped through
  const starsEarned = Object.entries(lessonScores).reduce((total,[,sc])=>{
    const pct = sc.score / sc.total;
    if(pct === 1)  return total + 3;
    if(pct >= 0.8) return total + 2;
    return total + 1;
  }, 0);
  const maxStars = lessonsDone.length * 3;
  const progressPct = Math.round((lessonsDone.length / 3) * 100);
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-subjects.png"/>
      <SBar isOnline={isOnline}/>
      <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
        <button onClick={()=>go("subjects")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
      </div>
      <div style={{flex:1,padding:"0 18px 52px",display:"flex",flexDirection:"column",gap:14,
        position:"relative",zIndex:2,overflowY:"auto"}}>
        {/* Profile card */}
        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:24,padding:"24px 20px",
          boxShadow:"0 8px 24px rgba(0,0,0,0.14)",textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",
            background:"linear-gradient(135deg,#6DE4F0,#007A87)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:42,margin:"0 auto 12px"}}>
            {MOCK_STUDENT.avatar}
          </div>
          <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:22,marginBottom:4}}>{MOCK_STUDENT.name}</h2>
          <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
            <span style={{background:"#E0F4F6",color:"#007A87",borderRadius:20,
              padding:"4px 12px",fontSize:12,fontWeight:700}}>{MOCK_STUDENT.grade}</span>
            <span style={{background:"#F0F0F0",color:"#5A5A72",borderRadius:20,
              padding:"4px 12px",fontSize:12,fontWeight:700}}>{MOCK_STUDENT.age} taong gulang</span>
          </div>
          <div style={{fontSize:12,color:"#5A5A72",fontWeight:600,marginBottom:4}}>{MOCK_STUDENT.school}</div>
          <div style={{fontSize:12,color:"#5A5A72",fontWeight:600}}>Sumali: {MOCK_STUDENT.joinDate}</div>
        </div>
        {/* Stats row */}
        <div style={{display:"flex",gap:10}}>
          {[
            {icon:"🔥",val:MOCK_STUDENT.streak,label:"Araw na streak"},
            {icon:"⭐",val:maxStars>0?`${starsEarned}/${maxStars}`:"0",label:"Mga bituin"},
            {icon:"📚",val:`${lessonsDone.length}/3`,label:"Aralin"},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.95)",borderRadius:18,
              padding:"14px 8px",textAlign:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.10)"}}>
              <div style={{fontSize:26,marginBottom:4}}>{s.icon}</div>
              <div style={{fontWeight:900,fontSize:20,color:"#1C1C2E"}}>{s.val}</div>
              <div style={{fontSize:10,color:"#5A5A72",fontWeight:600,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Progress */}
        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"18px 20px",
          boxShadow:"0 4px 12px rgba(0,0,0,0.10)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontWeight:800,fontSize:14,color:"#1C1C2E"}}>Progress sa Math Stage 1</span>
            <span style={{fontWeight:900,fontSize:14,color:"#007A87"}}>{progressPct}%</span>
          </div>
          <div style={{background:"#EEE",borderRadius:8,height:10,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(90deg,#6DE4F0,#007A87)",height:"100%",
              borderRadius:8,width:`${progressPct}%`,transition:"width 0.5s"}}/>
          </div>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            {["1.1","1.2","1.3"].map(k=>{
              const done=completed.includes(k);
              const sc=lessonScores[k];
              return (
                <div key={k} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:16}}>{done?"✅":"⭕"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1C1C2E"}}>Lesson {k}: {LESSONS[k]?.title}</div>
                    {sc&&<div style={{fontSize:11,color:"#5A5A72",marginTop:1}}>Score: {sc.score}/{sc.total} · {sc.date}</div>}
                    {sc?.weakAreas?.length>0&&<div style={{fontSize:11,color:"#E87070",marginTop:1}}>Mahirap: {sc.weakAreas.join(", ")}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: ADMIN PIN
================================================================ */
const AdminPinScreen = ({go,onUnlock}) => {
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const press=(d)=>{
    if(pin.length>=4) return;
    const next=pin+d;
    setPin(next);setErr(false);
    if(next.length===4){
      if(next==="1234"){setTimeout(()=>{setPin("");onUnlock();go("adminPanel");},300);}
      else{setTimeout(()=>{setPin("");setErr(true);},400);}
    }
  };
  const del=()=>setPin(p=>p.slice(0,-1));
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:"#1A1A2E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px"}}>
      <SBar/>
      <div style={{fontSize:52,marginBottom:20}}>🔐</div>
      <h2 style={{color:"#FFF",fontWeight:900,fontSize:22,marginBottom:8,textAlign:"center"}}>Admin Panel</h2>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,marginBottom:32,textAlign:"center"}}>
        Para sa mga magulang at guro lamang
      </p>
      {/* PIN dots */}
      <div style={{display:"flex",gap:16,marginBottom:8}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:20,height:20,borderRadius:"50%",
            background:i<pin.length?"#6DE4F0":"rgba(255,255,255,0.2)",
            border:"2px solid rgba(255,255,255,0.4)",transition:"background 0.15s"}}/>
        ))}
      </div>
      {err&&<p style={{color:"#FF6B6B",fontSize:13,fontWeight:700,marginBottom:8}}>Mali ang PIN. Subukan ulit.</p>}
      <div style={{height:12}}/>
      {/* Number pad */}
      {[[1,2,3],[4,5,6],[7,8,9],["","0","⌫"]].map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:16,marginBottom:12}}>
          {row.map((d,di)=>(
            <button key={di} onClick={()=>d==="⌫"?del():d!==""&&press(String(d))} style={{
              width:70,height:70,borderRadius:"50%",
              background:d===""?"transparent":"rgba(255,255,255,0.12)",
              border:d===""?"none":"2px solid rgba(255,255,255,0.2)",
              color:"#FFF",fontSize:d==="⌫"?20:24,fontWeight:700,
              cursor:d===""?"default":"pointer",fontFamily:"inherit",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              {d}
            </button>
          ))}
        </div>
      ))}
      <button onClick={()=>go("subjects")} style={{marginTop:16,background:"none",border:"none",
        color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
        Bumalik
      </button>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: ADMIN PANEL
================================================================ */
const AdminPanelScreen = ({go,lessonScores,completed,materials,isOnline,setIsOnline,onReset}) => {
  const [tab,setTab]=useState("student");
  const [timeLimit,setTimeLimit]=useState(30);
  const [notifOn,setNotifOn]=useState(true);
  const [lang,setLang]=useState("fil");
  const [autoAdj,setAutoAdj]=useState(true);
  const aiPreview=computeAiPreview(lessonScores);
  const lsData = {
    completed: completed.length,
    scores: Object.keys(lessonScores).length,
    materials: materials.length,
    bytes: JSON.stringify({completed,lessonScores,materials}).length,
  };

  const TabBtn = ({id,label,icon}) => (
    <button onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0",border:"none",
      background:tab===id?"#FFF":"transparent",
      color:tab===id?"#007A87":"rgba(255,255,255,0.7)",
      fontWeight:tab===id?900:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",
      borderRadius:"12px 12px 0 0",transition:"all 0.2s"}}>
      {icon} {label}
    </button>
  );

  const Row = ({label,children,border=true}) => (
    <div style={{padding:"14px 0",borderBottom:border?"1px solid #F0F0F0":"none",
      display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <span style={{color:"#1C1C2E",fontSize:14,fontWeight:700}}>{label}</span>
      <div>{children}</div>
    </div>
  );

  const Toggle = ({on,set}) => (
    <button onClick={()=>set(v=>!v)} style={{width:48,height:28,borderRadius:14,
      background:on?"#007A87":"#CCC",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
      <div style={{position:"absolute",top:3,left:on?22:3,width:22,height:22,borderRadius:"50%",
        background:"#FFF",transition:"left 0.2s",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}}/>
    </button>
  );

  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:"#F5F5FA",display:"flex",flexDirection:"column"}}>
      <SBar isOnline={isOnline}/>
      {/* Header */}
      <div style={{background:"#1A1A2E",padding:"34px 20px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>go("subjects")} style={{background:"rgba(255,255,255,0.1)",border:"none",
            borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
            cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
          <h2 style={{color:"#FFF",fontWeight:900,fontSize:18}}>🔐 Admin Panel</h2>
        </div>
        {/* Student summary */}
        <div style={{display:"flex",alignItems:"center",gap:12,
          background:"rgba(255,255,255,0.08)",borderRadius:16,padding:"12px 16px",marginBottom:16}}>
          <div style={{width:44,height:44,borderRadius:"50%",
            background:"linear-gradient(135deg,#6DE4F0,#007A87)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
            {MOCK_STUDENT.avatar}
          </div>
          <div>
            <div style={{color:"#FFF",fontWeight:900,fontSize:16}}>{MOCK_STUDENT.name}</div>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:600}}>
              {MOCK_STUDENT.grade} · {MOCK_STUDENT.school.split(" ").slice(0,3).join(" ")}...
            </div>
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{color:"#6DE4F0",fontWeight:900,fontSize:18}}>
              {completed.filter(k=>LESSONS[k]).length}/3
            </div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:600}}>Aralin</div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4}}>
          <TabBtn id="student" label="Estudyante" icon="👤"/>
          <TabBtn id="ai"      label="AI Preview"  icon="🤖"/>
          <TabBtn id="controls"label="Kontrol"     icon="🔒"/>
        </div>
      </div>

      {/* Tab content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px 52px"}}>

        {/* ── STUDENT TAB ── */}
        {tab==="student"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {["1.1","1.2","1.3"].map(k=>{
              const done=completed.includes(k);
              const sc=lessonScores[k];
              const pct=sc?Math.round((sc.score/sc.total)*100):0;
              return (
                <div key={k} style={{background:"#FFF",borderRadius:18,padding:"16px 18px",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontSize:20}}>{done?"✅":"⭕"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900,fontSize:14,color:"#1C1C2E"}}>Lesson {k}</div>
                      <div style={{fontSize:12,color:"#5A5A72",fontWeight:600}}>{LESSONS[k]?.title}</div>
                    </div>
                    {sc&&<span style={{fontWeight:900,fontSize:14,
                      color:pct>=80?"#469856":pct>=60?"#C8A030":"#E07070"}}>
                      {sc.score}/{sc.total}
                    </span>}
                  </div>
                  {sc&&<>
                    <div style={{background:"#F0F0F0",borderRadius:6,height:8,marginBottom:8}}>
                      <div style={{height:"100%",borderRadius:6,transition:"width 0.5s",
                        background:pct>=80?"#6ACC7A":pct>=60?"#F5B800":"#E07878",
                        width:`${pct}%`}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:11,color:"#5A5A72",fontWeight:600}}>Petsa: {sc.date}</span>
                      {sc.weakAreas?.length>0&&(
                        <span style={{fontSize:11,color:"#E07070",fontWeight:700}}>
                          ⚠ {sc.weakAreas.join(", ")}
                        </span>
                      )}
                    </div>
                  </>}
                  {!done&&!sc&&<div style={{fontSize:12,color:"#AAA",fontStyle:"italic"}}>Hindi pa kumukuha</div>}
                </div>
              );
            })}
            {/* Local storage info */}
            <div style={{background:"#E8F4FF",borderRadius:18,padding:"16px 18px",
              border:"1px solid #B8D4F0"}}>
              <div style={{fontWeight:800,fontSize:13,color:"#1A5080",marginBottom:10}}>
                📱 Locally Stored Data (Offline-Ready)
              </div>
              {[
                {label:"Natapos na aralin",val:`${lsData.completed} item`},
                {label:"Lesson scores",val:`${lsData.scores} item`},
                {label:"Downloaded materials",val:`${lsData.materials} item`},
                {label:"Total localStorage size",val:`~${lsData.bytes} bytes`},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",
                  padding:"5px 0",borderBottom:i<3?"1px solid #C8E0F0":"none"}}>
                  <span style={{fontSize:12,color:"#2A5080",fontWeight:600}}>{r.label}</span>
                  <span style={{fontSize:12,color:"#1A5080",fontWeight:800}}>{r.val}</span>
                </div>
              ))}
              <div style={{marginTop:10,fontSize:11,color:"#2A5080",fontStyle:"italic",lineHeight:1.5}}>
                Lahat ng datos na ito ay naka-save sa device. Available kahit walang internet.
              </div>
            </div>
          </div>
        )}

        {/* ── AI PREVIEW TAB ── */}
        {tab==="ai"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"#FFF",borderRadius:18,padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E",marginBottom:6}}>
                🤖 Susunod na AI Generation
              </div>
              {aiPreview
                ? <>
                    <p style={{fontSize:13,color:"#5A5A72",lineHeight:1.6,marginBottom:14}}>
                      Batay sa performance ni <strong>{MOCK_STUDENT.name}</strong>,
                      ang susunod na sync ay {aiPreview.weak.length>0
                        ?`mag-fo-focus sa: ${aiPreview.weak.join(" at ")}`
                        :"mag-ge-generate ng advanced content"}.
                    </p>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {aiPreview.exercises.map((e,i)=>(
                        <div key={i} style={{background:"#F0F9FF",borderRadius:12,padding:"12px 14px",
                          display:"flex",alignItems:"flex-start",gap:10}}>
                          <span style={{fontSize:20}}>📝</span>
                          <span style={{fontSize:13,color:"#1A5080",fontWeight:600,lineHeight:1.5}}>{e.label}</span>
                        </div>
                      ))}
                      <div style={{background:"#F0F9FF",borderRadius:12,padding:"12px 14px",
                        display:"flex",alignItems:"flex-start",gap:10}}>
                        <span style={{fontSize:20}}>{aiPreview.story.icon}</span>
                        <span style={{fontSize:13,color:"#1A5080",fontWeight:600,lineHeight:1.5}}>{aiPreview.story.label}</span>
                      </div>
                    </div>
                  </>
                : <p style={{fontSize:13,color:"#5A5A72",lineHeight:1.6}}>
                    Kumpletuhin ang kahit isang aralin para makita ang AI preview.
                  </p>}
            </div>
            {/* Sync payload preview */}
            {aiPreview&&(
              <div style={{background:"#1A1A2E",borderRadius:18,padding:"18px"}}>
                <div style={{fontWeight:800,fontSize:13,color:"#6DE4F0",marginBottom:10}}>
                  Sync Payload na Ipapadala sa Server
                </div>
                <div style={{fontFamily:"monospace",fontSize:11,color:"#A0F0A0",lineHeight:1.7,
                  whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
{`{
  "student": "${MOCK_STUDENT.name}",
  "grade": "${MOCK_STUDENT.grade}",
  "completed": ${JSON.stringify(completed)},
  "weakAreas": ${JSON.stringify(aiPreview.weak)},
  "avgScore": "${Math.round(aiPreview.avgPct*100)}%",
  "difficulty": "${aiPreview.difficulty}",
  "lang": "Filipino",
  "tokens_est": ${aiPreview.tokens_est}
}`}
                </div>
              </div>
            )}
            {/* AI usage stats */}
            <div style={{background:"#FFF",borderRadius:18,padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E",marginBottom:12}}>AI Usage (Demo)</div>
              {[
                {label:"AI materials generated",val:materials.filter(m=>m.id.startsWith("ai-")).length+" set"},
                {label:"Gemini model",val:"gemini-2.0-flash"},
                {label:"Avg tokens per sync",val:"~380"},
                {label:"Syncs this week",val:materials.filter(m=>m.id.startsWith("ai-")).length},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",
                  padding:"8px 0",borderBottom:i<3?"1px solid #F0F0F0":"none"}}>
                  <span style={{fontSize:13,color:"#5A5A72",fontWeight:600}}>{r.label}</span>
                  <span style={{fontSize:13,color:"#1C1C2E",fontWeight:800}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PARENTAL CONTROLS TAB ── */}
        {tab==="controls"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"#FFF",borderRadius:18,padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E",marginBottom:4}}>Parental Controls</div>
              <div style={{fontSize:12,color:"#5A5A72",marginBottom:14}}>Mga setting para sa magulang</div>
              <Row label="Mga Notification"><Toggle on={notifOn} set={setNotifOn}/></Row>
              <Row label="Auto-adjust na Difficulty"><Toggle on={autoAdj} set={setAutoAdj}/></Row>
              <Row label="Wika">
                <div style={{display:"flex",gap:6}}>
                  {[{v:"fil",l:"Filipino"},{v:"en",l:"English"},{v:"both",l:"Parehong"}].map(o=>(
                    <button key={o.v} onClick={()=>setLang(o.v)} style={{padding:"5px 10px",borderRadius:8,
                      background:lang===o.v?"#007A87":"#F0F0F0",color:lang===o.v?"#FFF":"#5A5A72",
                      border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Daily Time Limit" border={false}>
                <div style={{display:"flex",gap:6}}>
                  {[15,30,60].map(t=>(
                    <button key={t} onClick={()=>setTimeLimit(t)} style={{padding:"5px 10px",borderRadius:8,
                      background:timeLimit===t?"#007A87":"#F0F0F0",color:timeLimit===t?"#FFF":"#5A5A72",
                      border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      {t}m
                    </button>
                  ))}
                </div>
              </Row>
            </div>

            {/* Offline demo toggle */}
            <div style={{background:isOnline?"#E8FFF0":"#FFF0F0",borderRadius:18,padding:"18px",
              border:`1px solid ${isOnline?"#90D4A8":"#F4A0A0"}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E",marginBottom:4}}>
                Demo: Offline Mode Simulator
              </div>
              <p style={{fontSize:12,color:"#5A5A72",lineHeight:1.5,marginBottom:14}}>
                I-off ang toggle na ito para ipakita kung paano gumagana ang app nang walang internet.
                Lahat ng naka-download na aralin ay mananatiling accessible.
              </p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:isOnline?"#206020":"#C02020"}}>
                    {isOnline?"Online":"Offline Mode Active"}
                  </div>
                  <div style={{fontSize:11,color:"#5A5A72",marginTop:2}}>
                    {isOnline?"Sync at AI generation available":"Only downloaded content works"}
                  </div>
                </div>
                <Toggle on={isOnline} set={setIsOnline}/>
              </div>
            </div>

            {/* Reset */}
            <div style={{background:"#FFF",borderRadius:18,padding:"18px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E",marginBottom:4}}>I-reset ang Progress</div>
              <p style={{fontSize:12,color:"#5A5A72",lineHeight:1.5,marginBottom:14}}>
                Buburahin ang lahat ng progress at scores. Hindi ito mababalik.
              </p>
              <button onClick={onReset} style={{width:"100%",background:"#FFF0F0",color:"#C02020",
                border:"2px solid #F4A0A0",borderRadius:12,padding:"12px",
                fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                I-reset ang Lahat ng Progress
              </button>
            </div>
          </div>
        )}
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   SCREEN: MATERIALS
================================================================ */
const Materials = ({go,openMenu,notif,materials,isOnline}) => {
  const [viewing,setViewing]=useState(null);
  const [storyPage,setStoryPage]=useState(0);
  const [quizKey,setQuizKey]=useState(0);

  if(viewing){
    const mat=materials.find(m=>m.id===viewing);
    if(!mat){setViewing(null);return null;}
    if(mat.type==="story") return (
      <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
        background:OCEAN,display:"flex",flexDirection:"column"}}>
        <BgImg src="bg-lesson.png"/><SBar isOnline={isOnline}/>
        <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
          <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
          <button onClick={()=>{setViewing(null);setStoryPage(0);}} style={{background:"rgba(0,0,0,0.15)",
            border:"none",borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
            cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
        </div>
        <div style={{flex:1,margin:"0 18px",background:"rgba(255,255,255,0.97)",borderRadius:24,
          padding:"26px 22px",display:"flex",flexDirection:"column",position:"relative",zIndex:2,
          boxShadow:"0 16px 44px rgba(0,0,0,0.16)"}}>
          <span style={{display:"inline-block",background:"#007A87",color:"#FFF",borderRadius:20,
            padding:"4px 14px",fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:16}}>KWENTO</span>
          <p style={{color:"#1C1C2E",fontSize:18,lineHeight:1.85,flex:1,fontWeight:600}}>{mat.pages[storyPage]}</p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:24}}>
            <span style={{color:"#5A5A72",fontSize:13,fontWeight:700}}>Pahina {storyPage+1} sa {mat.pages.length}</span>
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
        <div style={{height:52}}/><HBar/>
      </div>
    );
    if(mat.type==="quiz") return (
      <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
        background:OCEAN,display:"flex",flexDirection:"column"}}>
        <BgImg src="bg-lesson.png"/><SBar isOnline={isOnline}/>
        <div style={{position:"absolute",top:34,left:16,zIndex:30}}>
          <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
        </div>
        <button onClick={()=>{setViewing(null);setQuizKey(k=>k+1);}} style={{
          position:"absolute",top:38,left:68,zIndex:30,background:"rgba(0,0,0,0.15)",
          border:"none",borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,
          fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
        <QuizRunner key={quizKey} questions={mat.items}
          passThreshold={Math.ceil(mat.items.length*0.6)}
          headerText="PAGSASANAY!"
          onPass={()=>{setViewing(null);setQuizKey(k=>k+1);}}
          onFail={()=>{setViewing(null);setQuizKey(k=>k+1);}}/>
        <KikoBottom msg={"KAYA MO\nITO!"}/>
        <HBar/>
      </div>
    );
  }

  // ── Materials list ──
  return (
    <div style={{width:"100%",height:"100%",position:"relative",overflow:"hidden",
      background:OCEAN,display:"flex",flexDirection:"column"}}>
      <BgImg src="bg-subjects.png"/><SBar isOnline={isOnline}/>
      <div style={{padding:"34px 20px 12px",display:"flex",alignItems:"center",gap:12,position:"relative",zIndex:2}}>
        <KLogo notif={notif} onClick={openMenu} isOnline={isOnline}/>
        <button onClick={()=>go("mathPath")} style={{background:"rgba(0,0,0,0.15)",border:"none",
          borderRadius:10,padding:"8px 14px",color:"#FFF",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit"}}>‹ Bumalik</button>
      </div>
      <h2 style={{color:"#FFF",fontWeight:900,fontSize:20,padding:"0 20px 16px",
        position:"relative",zIndex:2,textShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
        Mga Naka-download {!isOnline&&"· 📥 Offline"}
      </h2>
      <div style={{flex:1,padding:"0 18px",display:"flex",flexDirection:"column",gap:14,
        position:"relative",zIndex:2,overflow:"auto"}}>
        {materials.length===0
          ? <div style={{background:"rgba(255,255,255,0.92)",borderRadius:20,padding:"32px 24px",textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:12}}>📡</div>
              <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:18,marginBottom:8}}>Walang na-sync pa</h3>
              <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.6}}>I-open ang menu at i-sync kapag may WiFi.</p>
            </div>
          : materials.map(m=>(
              <button key={m.id} onClick={()=>setViewing(m.id)} style={{background:"rgba(255,255,255,0.95)",
                border:"none",borderRadius:20,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,
                cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:"0 6px 20px rgba(0,0,0,0.12)"}}>
                <div style={{width:54,height:54,
                  background:m.id.startsWith("ai-")?"#FFF0DC":"#E0F4F6",
                  borderRadius:16,flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{m.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:15,color:"#1C1C2E",marginBottom:3}}>{m.title}</div>
                  <div style={{fontSize:12,color:"#5A5A72",fontWeight:600}}>{m.subtitle}</div>
                  {m.id.startsWith("ai-")&&(
                    <div style={{fontSize:11,color:"#C8A030",fontWeight:700,marginTop:3}}>
                      ✨ AI-generated · Available offline
                    </div>
                  )}
                </div>
                <span style={{
                  background:m.id.startsWith("ai-")?"#C8A030":"#007A87",
                  color:"#FFF",borderRadius:20,padding:"4px 12px",
                  fontSize:10,fontWeight:800,letterSpacing:0.8,flexShrink:0}}>{m.tag}</span>
              </button>
            ))}
      </div>
      <HBar/>
    </div>
  );
};

/* ================================================================
   OVERLAY: MENU
================================================================ */
const MenuOverlay = ({onClose,go,notif,materials,onSyncDone,isOnline}) => {
  const [apiKey,setApiKey] = useState(()=>{try{return localStorage.getItem("kiko_gemini_key")||"";}catch{return "";}});
  const [keyVis,setKeyVis] = useState(false);
  const [syncing,setSyncing] = useState(false);
  const [syncMsg,setSyncMsg] = useState(null);
  const [syncErr,setSyncErr] = useState(null);
  const alreadySynced = materials.some(m=>m.id.startsWith("ai-"));
  const saveKey = (k)=>{setApiKey(k);try{localStorage.setItem("kiko_gemini_key",k);}catch{}};

  const doSync = async ()=>{
    if(!apiKey.trim()){setSyncErr("Ilagay ang Gemini API key.");return;}
    setSyncing(true);setSyncErr(null);setSyncMsg(null);
    try{
      const items = await generateWithGemini(apiKey.trim(),[]);
      onSyncDone({
        id:`ai-${Date.now()}`,
        title:"Pagsasanay mula sa AI",
        subtitle:"Ginawa para sa iyo ni Kiko ngayon",
        tag:"MATH",icon:"🤖",type:"quiz",items,
      });
      setSyncMsg("Nai-download na! Tingnan sa Mga Naka-download.");
    }catch(e){
      setSyncErr(`Hindi nagtagumpay: ${e.message}`);
    }finally{
      setSyncing(false);
    }
  };

  return (
    <div style={{position:"absolute",inset:0,zIndex:999,background:"rgba(0,0,0,0.52)",
      display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FFF",borderRadius:"28px 28px 0 0",
        padding:"8px 0 36px",width:"100%",
        boxShadow:"0 -20px 60px rgba(0,0,0,0.3)",maxHeight:"90%",overflowY:"auto"}}>
        <div style={{width:48,height:5,borderRadius:3,background:"#DDD",margin:"8px auto 20px"}}/>

        {/* User row */}
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"0 24px 18px",
          borderBottom:"1px solid #F0F0F0",marginBottom:8}}>
          <div style={{width:50,height:50,borderRadius:"50%",
            background:"linear-gradient(135deg,#6DE4F0,#007A87)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🦈</div>
          <div>
            <div style={{fontWeight:900,fontSize:17,color:"#1C1C2E"}}>{MOCK_STUDENT.name}</div>
            <div style={{fontSize:13,color:"#5A5A72",fontWeight:600}}>{MOCK_STUDENT.grade} · Math Stage 1</div>
          </div>
        </div>

        {/* Nav items */}
        {[
          {icon:"👤",label:"Profile",         action:()=>{onClose();go("profile");}},
          {icon:"📥",label:"Mga Naka-download",action:()=>{onClose();go("materials");}},
          {icon:"⚙️",label:"Mga Setting (Admin)",action:()=>{onClose();go("adminPin");}},
        ].map((item,i)=>(
          <button key={i} onClick={item.action} style={{width:"100%",background:"none",border:"none",
            padding:"14px 24px",display:"flex",alignItems:"center",gap:16,
            cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <span style={{fontSize:22,width:28}}>{item.icon}</span>
            <span style={{fontWeight:700,fontSize:16,color:"#1C1C2E"}}>{item.label}</span>
          </button>
        ))}

        {/* Sync panel */}
        <div style={{margin:"8px 18px 0",padding:"16px",
          background:isOnline?"#F0F8FF":"#F5F5F5",
          borderRadius:16,border:`1px solid ${isOnline?"#A8D4E8":"#DDD"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isOnline?12:0}}>
            <span style={{fontSize:22}}>{isOnline?"📡":"✕"}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:14,color:"#1C1C2E"}}>
                {isOnline?"WiFi Sync + AI Materials":"Offline — Sync hindi available"}
              </div>
              <div style={{fontSize:12,color:"#5A5A72",marginTop:2}}>
                {isOnline
                  ?"Gamit ang Gemini para gumawa ng bagong pagsasanay"
                  :"I-on ang WiFi para mag-sync. Mga na-download ay available pa rin."}
              </div>
            </div>
            {notif>0&&isOnline&&(
              <div style={{background:"#FF3B30",color:"#FFF",borderRadius:20,
                padding:"2px 8px",fontSize:11,fontWeight:900}}>{notif} bago</div>
            )}
          </div>

          {isOnline&&<>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#5A5A72",marginBottom:6}}>
                Gemini API Key
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                  style={{color:"#007A87",marginLeft:8,fontWeight:700}}>Kumuha ng libre →</a>
              </div>
              <div style={{display:"flex",gap:8}}>
                <input type={keyVis?"text":"password"} value={apiKey}
                  onChange={e=>saveKey(e.target.value)} placeholder="AIza..."
                  style={{flex:1,padding:"10px 12px",borderRadius:10,
                    border:"1.5px solid #C0D8E8",fontSize:13,fontFamily:"inherit",
                    outline:"none",color:"#1C1C2E"}}/>
                <button onClick={()=>setKeyVis(v=>!v)} style={{background:"rgba(0,0,0,0.06)",
                  border:"none",borderRadius:10,padding:"0 12px",fontSize:16,cursor:"pointer"}}>
                  {keyVis?"🙈":"👁"}
                </button>
              </div>
            </div>
            {syncErr&&(
              <div style={{background:"#FFE8E8",borderRadius:10,padding:"10px 12px",
                fontSize:12,color:"#C02020",fontWeight:600,marginBottom:10}}>{syncErr}</div>
            )}
            {syncMsg&&(
              <div style={{background:"#E8FFE8",borderRadius:10,padding:"10px 12px",
                fontSize:12,color:"#206020",fontWeight:600,marginBottom:10}}>✅ {syncMsg}</div>
            )}
            {alreadySynced
              ? <div style={{background:"#E8FFE8",borderRadius:12,padding:"12px",
                  textAlign:"center",fontSize:14,color:"#206020",fontWeight:700}}>
                  ✅ Naka-sync na!
                </div>
              : <button onClick={doSync} disabled={syncing||!apiKey.trim()} style={{
                  width:"100%",
                  background:(!apiKey.trim()||syncing)?"#CCC":"#007A87",
                  color:"#FFF",border:"none",borderRadius:12,padding:"13px",
                  fontWeight:800,fontSize:14,
                  cursor:(!apiKey.trim()||syncing)?"default":"pointer",
                  fontFamily:"inherit"}}>
                  {syncing?"Nagge-generate... 🤖":"I-download at Gumawa ng Materials"}
                </button>}
          </>}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN APP
================================================================ */
export default function KikoApp() {
  const [screen,      setScreen]      = useState("splash");
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [lockedOpen,  setLockedOpen]  = useState(false);
  const [lastScore,   setLastScore]   = useState({score:3,total:3});
  const [completed,   setCompleted]   = useState([]);
  const [lessonScores,setLessonScores]= useState({});
  const [currentKey,  setCurrentKey]  = useState(null);
  const [notif,       setNotif]       = useState(1);
  const [materials,   setMaterials]   = useState(STATIC_SUPP);
  const [isOnline,    setIsOnline]    = useState(true);

  /* localStorage persistence */
  useEffect(()=>{
    try{
      const c = localStorage.getItem("kiko_completed");
      const s = localStorage.getItem("kiko_scores");
      const m = localStorage.getItem("kiko_materials");
      setCompleted(c ? JSON.parse(c) : ["1.1"]);
      setLessonScores(s ? JSON.parse(s) : {"1.1":{score:3,total:3,weakAreas:[],date:"Hunyo 24, 2025"}});
      setMaterials(m ? JSON.parse(m) : STATIC_SUPP);
    }catch{
      setCompleted(["1.1"]);
      setLessonScores({"1.1":{score:3,total:3,weakAreas:[],date:"Hunyo 24, 2025"}});
    }
  },[]);

  useEffect(()=>{try{localStorage.setItem("kiko_completed",  JSON.stringify(completed));     }catch{}},[completed]);
  useEffect(()=>{try{localStorage.setItem("kiko_scores",     JSON.stringify(lessonScores));  }catch{}},[lessonScores]);
  useEffect(()=>{try{localStorage.setItem("kiko_materials",  JSON.stringify(materials));     }catch{}},[materials]);

  const go       = (s) => setScreen(s);
  const notImpl  = ()  => setModalOpen(true);
  const onLocked = ()  => setLockedOpen(true);
  const openMenu = ()  => setMenuOpen(true);

  const startLesson = (key) => {
    setCurrentKey(key);
    go(key==="ms1" ? "masteryTest" : "lessonTeach");
  };

  const completeLesson = (key, score, total) => {
    setLastScore({score, total});
    setCompleted(p => p.includes(key) ? p : [...p, key]);
    setLessonScores(p => ({...p, [key]:{
      score, total,
      weakAreas: getWeakAreas(key, score, total),
      date: new Date().toLocaleDateString("fil-PH",{month:"long",day:"numeric",year:"numeric"}),
    }}));
    setNotif(1);
  };

  const completeMastery = (score, total) => {
    setLastScore({score, total});
    setCompleted(p => p.includes("ms1") ? p : [...p,"ms1"]);
    setLessonScores(p => ({...p, ms1:{
      score, total, weakAreas:[],
      date: new Date().toLocaleDateString("fil-PH"),
    }}));
  };

  const handleSyncDone = (newMat) => {
    setMaterials(prev => [...prev, newMat]);
    setNotif(0);
  };

  const handleReset = () => {
    setCompleted(["1.1"]);
    setLessonScores({"1.1":{score:3,total:3,weakAreas:[],date:"Hunyo 24, 2025"}});
    setMaterials(STATIC_SUPP);
    setNotif(1);
    try{
      localStorage.setItem("kiko_completed",  JSON.stringify(["1.1"]));
      localStorage.setItem("kiko_scores",     JSON.stringify({"1.1":{score:3,total:3,weakAreas:[],date:"Hunyo 24, 2025"}}));
      localStorage.setItem("kiko_materials",  JSON.stringify(STATIC_SUPP));
    }catch{}
  };

  const lesson = currentKey && currentKey !== "ms1" ? LESSONS[currentKey] : null;
  const shared = {go, openMenu, notif, isOnline};

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"#0D1B2A",padding:20,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button,input{font-family:'Nunito',system-ui,sans-serif;}
        button:not(:disabled):active{transform:scale(0.96);transition:transform 0.08s;}
      `}</style>

      <div style={{width:390,height:820,borderRadius:46,overflow:"hidden",
        boxShadow:"0 40px 100px rgba(0,0,0,0.65),0 0 0 2px #555,0 0 0 9px #1E1E1E,0 0 0 11px #333",
        position:"relative",flexShrink:0}}>

        {screen==="splash"          && <Splash          {...shared}/>}
        {screen==="subjects"        && <Subjects        {...shared} notImpl={notImpl}/>}
        {screen==="mathPath"        && <MathPath        {...shared} notImpl={notImpl} onLocked={onLocked} completed={completed} startLesson={startLesson}/>}
        {screen==="lessonTeach"     && lesson && <LessonTeach  {...shared} lesson={lesson}/>}
        {screen==="lessonCheck"     && lesson && <LessonCheck  {...shared} lesson={lesson} onComplete={(s,t)=>completeLesson(currentKey,s,t)}/>}
        {screen==="lessonComplete"  && <LessonComplete  lessonKey={currentKey} go={go} score={lastScore.score} total={lastScore.total}/>}
        {screen==="masteryTest"     && <MasteryTest     {...shared} onComplete={completeMastery}/>}
        {screen==="masteryComplete" && <MasteryComplete go={go} score={lastScore.score} total={lastScore.total}/>}
        {screen==="materials"       && <Materials       {...shared} materials={materials}/>}
        {screen==="profile"         && <ProfileScreen   {...shared} lessonScores={lessonScores} completed={completed}/>}
        {screen==="adminPin"        && <AdminPinScreen  go={go} onUnlock={()=>{}}/>}
        {screen==="adminPanel"      && <AdminPanelScreen go={go}
            lessonScores={lessonScores} completed={completed} materials={materials}
            isOnline={isOnline} setIsOnline={setIsOnline} onReset={handleReset}/>}

        {menuOpen  && <MenuOverlay onClose={()=>setMenuOpen(false)} go={go}
            notif={notif} materials={materials} onSyncDone={handleSyncDone} isOnline={isOnline}/>}
        {modalOpen && <NiModal    onClose={()=>setModalOpen(false)}/>}
        {lockedOpen&& <LockedModal onClose={()=>setLockedOpen(false)}/>}
      </div>
    </div>
  );
}
