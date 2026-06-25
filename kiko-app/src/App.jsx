import { useState, useRef } from "react";

// ================================================================
// ASSET FILE LIST — provide these files alongside the app:
//
//   kiko-logo.png     KIKO colorful block-letter logo
//   kiko-whale.png    Full Kiko whale shark illustration (glasses + tie)
//   jellyfish.png     Pink jellyfish (top-right of splash)
//   starfish.png      Red/coral starfish (bottom decoration)
//   coral.png         Coral reef cluster (full-width bottom strip)
//
// ================================================================

// ── Exercise data: Lesson 1.2 — Counting to 10 ─────────────────
const EXERCISES = [
  { q: "Ilan ang mga isda?",        emoji: "🐟", count: 7,  opts: [5, 6, 7, 8],    ans: 7  },
  { q: "Ilan ang mga alimango?",    emoji: "🦀", count: 3,  opts: [2, 3, 4, 5],    ans: 3  },
  { q: "Ilan ang mga pagong?",      emoji: "🐢", count: 9,  opts: [7, 8, 9, 10],   ans: 9  },
  { q: "Ilan ang mga bituin-dagat?",emoji: "⭐",  count: 5,  opts: [3, 4, 5, 6],    ans: 5  },
  { q: "Ilan ang mga pugita?",      emoji: "🐙", count: 10, opts: [8, 9, 10, 6],   ans: 10 },
];

// ── Math path checkpoint data ───────────────────────────────────
const CHECKPOINTS = [
  { id: 1, num: "1.1", title: "Bilang 1 hanggang 5",   status: "done"    },
  { id: 2, num: "1.2", title: "Bilang 1 hanggang 10",  status: "current" },
  { id: 3, num: "1.3", title: "Itama ang Bilang",      status: "locked"  },
  { id: 4, num: "1.4", title: "Bilang at Salita",      status: "locked"  },
  { id: 5, num: "1.5", title: "Ayusin ang Bilang",     status: "locked"  },
  { id: 6, num: "1.6", title: "Pagsubok sa Pagbilang", status: "locked"  },
];

// ── SVG node positions (px, within 390 × 540 canvas) ───────────
const NODE_POS = [
  { cx: 218, cy: 480 },
  { cx: 108, cy: 392 },
  { cx: 258, cy: 308 },
  { cx: 108, cy: 224 },
  { cx: 258, cy: 144 },
  { cx: 168, cy: 58  },
];

const OCEAN = "linear-gradient(168deg,#6DE4F0 0%,#3BBBD4 38%,#1894BC 68%,#0B72A0 100%)";

// ── Shared: floating bubbles ────────────────────────────────────
const Bubbles = () => (
  <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
    {[
      {s:14,l:"8%", t:"18%",o:.28},{s:20,l:"82%",t:"22%",o:.20},
      {s:10,l:"24%",t:"38%",o:.26},{s:16,l:"68%",t:"54%",o:.17},
      {s:8, l:"44%",t:"11%",o:.30},{s:12,l:"58%",t:"72%",o:.20},
      {s:18,l:"13%",t:"64%",o:.16},{s:9, l:"74%",t:"40%",o:.22},
    ].map((b,i)=>(
      <div key={i} style={{
        position:"absolute",left:b.l,top:b.t,
        width:b.s,height:b.s,borderRadius:"50%",
        border:"2px solid rgba(255,255,255,.7)",
        background:`rgba(255,255,255,${b.o})`,
      }}/>
    ))}
  </div>
);

