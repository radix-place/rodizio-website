// js/rodizio-anim.js (responsive + orden de capas corregido)
(() => {
  // -------- util --------
  const onReady = (fn) =>
    (document.readyState === "loading")
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const TAU=Math.PI*2;
  const rr=(a,b)=>a+Math.random()*(b-a);
  const norm=v=>{const L=Math.hypot(v.x,v.y)||1;return{x:v.x/L,y:v.y/L};};
  const easeInOutCubic=x=>{x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
  const smoothstep=(e0,e1,x)=>{x=clamp((x-e0)/Math.max(1e-6,e1-e0),0,1);return x*x*(3-2*x);};

  // -------- parámetros base (igual que en Processing) --------
  let W=600,H=600;
  let R_BASE=70, R=R_BASE;
  const SAMPLES=600;

  const gielis={a:1,b:1,m:18,n1:.10,n2:3.5,n3:2.0};
  let s=0, sSpeed=.5, finished=false;

  const strokeAlphaEdge=20, petalFillAlpha=25;
  const featherPasses=2, featherMaxW=5, featherAlpha=1.4;

  const centerHue=55, centerSat=90, centerBri=100;
  let centerRadiusBase; // depende de R (se recalcula)

  const EPS=1e-6; let fitScale=1, fitMargin=.95, phi0=0;

  const PHI=(1+Math.sqrt(5))/2;
  const GOLDEN_ANGLE = TAU*(1-1/PHI);
  let ROTACIONES=2, ALPHA_DECAY=.82;
  let phases=[], layerAlphaMul=[];

  // Texto fijo
  const TAGLINE = "Celebra el amor y la amistad en";
  let taglineSizeBase=26, taglineSize=26;
  let taglineAlpha=0, logoReveal=0;
  const taglineDelay=.40, logoDelay=1.00;
  const taglineFadeSpeed=1.2, logoRevealSpeed=1.0;
  const logoImg=new Image(); logoImg.src="imagenes/logoLETRERO.png";

  const Y_SHIFT=-100;

  // Semillas
  const ENABLE_SEEDS=true, MAX_SEEDS=90, SEEDS_PER_SEC=14, SEEDS_START_DELAY=.8;
  const SEED_LIFE_MIN=5, SEED_LIFE_MAX=9, SEED_SCALE_MIN=.8, SEED_SCALE_MAX=1.4;
  const LAUNCH_SPEED=30;
  const WIND_DIR=norm({x:1,y:-.2});
  const WIND_SPEED=30, NOISE_SPEED=.55, NOISE_MAG=50, AIR_DRAG=.08;
  const seeds=[]; let spawnAcc=0;

  // Deriva + rebote
  const HEAD_DRIFT=true, HEAD_BOUNCE=true;
  const BOUNCE_RESTITUTION=.92, HEAD_SPEED=.35;
  let headOffset={x:0,y:0}, headVel={x:110,y:-90};

  // RODIZIO (todas a la vez)
  const ROD_SPAWN=['O','I','Z','I','D','O','R']; // abajo→arriba (se lee arriba→abajo)
  let ROD_FONT_SIZE_BASE=48, ROD_FONT_SIZE=48;
  const ROD_LETTER_SPACING_MUL=1.05;
  let ROD_COL_X_BASE=34, ROD_COL_X=34;
  let ROD_I_SHIFT_BASE=1, ROD_I_SHIFT=1;
  let ROD_BASE_Y_OFFSET_BASE=65, ROD_BASE_Y_OFFSET=65;

  let rodBottomY=0, rodizioStarted=false, rodizioFinished=false;
  const rodLetters=[];

  // Corazones (post-1er rebote)
  const ENABLE_HEARTS=true, MAX_HEARTS=30, HEARTS_PER_SEC=8;
  const HEART_SPEED_MIN=50, HEART_SPEED_MAX=120;
  const HEART_SIZE_MIN=12, HEART_SIZE_MAX=28;
  const HEART_ROT_MIN=-.8, HEART_ROT_MAX=.8;
  const HEART_SWAY_AMP=25, HEART_SWAY_SPEED=2.0;
  const hearts=[]; let heartSpawnAcc=0, heartsStarted=false;

  // Tiempo / canvas
  let lastT=0, finishedAt=-1;
  let canvas=null, ctx=null, animStarted=false;

  // -------- responsive UI --------
  function syncResponsive(){
    // escala general 0.6–1.0 en función del ancho
    const ui = clamp(W/600, 0.6, 1.0);

    R = R_BASE * ui;
    centerRadiusBase = R * 0.05;

    taglineSize = Math.round(taglineSizeBase * ui);

    ROD_FONT_SIZE = Math.max(24, Math.round(ROD_FONT_SIZE_BASE * ui));
    ROD_I_SHIFT   = ROD_I_SHIFT_BASE * ui;
    ROD_COL_X     = Math.max(18, Math.round(Math.min(ROD_COL_X_BASE*ui, W*0.08))); // pega más al borde si es chico
    ROD_BASE_Y_OFFSET = Math.round(ROD_BASE_Y_OFFSET_BASE * ui);

    alignPetalUp(); updateFitScale(); rebuildPhases();
  }

  // -------- setup canvas --------
  function setupCanvas(cnv){
    const DPR=window.devicePixelRatio||1;
    const cssW = cnv.clientWidth || cnv.width  || 600;
    const cssH = cnv.clientHeight|| cnv.height || 600;
    cnv.width=Math.round(cssW*DPR); cnv.height=Math.round(cssH*DPR);
    W=cssW; H=cssH;

    const c=cnv.getContext("2d");
    c.setTransform(DPR,0,0,DPR,0,0);
    c.imageSmoothingEnabled=true;

    syncResponsive();
    return c;
  }

  // -------- Gielis helpers --------
  function alignPetalUp(){ phi0 = -Math.PI/(2.0*gielis.m); }
  function rebuildPhases(){
    const L=2*ROTACIONES+1; phases=new Array(L); layerAlphaMul=new Array(L);
    let idx=0; for(let k=-ROTACIONES;k<=ROTACIONES;k++){
      phases[idx]=k*GOLDEN_ANGLE; layerAlphaMul[idx]=Math.pow(ALPHA_DECAY,Math.abs(k)); idx++;
    }
  }
  function gielisSafe(phi){
    const {a,b,m,n1,n2,n3}=gielis;
    const ca=Math.abs(Math.cos(m*phi/4)/Math.max(EPS,a));
    const sa=Math.abs(Math.sin(m*phi/4)/Math.max(EPS,b));
    const t1=Math.pow(Math.max(EPS,ca),n2);
    const t2=Math.pow(Math.max(EPS,sa),n3);
    const d =Math.pow(Math.max(EPS,t1+t2), 1/Math.max(EPS,n1));
    return 1/Math.max(EPS,d);
  }
  function updateFitScale(){
    const S=1024; let rMax=0;
    for(let i=0;i<S;i++){
      const ang=TAU*i/S, r=gielisSafe(ang+phi0);
      if(Number.isFinite(r)) rMax=Math.max(rMax,r);
    }
    if (rMax<EPS) rMax=1;
    fitScale=(R*fitMargin)/rMax;
  }
  const morphedPointPhase=(ang,extra)=>{const rG=gielisSafe(ang+phi0+extra)*fitScale; const rr=lerp(R,rG,s); return {x:rr*Math.cos(ang),y:rr*Math.sin(ang)};}
  const finalPoint=(ang,extra)=>{const rG=gielisSafe(ang+phi0+extra)*fitScale; const rr=lerp(R,rG,1); return {x:rr*Math.cos(ang),y:rr*Math.sin(ang)};}

  // -------- draw helpers --------
  function drawCenterGlow(ctx,r,alphaBase,rings){
    ctx.save();
    for(let i=rings;i>=1;i--){
      const rr=r*i/rings, a=alphaBase*(i/rings), sat=lerp(centerSat,40,(i-1)/(rings-1));
      ctx.fillStyle=`hsla(${centerHue},${sat}%,${centerBri}%,${a/100})`;
      ctx.beginPath(); ctx.arc(0,0,rr,0,TAU); ctx.fill();
    }
    ctx.restore();
  }

  // -------- RODIZIO --------
  function computeRodizioTargets(center){
    // base cerca del letrero
    const yBelow = center.y + R + 22;
    const bottomSafe = 40, topSafe = 20;

    // posición inicial tentativa
    let bottom = Math.min(H - bottomSafe, yBelow + ROD_BASE_Y_OFFSET);

    // asegurar que la columna cabe verticalmente; si no, reducimos fuente
    const spacingAt = (f)=> f * ROD_LETTER_SPACING_MUL;
    let fsize = ROD_FONT_SIZE;
    const needed = (f)=> spacingAt(f) * (ROD_SPAWN.length - 1);
    while (bottom - needed(fsize) < topSafe && fsize > 22){
      fsize -= 1;
    }
    ROD_FONT_SIZE = Math.round(fsize);
    rodBottomY = bottom;
  }

  function startRodizio(center){
    rodizioStarted=true; rodizioFinished=false;
    rodLetters.length=0;

    // corazones tras primer rebote
    heartsStarted=true; heartSpawnAcc=0; hearts.length=0;

    computeRodizioTargets(center);
    const spacing = ROD_FONT_SIZE * ROD_LETTER_SPACING_MUL;

    for (let i=0;i<ROD_SPAWN.length;i++){
      rodLetters.push({
        ch: ROD_SPAWN[i],
        x: ROD_COL_X, y: -60,
        targetY: rodBottomY - i*spacing,
        speed: 130, settled:false
      });
    }
  }

  // -------- semillas --------
  const makeSeed=(pos,vel,scale,life)=>({pos:{...pos},vel:{...vel},scale,life,age:0,rot:Math.random()*TAU,rotVel:rr(-2,2),nseed:Math.random()*1000,alive:true});
  function updateSeed(sd,dt){
    sd.age+=dt; if(sd.age>sd.life){sd.alive=false;return;}
    const wind={x:WIND_DIR.x*WIND_SPEED,y:WIND_DIR.y*WIND_SPEED};
    const angN=TAU*Math.sin(sd.nseed+sd.age*NOISE_SPEED);
    const noiseVec={x:Math.cos(angN)*NOISE_MAG,y:Math.sin(angN)*NOISE_MAG};
    sd.vel.x+=(wind.x+noiseVec.x)*dt; sd.vel.y+=(wind.y+noiseVec.y)*dt;
    sd.vel.x*=(1-AIR_DRAG*dt); sd.vel.y*=(1-AIR_DRAG*dt);
    sd.pos.x+=sd.vel.x*dt; sd.pos.y+=sd.vel.y*dt;
    sd.rot+=sd.rotVel*dt;
    const M=80; if(sd.pos.x<-M||sd.pos.x>W+M||sd.pos.y<-M||sd.pos.y>H+M) sd.alive=false;
  }
  function drawSeed(ctx,sd){
    const t=sd.age/sd.life, alpha=1.0-smoothstep(.80,1.00,t), L=10*sd.scale, T=4*sd.scale;
    let fwd={x:sd.vel.x,y:sd.vel.y}; const fl=Math.hypot(fwd.x,fwd.y);
    if(fl<1e-3) fwd={x:Math.cos(sd.rot),y:Math.sin(sd.rot)}; else { fwd.x/=fl; fwd.y/=fl; }
    const base={x:sd.pos.x-fwd.x*L,y:sd.pos.y-fwd.y*L}, ort={x:-fwd.y,y:fwd.x};
    const rays=8;
    ctx.save(); ctx.strokeStyle=`hsla(0,0%,100%,${.90*alpha})`; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(base.x,base.y); ctx.lineTo(sd.pos.x,sd.pos.y); ctx.stroke();
    for(let i=0;i<rays;i++){
      const th=TAU*i/rays, dir=norm({x:fwd.x*Math.cos(th)+ort.x*Math.sin(th),y:fwd.y*Math.cos(th)+ort.y*Math.sin(th)});
      const p2={x:sd.pos.x+dir.x*T,y:sd.pos.y+dir.y*T};
      ctx.beginPath(); ctx.moveTo(sd.pos.x,sd.pos.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
    }
    ctx.restore();
  }

  // -------- corazones --------
  const makeHeart=(p0,v0,sizePx)=>({pos:{...p0},vel:{...v0},sizePx,rot:Math.random()*TAU,rotVel:rr(HEART_ROT_MIN,HEART_ROT_MAX),swayPhase:Math.random()*TAU,hue:(Math.random()*35+340)%360,sat:rr(70,95),light:rr(60,70),alpha:rr(.7,.95),age:0,alive:true});
  function updateHeart(h,dt){
    h.age+=dt; h.pos.x+=h.vel.x*dt; h.pos.y+=h.vel.y*dt;
    h.pos.x+=Math.sin(h.age*HEART_SWAY_SPEED+h.swayPhase)*HEART_SWAY_AMP*dt;
    h.rot+=h.rotVel*dt; const M=100; if(h.pos.x<-M||h.pos.x>W+M||h.pos.y>H+M) h.alive=false;
  }
  function drawHeart(ctx,h){
    ctx.save(); ctx.translate(h.pos.x,h.pos.y); ctx.rotate(h.rot); const sc=h.sizePx/30; ctx.scale(sc,sc);
    ctx.fillStyle=`hsla(${h.hue},${h.sat}%,${h.light}%,${h.alpha})`;
    ctx.beginPath();
    for(let t=0;t<=TAU+0.001;t+=0.08){
      const x=16*Math.pow(Math.sin(t),3);
      const y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
      if(t===0) ctx.moveTo(x,-y); else ctx.lineTo(x,-y);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // -------- frame --------
  function drawFrame(ctx, tNow){
    const now=tNow/1000, dt=Math.max(.001, lastT ? (now-lastT) : .016); lastT=now;

    ctx.clearRect(0,0,W,H); ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);

    if(!finished){ s+=sSpeed*dt; if(s>=1){s=1; finished=true; finishedAt=now;} }
    const k=easeInOutCubic(clamp(s,0,1));
    const center={x:W/2,y:H/2+Y_SHIFT};

    if(finished && HEAD_DRIFT){
      headOffset.x+=headVel.x*dt*HEAD_SPEED; headOffset.y+=headVel.y*dt*HEAD_SPEED;
      if(HEAD_BOUNCE){
        const rad=R*fitMargin; const p={x:center.x+headOffset.x,y:center.y+headOffset.y};
        let bounced=false;
        if(p.x<rad){p.x=rad; headVel.x=Math.abs(headVel.x)*BOUNCE_RESTITUTION; bounced=true;}
        if(p.x>W-rad){p.x=W-rad; headVel.x=-Math.abs(headVel.x)*BOUNCE_RESTITUTION; bounced=true;}
        if(p.y<rad){p.y=rad; headVel.y=Math.abs(headVel.y)*BOUNCE_RESTITUTION; bounced=true;}
        if(p.y>H-rad){p.y=H-rad; headVel.y=-Math.abs(headVel.y)*BOUNCE_RESTITUTION; bounced=true;}
        headOffset.x=p.x-center.x; headOffset.y=p.y-center.y;
        if(bounced && !rodizioStarted) startRodizio(center);
      }
    }

    // flor
    ctx.save(); ctx.translate(center.x+headOffset.x, center.y+headOffset.y);
    const dphi=TAU/SAMPLES;

    // relleno
    for(let L=0;L<phases.length;L++){
      const phase=phases[L];
      ctx.fillStyle=`hsla(0,0%,100%,${(lerp(0,petalFillAlpha,k)*layerAlphaMul[L])/100})`;
      ctx.beginPath();
      for(let i=0;i<=SAMPLES;i++){
        const t=i*dphi, p=morphedPointPhase(t,phase);
        if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
      }
      ctx.closePath(); ctx.fill();
    }
    // feather
    for(let pass=featherPasses; pass>=1; pass--){
      const w=lerp(1.2,featherMaxW,(pass-1)/(featherPasses-1));
      const a=lerp(0,featherAlpha,k)*(pass/featherPasses);
      ctx.lineWidth=w; ctx.strokeStyle=`hsla(0,0%,100%,${a/100})`;
      for(let L=0;L<phases.length;L++){
        const phase=phases[L];
        ctx.beginPath();
        let p1=morphedPointPhase(0,phase); ctx.moveTo(p1.x,p1.y);
        for(let i=1;i<=SAMPLES;i++){ const p2=morphedPointPhase(i*dphi,phase); ctx.lineTo(p2.x,p2.y); }
        ctx.stroke();
      }
    }
    // borde
    ctx.lineWidth=2.4;
    for(let L=0;L<phases.length;L++){
      const phase=phases[L];
      ctx.strokeStyle=`hsla(0,0%,100%,${(lerp(0,strokeAlphaEdge,k)*layerAlphaMul[L])/100})`;
      ctx.beginPath();
      for(let i=0;i<=SAMPLES;i++){ const p=morphedPointPhase(i*dphi,phase); if(i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }
      ctx.stroke();
    }
    // centro
    const appear=smoothstep(.25,.75,k);
    if(appear>0.001){ const rEff=centerRadiusBase*(.6+.4*appear); drawCenterGlow(ctx,rEff,15*appear,10); }
    ctx.restore();

    // CORAZONES (antes del tagline para no tapar texto)
    if(ENABLE_HEARTS && heartsStarted){
      heartSpawnAcc += (1/60)*HEARTS_PER_SEC;
      while(heartSpawnAcc>=1 && hearts.length<MAX_HEARTS){
        heartSpawnAcc-=1;
        const mode=(Math.random()*3)|0;
        const speed=rr(HEART_SPEED_MIN,HEART_SPEED_MAX);
        const size=rr(HEART_SIZE_MIN,HEART_SIZE_MAX);
        let p0,v0;
        if(mode===0){ p0={x:rr(0,W),y:rr(-80,-20)}; v0={x:rr(-10,10),y:speed}; }
        else if(mode===1){ p0={x:-20,y:rr(0,H*.4)}; v0={x:rr(30,70),y:speed*.7}; }
        else{ p0={x:W+20,y:rr(0,H*.4)}; v0={x:rr(-70,-30),y:speed*.7}; }
        hearts.push(makeHeart(p0,v0,size));
      }
      for(let i=hearts.length-1;i>=0;i--){ const h=hearts[i]; updateHeart(h,1/60); drawHeart(ctx,h); if(!h.alive) hearts.splice(i,1); }
    }

    // RODIZIO (dibujado ANTES del tagline para que el texto quede encima)
    ctx.save();
    ctx.textAlign="center"; ctx.textBaseline="top";
    ctx.font=`bold ${ROD_FONT_SIZE}px Sans-Serif`;
    ctx.fillStyle="hsl(50, 90%, 50%)";
    for(const L of rodLetters){
      if(!L.settled){ L.y += L.speed*(1/60); if(L.y>=L.targetY){L.y=L.targetY; L.settled=true;} }
      const kx = (L.ch==='I') ? ROD_I_SHIFT : 0;
      ctx.fillText(L.ch, ROD_COL_X + kx, L.y);
    }
    ctx.restore();

    // Tagline + logo (siempre por encima)
    if(finished){
      const tSince=now-finishedAt;
      if(tSince>=taglineDelay) taglineAlpha=Math.min(1, taglineAlpha+taglineFadeSpeed*(1/60));
      if(tSince>=logoDelay)    logoReveal =Math.min(1, logoReveal +logoRevealSpeed *(1/60));

      const yBelow=(H/2+Y_SHIFT)+R+22;
      ctx.save();
      ctx.fillStyle=`hsla(0,0%,100%,${taglineAlpha})`;
      ctx.textAlign="center"; ctx.textBaseline="top";
      ctx.font=`${taglineSize}px Sans-Serif`;
      ctx.fillText(TAGLINE, W/2, yBelow);
      ctx.restore();

      if(logoImg.complete && logoImg.naturalWidth){
        const targetW=W*.62; const wFull=Math.min(targetW,logoImg.naturalWidth);
        const hFull=wFull*(logoImg.naturalHeight/logoImg.naturalWidth);
        const yTop=yBelow+36, hVis=hFull*logoReveal, dy=yTop+(hFull-hVis);
        if(hVis>1){
          ctx.save(); ctx.beginPath(); ctx.rect(W/2-wFull/2,dy,wFull,hVis); ctx.clip();
          ctx.drawImage(logoImg, W/2-wFull/2, yTop, wFull, hFull); ctx.restore();
        }
      }
    }

    // Semillas
    if(ENABLE_SEEDS && finished){
      const tSince=now-finishedAt;
      if(tSince>=SEEDS_START_DELAY && seeds.length<MAX_SEEDS){
        spawnAcc += (1/60)*SEEDS_PER_SEC;
        while(spawnAcc>=1 && seeds.length<MAX_SEEDS){
          spawnAcc-=1;
          const ang=Math.random()*TAU, phase=phases[(Math.random()*phases.length)|0];
          const local=finalPoint(ang,phase);
          const headWorld={x:W/2+headOffset.x, y:H/2+Y_SHIFT+headOffset.y};
          const world={x:headWorld.x+local.x, y:headWorld.y+local.y};
          let dir={x:local.x,y:local.y}; const l=Math.hypot(dir.x,dir.y);
          if(l<1e-4) dir={x:1,y:0}; else { dir.x/=l; dir.y/=l; }
          const v0={x:dir.x*(LAUNCH_SPEED+rr(-8,8)), y:dir.y*(LAUNCH_SPEED+rr(-8,8))};
          seeds.push(makeSeed(world, v0, rr(SEED_SCALE_MIN,SEED_SCALE_MAX), rr(SEED_LIFE_MIN,SEED_LIFE_MAX)));
        }
      }
      for(let i=seeds.length-1;i>=0;i--){ const sd=seeds[i]; updateSeed(sd,1/60); drawSeed(ctx,sd); if(!sd.alive) seeds.splice(i,1); }
    }

    requestAnimationFrame(t=>drawFrame(ctx,t));
  }

  // -------- init + modal --------
  function initIfNeeded(){
    if(animStarted) return;
    canvas=document.getElementById("rodizio-canvas"); if(!canvas) return;
    ctx=setupCanvas(canvas);
    window.addEventListener("resize", ()=>{ if(canvas){ ctx=setupCanvas(canvas); } });
    animStarted=true; requestAnimationFrame(t=>drawFrame(ctx,t));
  }

  function openModal(){
    onReady(()=>{
      const modal=document.getElementById("modal-rodizio"); if(!modal) return;
      modal.style.display="flex"; modal.setAttribute("aria-hidden","false");
      const closeBtn=document.getElementById("rodizio-close");
      if(closeBtn && !closeBtn.__rodBound){ closeBtn.__rodBound=true; closeBtn.addEventListener("click", closeModal); }
      if(!modal.__rodBound){
        modal.__rodBound=true;
        modal.addEventListener("click",(e)=>{ if(e.target===modal) closeModal(); });
        document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
      }
      initIfNeeded(); requestAnimationFrame(()=>{ if(canvas) ctx=setupCanvas(canvas); });
    });
  }
  function closeModal(){
    const modal=document.getElementById("modal-rodizio"); if(!modal) return;
    modal.style.display="none"; modal.setAttribute("aria-hidden","true");
  }

  window.RodizioModal={ open:openModal, close:closeModal };
})();