// ── Shared: Android status bar ──────────────────────────────────
const StatusBar = () => (
  <div style={{
    position:"absolute",top:0,left:0,right:0,
    height:28,zIndex:100,padding:"0 18px",
    display:"flex",alignItems:"center",justifyContent:"space-between",
    background:"rgba(0,0,0,0.08)",
  }}>
    <span style={{color:"#FFF",fontSize:12,fontWeight:700}}>9:41</span>
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
        <rect x="0" y="6" width="3" height="6" rx="1"/>
        <rect x="4.5" y="4" width="3" height="8" rx="1"/>
        <rect x="9" y="2" width="3" height="10" rx="1"/>
        <rect x="13.5" y="0" width="3" height="12" rx="1" opacity=".4"/>
      </svg>
      <svg width="15" height="12" viewBox="0 0 24 18" fill="white">
        <path d="M12 4C8.5 4 5.3 5.4 3 7.7L0 4.7C3.1 1.7 7.3 0 12 0s8.9 1.7 12 4.7l-3 3C18.7 5.4 15.5 4 12 4z"/>
        <path d="M12 10c-2 0-3.8.8-5.1 2.1L4 9.2C5.9 7.2 8.8 6 12 6s6.1 1.2 8 3.2l-2.9 2.9C15.8 10.8 14 10 12 10z"/>
        <circle cx="12" cy="18" r="3"/>
      </svg>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
        <rect x="0" y="1" width="20" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
        <rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="white"/>
        <rect x="21" y="3.5" width="2.5" height="5" rx="1" fill="white" opacity=".5"/>
      </svg>
    </div>
  </div>
);

// ── Shared: Android home gesture bar ───────────────────────────
const HomeBar = () => (
  <div style={{
    position:"absolute",bottom:0,left:0,right:0,
    height:24,zIndex:100,
    display:"flex",alignItems:"center",justifyContent:"center",
    background:"rgba(0,0,0,0.10)",
  }}>
    <div style={{width:90,height:4,borderRadius:2,background:"rgba(255,255,255,.55)"}}/>
  </div>
);

// ── Shared: K nav icon ──────────────────────────────────────────
const KIcon = ({onClick}) => (
  <button onClick={onClick} style={{
    width:42,height:42,background:"rgba(0,0,0,0.18)",
    borderRadius:13,border:"none",cursor:onClick?"pointer":"default",
    display:"flex",alignItems:"center",justifyContent:"center",
    color:"#FFF",fontWeight:900,fontSize:20,fontFamily:"inherit",
    flexShrink:0,
  }}>K</button>
);

// ── Shared: not-implemented modal ───────────────────────────────
const NotImplModal = ({onClose}) => (
  <div style={{
    position:"absolute",inset:0,zIndex:999,
    background:"rgba(0,0,0,0.55)",
    display:"flex",alignItems:"center",justifyContent:"center",padding:28,
  }}>
    <div style={{
      background:"#FFF",borderRadius:24,padding:"30px 24px",
      width:"100%",maxWidth:330,textAlign:"center",
      boxShadow:"0 20px 50px rgba(0,0,0,0.28)",
    }}>
      <div style={{fontSize:52,marginBottom:12}}>🚧</div>
      <h3 style={{color:"#1C1C2E",fontWeight:900,fontSize:20,marginBottom:10}}>
        Hindi pa available
      </h3>
      <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:24}}>
        Sa demo na ito, hindi pa available ang feature na ito.
        Salamat sa iyong pasensya!
      </p>
      <button onClick={onClose} style={{
        background:"#007A87",color:"#FFF",border:"none",
        borderRadius:14,padding:"14px 0",fontWeight:800,
        fontSize:16,cursor:"pointer",fontFamily:"inherit",width:"100%",
      }}>
        OK, naiintindihan!
      </button>
    </div>
  </div>
);

// ================================================================
// SCREEN 1 — SPLASH
// ================================================================
const Splash = ({go}) => (
  <div style={{
    width:"100%",height:"100%",background:OCEAN,
    position:"relative",overflow:"hidden",
    display:"flex",flexDirection:"column",alignItems:"center",
  }}>
    <Bubbles/>
    <StatusBar/>

    <img src="jellyfish.png" alt="" style={{
      position:"absolute",top:44,right:18,width:74,
      pointerEvents:"none",zIndex:1,
    }}/>

    <img src="kiko-logo.png" alt="KIKO" style={{
      width:226,height:"auto",marginTop:128,
      position:"relative",zIndex:2,
    }}/>

    <p style={{
      color:"rgba(255,255,255,0.93)",fontSize:14,fontWeight:700,
      marginTop:10,marginBottom:0,letterSpacing:0.5,
      textAlign:"center",position:"relative",zIndex:2,
      textShadow:"0 1px 6px rgba(0,0,0,0.18)",
    }}>
      Bawat aral, bagong tuklas.
    </p>

    <button onClick={()=>go("subjects")} style={{
      marginTop:34,
      background:"#F5B800",color:"#1C1C2E",
      border:"none",borderRadius:32,
      padding:"17px 64px",
      fontWeight:900,fontSize:17,
      cursor:"pointer",fontFamily:"inherit",
      boxShadow:"0 8px 28px rgba(0,0,0,0.25)",
      letterSpacing:1.4,textTransform:"uppercase",
      position:"relative",zIndex:2,
    }}>
      Get Started
    </button>

    <img src="kiko-whale.png" alt="Kiko" style={{
      position:"absolute",bottom:48,left:"50%",
      transform:"translateX(-50%)",
      width:235,pointerEvents:"none",zIndex:1,
    }}/>
    <img src="starfish.png" alt="" style={{
      position:"absolute",bottom:30,left:14,
      width:58,pointerEvents:"none",zIndex:2,
    }}/>
    <img src="coral.png" alt="" style={{
      position:"absolute",bottom:0,left:0,
      width:"100%",pointerEvents:"none",zIndex:2,
    }}/>

    <HomeBar/>
  </div>
);

// ================================================================
// SCREEN 2 — SUBJECT SELECT
// ================================================================
const Subjects = ({go, notImpl}) => {
  const cards = [
    {
      key:"math",label:"MATH",icon:"3+2",
      iconStyle:{fontSize:30,fontWeight:900,color:"#FFF",fontStyle:"italic"},
      bg:"linear-gradient(135deg,#D4AB32 0%,#A07A10 100%)",
      action:()=>go("mathPath"),
    },
    {
      key:"english",label:"ENGLiSH",icon:"ABC",
      iconStyle:{fontSize:26,fontWeight:900,color:"#FFF"},
      bg:"linear-gradient(135deg,#9870CC 0%,#6040A0 100%)",
      action:notImpl,
    },
    {
      key:"science",label:"SCiENCE",icon:"🌱",
      iconStyle:{fontSize:38},
      bg:"linear-gradient(135deg,#60C060 0%,#3A8A3A 100%)",
      action:notImpl,
    },
  ];

  return (
    <div style={{
      width:"100%",height:"100%",background:OCEAN,
      position:"relative",overflow:"hidden",
      display:"flex",flexDirection:"column",
    }}>
      <Bubbles/>
      <StatusBar/>

      <div style={{
        padding:"34px 20px 14px",
        display:"flex",alignItems:"center",
        position:"relative",zIndex:2,
      }}>
        <KIcon/>
      </div>

      <div style={{
        flex:1,padding:"4px 20px 0",
        display:"flex",flexDirection:"column",gap:16,
        position:"relative",zIndex:2,
      }}>
        {cards.map(c=>(
          <button key={c.key} onClick={c.action} style={{
            background:c.bg,border:"none",borderRadius:22,
            padding:"22px 20px",
            display:"flex",alignItems:"center",
            cursor:"pointer",fontFamily:"inherit",
            boxShadow:"0 8px 26px rgba(0,0,0,0.18)",
            textAlign:"left",
          }}>
            <div style={{
              width:68,height:68,
              background:"rgba(255,255,255,0.18)",
              borderRadius:18,flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              marginRight:18,
            }}>
              <span style={c.iconStyle}>{c.icon}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{color:"#FFF",fontWeight:900,fontSize:22,marginBottom:5}}>
                {c.label}
              </div>
              <div style={{color:"rgba(255,255,255,0.78)",fontSize:13,fontWeight:600}}>
                10 checkpoints left
              </div>
            </div>
            <div style={{
              width:38,height:38,
              background:"rgba(0,0,0,0.14)",
              borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#FFF",fontSize:22,fontWeight:700,
            }}>›</div>
          </button>
        ))}
      </div>

      <img src="starfish.png" alt="" style={{
        position:"absolute",bottom:30,right:16,width:54,pointerEvents:"none",zIndex:2,
      }}/>
      <img src="coral.png" alt="" style={{
        position:"absolute",bottom:0,left:0,width:"100%",pointerEvents:"none",zIndex:1,
      }}/>
      <HomeBar/>
    </div>
  );
};

// ================================================================
// SCREEN 3 — MATH CHECKPOINT PATH
// ================================================================
const MathPath = ({go, notImpl}) => {
  const SVG_H = 530;

  // Build smooth cubic-bezier path through all node centres
  let pathD = `M ${NODE_POS[0].cx} ${NODE_POS[0].cy}`;
  for (let i=1; i<NODE_POS.length; i++) {
    const p = NODE_POS[i-1], c = NODE_POS[i];
    const mx = (p.cx+c.cx)/2;
    pathD += ` C ${mx} ${p.cy-8}, ${mx} ${c.cy+8}, ${c.cx} ${c.cy}`;
  }

  const nodeVisual = (status) => {
    if (status==="done")    return {bg:"#6ACC7A",border:"#469856",icon:"✓",  iconSz:22};
    if (status==="current") return {bg:"#E07070",border:"#B04848",icon:"●",  iconSz:18};
    return                          {bg:"#8AB8C8",border:"#5A8898",icon:"🔒",iconSz:17};
  };

  return (
    <div style={{
      width:"100%",height:"100%",background:OCEAN,
      position:"relative",overflow:"hidden",
      display:"flex",flexDirection:"column",
    }}>
      <Bubbles/>
      <StatusBar/>

      {/* header */}
      <div style={{
        padding:"34px 20px 10px",
        display:"flex",alignItems:"center",gap:12,
        position:"relative",zIndex:2,
      }}>
        <KIcon onClick={()=>go("subjects")}/>
        <span style={{color:"#FFF",fontWeight:900,fontSize:16,letterSpacing:0.3}}>
          Math
        </span>
      </div>

      {/* path canvas */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <svg width={390} height={SVG_H} viewBox={`0 0 390 ${SVG_H}`}
          style={{position:"absolute",top:0,left:0}}>
          {/* tube shadow */}
          <path d={pathD} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={26}
            strokeLinecap="round" transform="translate(0,3)"/>
          {/* tube */}
          <path d={pathD} fill="none" stroke="#9EDAEA" strokeWidth={24}
            strokeLinecap="round"/>
          {/* centre shine */}
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={8}
            strokeLinecap="round" strokeDasharray="1 18"/>
        </svg>

        {/* node buttons */}
        {CHECKPOINTS.map((cp,i)=>{
          const {cx,cy} = NODE_POS[i];
          const v = nodeVisual(cp.status);
          return (
            <button key={cp.id}
              onClick={cp.status==="current"?()=>go("lessonIntro"):notImpl}
              style={{
                position:"absolute",left:cx,top:cy,
                transform:"translate(-50%,-50%)",
                width:54,height:54,borderRadius:"50%",
                background:v.bg,border:`4px solid ${v.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#FFF",fontSize:v.iconSz,fontWeight:900,
                cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 18px rgba(0,0,0,0.24)",
                zIndex:10,
              }}
            >
              {v.icon}
            </button>
          );
        })}

        <img src="coral.png" alt="" style={{
          position:"absolute",bottom:104,left:0,width:"100%",
          pointerEvents:"none",zIndex:1,
        }}/>
        <img src="starfish.png" alt="" style={{
          position:"absolute",bottom:118,left:18,width:54,
          pointerEvents:"none",zIndex:2,
        }}/>
      </div>

      {/* current lesson floating card */}
      <div style={{
        margin:"0 16px 48px",
        background:"linear-gradient(135deg,#D4AB32 0%,#A07A10 100%)",
        borderRadius:20,padding:"16px 18px",
        display:"flex",alignItems:"center",gap:14,
        boxShadow:"0 12px 32px rgba(0,0,0,0.28)",
        position:"relative",zIndex:20,
      }}>
        <div style={{
          width:46,height:46,
          background:"rgba(255,255,255,0.18)",
          borderRadius:14,
          display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,
        }}>
          <span style={{fontSize:22,fontWeight:900,color:"#FFF",fontStyle:"italic"}}>3+2</span>
        </div>
        <div style={{flex:1}}>
          <div style={{color:"rgba(255,255,255,0.72)",fontSize:10,fontWeight:800,letterSpacing:1}}>
            MATH
          </div>
          <div style={{color:"#FFF",fontWeight:900,fontSize:16,lineHeight:1.2,marginTop:1}}>
            Lesson 1.2
          </div>
          <div style={{color:"rgba(255,255,255,0.82)",fontSize:12,fontWeight:600,marginTop:2}}>
            Counting to 10
          </div>
        </div>
        <button onClick={()=>go("lessonIntro")} style={{
          width:44,height:44,
          background:"rgba(0,0,0,0.15)",
          borderRadius:"50%",border:"none",
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"#FFF",fontSize:22,fontWeight:700,cursor:"pointer",
        }}>›</button>
      </div>

      <HomeBar/>
    </div>
  );
};

// ================================================================
// SCREEN 4 — LESSON INTRO
// ================================================================
const LessonIntro = ({go}) => (
  <div style={{
    width:"100%",height:"100%",background:OCEAN,
    position:"relative",overflow:"hidden",
    display:"flex",flexDirection:"column",
  }}>
    <Bubbles/>
    <StatusBar/>

    <div style={{padding:"34px 20px 14px",position:"relative",zIndex:2}}>
      <button onClick={()=>go("mathPath")} style={{
        background:"rgba(0,0,0,0.15)",border:"none",
        borderRadius:10,padding:"8px 16px",
        color:"#FFF",fontWeight:700,fontSize:14,
        cursor:"pointer",fontFamily:"inherit",
      }}>
        &larr; Bumalik
      </button>
    </div>

    {/* card */}
    <div style={{
      margin:"0 18px",flex:1,
      background:"rgba(255,255,255,0.97)",
      borderRadius:24,padding:"22px 20px",
      position:"relative",zIndex:2,
      boxShadow:"0 16px 44px rgba(0,0,0,0.16)",
      overflow:"auto",
    }}>
      <span style={{
        display:"inline-block",
        background:"#C8A030",color:"#FFF",
        borderRadius:20,padding:"4px 16px",
        fontSize:11,fontWeight:800,
        marginBottom:14,letterSpacing:1.2,
      }}>MATH</span>

      <div style={{color:"#5A5A72",fontSize:13,fontWeight:700,marginBottom:4}}>
        Lesson 1.2
      </div>
      <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:26,marginBottom:14}}>
        Counting to 10
      </h2>
      <p style={{color:"#5A5A72",fontSize:14,lineHeight:1.7,marginBottom:20}}>
        Sa araling ito, matututunan natin kung paano magbilang mula 1 hanggang 10
        gamit ang mga bagay na makikita sa dagat.
      </p>

      <div style={{
        background:"#F0F9FF",borderRadius:16,padding:"16px",marginBottom:20,
      }}>
        <div style={{color:"#007A87",fontWeight:800,fontSize:11,letterSpacing:0.8,marginBottom:10}}>
          SA ARALING ITO MATUTUTUNAN MO:
        </div>
        {[
          "Magbilang ng mga bagay mula 1 hanggang 10",
          "Piliin ang tamang bilang para sa isang grupo",
          "Makilala kung alin ang mas marami o mas kaunti",
        ].map((it,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{color:"#007A87",fontWeight:900,fontSize:14,marginTop:1}}>•</span>
            <span style={{color:"#2A2A4A",fontSize:14,lineHeight:1.5}}>{it}</span>
          </div>
        ))}
      </div>

      <div style={{display:"flex",borderTop:"1px solid #EEE",paddingTop:16}}>
        {[{v:"5",l:"Tanong"},{v:"3",l:"Bituin"},{v:"~5",l:"Minuto"}].map((s,i)=>(
          <div key={i} style={{
            flex:1,textAlign:"center",
            borderRight:i<2?"1px solid #EEE":"none",
          }}>
            <div style={{fontWeight:900,fontSize:22,color:"#1C1C2E"}}>{s.v}</div>
            <div style={{fontSize:11,color:"#5A5A72",fontWeight:600,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{padding:"16px 18px 52px",position:"relative",zIndex:2}}>
      <button onClick={()=>go("exercise")} style={{
        width:"100%",
        background:"#F5B800",color:"#1C1C2E",
        border:"none",borderRadius:18,padding:"19px",
        fontWeight:900,fontSize:18,cursor:"pointer",
        fontFamily:"inherit",letterSpacing:0.5,
        boxShadow:"0 8px 24px rgba(0,0,0,0.18)",
        textTransform:"uppercase",
      }}>
        Simulan ang Aralin
      </button>
    </div>

    <img src="kiko-whale.png" alt="" style={{
      position:"absolute",bottom:48,right:-24,width:150,
      pointerEvents:"none",opacity:0.88,zIndex:1,
    }}/>
    <HomeBar/>
  </div>
);

// ================================================================
// SCREEN 5 — EXERCISE
// ================================================================
const ExerciseScreen = ({ex, qIdx, total, selected, answered, onAnswer}) => {
  const getBg = (opt) => {
    if (!answered) return "rgba(255,255,255,0.94)";
    if (opt===ex.ans) return "#6ACC7A";
    if (opt===selected) return "#E07070";
    return "rgba(255,255,255,0.65)";
  };
  const getBorder = (opt) => {
    if (!answered) return "3px solid transparent";
    if (opt===ex.ans) return "3px solid #469856";
    if (opt===selected) return "3px solid #B04848";
    return "3px solid transparent";
  };
  const getColor = (opt) => {
    if (!answered) return "#1C1C2E";
    if (opt===ex.ans||opt===selected) return "#FFF";
    return "#1C1C2E";
  };

  const correct = selected===ex.ans;

  return (
    <div style={{
      width:"100%",height:"100%",background:OCEAN,
      position:"relative",overflow:"hidden",
      display:"flex",flexDirection:"column",
    }}>
      <Bubbles/>
      <StatusBar/>

      {/* progress dots */}
      <div style={{padding:"34px 20px 12px",position:"relative",zIndex:2}}>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {Array.from({length:total}).map((_,i)=>(
            <div key={i} style={{
              flex:1,height:7,borderRadius:4,
              background:i<qIdx?"#6ACC7A":i===qIdx?"#F5B800":"rgba(255,255,255,0.28)",
              transition:"background 0.3s",
            }}/>
          ))}
        </div>
        <div style={{color:"rgba(255,255,255,0.72)",fontSize:12,fontWeight:700,textAlign:"right"}}>
          {qIdx+1} sa {total}
        </div>
      </div>

      {/* question */}
      <div style={{padding:"0 24px 14px",position:"relative",zIndex:2}}>
        <h2 style={{
          color:"#FFF",fontWeight:900,fontSize:22,
          textAlign:"center",textShadow:"0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {ex.q}
        </h2>
      </div>

      {/* object grid */}
      <div style={{
        margin:"0 20px 16px",
        background:"rgba(255,255,255,0.95)",
        borderRadius:22,padding:"18px 14px",
        display:"flex",flexWrap:"wrap",
        gap:6,justifyContent:"center",alignContent:"flex-start",
        minHeight:136,maxHeight:184,
        position:"relative",zIndex:2,
        boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
      }}>
        {Array.from({length:ex.count}).map((_,i)=>(
          <span key={i} style={{fontSize:30,lineHeight:1.3}}>{ex.emoji}</span>
        ))}
      </div>

      {/* answer buttons */}
      <div style={{
        padding:"0 20px",
        display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,
        position:"relative",zIndex:2,
      }}>
        {ex.opts.map(opt=>(
          <button key={opt} onClick={()=>onAnswer(opt)} disabled={answered} style={{
            background:getBg(opt),
            border:getBorder(opt),
            borderRadius:18,padding:"18px 0",
            fontSize:30,fontWeight:900,color:getColor(opt),
            cursor:answered?"default":"pointer",
            fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(0,0,0,0.12)",
            transition:"all 0.22s",
          }}>
            {opt}
          </button>
        ))}
      </div>

      {/* feedback banner */}
      {answered && (
        <div style={{
          margin:"14px 20px 0",padding:"13px 20px",
          borderRadius:16,
          background:correct?"rgba(106,204,122,0.95)":"rgba(224,112,112,0.95)",
          color:"#FFF",fontWeight:800,fontSize:15,
          textAlign:"center",position:"relative",zIndex:2,
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {correct
            ? "Tama! Napakagaling mo! 🎉"
            : `Hindi tama. Ang sagot ay ${ex.ans}. Kaya mo yan! 💪`}
        </div>
      )}

      <HomeBar/>
    </div>
  );
};

// ================================================================
// SCREEN 6 — RESULT
// ================================================================
const ResultScreen = ({score, total, go, notImpl}) => {
  const stars = score>=total ? 3 : score>=Math.ceil(total*0.6) ? 2 : 1;
  const msgs = [
    "Subukan mo ulit! Kaya mo ito! 💪",
    "Magaling! Patuloy ka lang! 🌊",
    "Perpekto! Ikaw ang Bayani ng Bilang! 🌟",
  ];
  const reactions = ["🦈💭","🦈👍","🦈✨"];

  return (
    <div style={{
      width:"100%",height:"100%",background:OCEAN,
      position:"relative",overflow:"hidden",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      padding:"0 22px",
    }}>
      <Bubbles/>
      <StatusBar/>

      {/* stars */}
      <div style={{display:"flex",gap:10,marginBottom:20,position:"relative",zIndex:2}}>
        {[1,2,3].map(i=>(
          <span key={i} style={{
            fontSize:52,transition:"all 0.3s",
            opacity:i<=stars?1:0.22,
            filter:i<=stars?"drop-shadow(0 4px 8px rgba(245,184,0,0.55))":"none",
          }}>⭐</span>
        ))}
      </div>

      {/* result card */}
      <div style={{
        background:"rgba(255,255,255,0.97)",
        borderRadius:24,padding:"26px 22px",
        width:"100%",textAlign:"center",
        boxShadow:"0 20px 52px rgba(0,0,0,0.20)",
        position:"relative",zIndex:2,
      }}>
        <div style={{color:"#007A87",fontWeight:800,fontSize:11,letterSpacing:1,marginBottom:10}}>
          RESULTA
        </div>
        <h2 style={{color:"#1C1C2E",fontWeight:900,fontSize:24,marginBottom:8}}>
          {score} sa {total} ang tama!
        </h2>
        <p style={{color:"#5A5A72",fontSize:15,lineHeight:1.65,marginBottom:20}}>
          {msgs[stars-1]}
        </p>

        <div style={{fontSize:58,marginBottom:22}}>{reactions[stars-1]}</div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <button onClick={()=>go("exercise")} style={{
            background:"#007A87",color:"#FFF",border:"none",
            borderRadius:16,padding:"16px",fontWeight:800,fontSize:16,
            cursor:"pointer",fontFamily:"inherit",width:"100%",
          }}>
            Subukan Ulit
          </button>
          <button onClick={notImpl} style={{
            background:"#F5B800",color:"#1C1C2E",border:"none",
            borderRadius:16,padding:"16px",fontWeight:800,fontSize:16,
            cursor:"pointer",fontFamily:"inherit",width:"100%",
          }}>
            Susunod na Aralin
          </button>
          <button onClick={()=>go("subjects")} style={{
            background:"transparent",color:"#5A5A72",
            border:"2px solid #DDD",borderRadius:16,padding:"14px",
            fontWeight:700,fontSize:14,cursor:"pointer",
            fontFamily:"inherit",width:"100%",
          }}>
            Bumalik sa mga Paksa
          </button>
        </div>
      </div>

      <HomeBar/>
    </div>
  );
};

// ================================================================
// MAIN APP
// ================================================================
export default function KikoApp() {
  const [screen, setScreen]       = useState("splash");
  const [modal,  setModal]        = useState(false);
  const [qIdx,   setQIdx]         = useState(0);
  const [selected, setSelected]   = useState(null);
  const [answered, setAnswered]   = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const answers = useRef([]);

  const notImpl = () => setModal(true);

  const go = (s) => {
    setScreen(s);
    if (s==="exercise") {
      setQIdx(0);
      setSelected(null);
      setAnswered(false);
      answers.current = [];
    }
  };

  const handleAnswer = (opt) => {
    if (answered) return;
    answers.current[qIdx] = opt;
    setSelected(opt);
    setAnswered(true);

    setTimeout(()=>{
      if (qIdx+1 < EXERCISES.length) {
        setQIdx(i=>i+1);
        setSelected(null);
        setAnswered(false);
      } else {
        const sc = answers.current.filter((a,i)=>a===EXERCISES[i].ans).length;
        setFinalScore(sc);
        setScreen("result");
      }
    }, 1350);
  };

  return (
    <div style={{
      minHeight:"100vh",
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"#0D1B2A",padding:20,
      fontFamily:"'Nunito', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button { font-family:'Nunito',system-ui,sans-serif; }
        button:not(:disabled):active { transform:scale(0.96); transition:transform 0.08s; }
      `}</style>

      {/* Android phone shell */}
      <div style={{
        width:390,height:820,
        borderRadius:46,overflow:"hidden",
        boxShadow:"0 40px 100px rgba(0,0,0,0.65), 0 0 0 2px #555, 0 0 0 9px #1E1E1E, 0 0 0 11px #333",
        position:"relative",flexShrink:0,
      }}>
        {screen==="splash"       && <Splash go={go}/>}
        {screen==="subjects"     && <Subjects go={go} notImpl={notImpl}/>}
        {screen==="mathPath"     && <MathPath go={go} notImpl={notImpl}/>}
        {screen==="lessonIntro"  && <LessonIntro go={go}/>}
        {screen==="exercise"     && (
          <ExerciseScreen
            ex={EXERCISES[qIdx]}
            qIdx={qIdx}
            total={EXERCISES.length}
            selected={selected}
            answered={answered}
            onAnswer={handleAnswer}
          />
        )}
        {screen==="result" && (
          <ResultScreen
            score={finalScore}
            total={EXERCISES.length}
            go={go}
            notImpl={notImpl}
          />
        )}
        {modal && <NotImplModal onClose={()=>setModal(false)}/>}
      </div>
    </div>
  );
}
