// /js/rodizio-modal.js
(() => {
  // Exponer API simple
  window.RodizioModal = { open, close };

  let canvas, ctx, DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 600, H = 600;

  // === Parámetros "Processing-like" ===
  const R = 120, SAMPLES = 600;
  let a=1, b=1, m=18, n1=0.10, n2=3.5, n3=2.0;

  // morph círculo -> flor
  let s = 0, sSpeed = 0.5, finished = false;

  // pétalos
  const strokeAlphaEdge = 20, petalFillAlpha = 25;
  const featherPasses = 2, featherMaxW = 5, featherAlpha = 1.4;

  // centro
  const centerHue=55, centerSat=90, centerBri=100;
  const centerRadiusBase = R*0.05, centerRings=10, centerAlpha=15;

  // fit
  const EPS = 1e-6; let fitScale=1, fitMargin=0.95, phi0=0;

  // capas áureas
  const PHI=(1+Math.sqrt(5))/2;
  const GOLDEN_ANGLE = Math.PI*2*(1-1/PHI);
  let ROTACIONES=2, ALPHA_DECAY=0.82;
  let phases=[], layerAlphaMul=[];
  rebuildPhases();

  // frase + (opcional) logo
  const tagline = "Celebra el amor y la amistad en";
  const taglineSize = 26;
  let taglineAlpha=0, logoReveal=0;
  const taglineDelay=0.40, logoDelay=1.00;
  const taglineFadeSpeed=1.2, logoRevealSpeed=1.0;
  const logoUrl = "imagenes/logoLETRERO.svg"; // opcional
  let logoImg=null; (function(){ const i=new Image(); i.onload=()=>logoImg=i; i.src=logoUrl; })();

  // desplazamiento global
  const Y_SHIFT = -100;

  // semillas
  const ENABLE_SEEDS=true, MAX_SEEDS=90;
  const SEEDS_PER_SEC=14, SEEDS_START_DELAY=0.8;
  const SEED_LIFE_MIN=5, SEED_LIFE_MAX=9;
  const SEED_SCALE_MIN=0.8, SEED_SCALE_MAX=1.4;
  const LAUNCH_SPEED=30, WIND_DIR=norm({x:1,y:-0.2});
  const WIND_SPEED=30, NOISE_SPEED=0.55, NOISE_MAG=50, AIR_DRAG=0.08;
  let seeds=[], spawnAcc=0;

  // deriva + rebote
  const HEAD_DRIFT=true, HEAD_BOUNCE=true;
  const BOUNCE_RESTITUTION=0.92, HEAD_SPEED=0.35;
  let headOffset={x:0,y:0}, headVel={x:110,y:-90};

  // RODIZIO (todas a la vez)
  const ROD_CHARS = ['O','I','Z','I','D','O','R']; // abajo→arriba
  const ROD_FONT_SIZE=46;
  const ROD_FALL_SPEED=130;
  const ROD_LETTER_SPACING_MUL=1.05;
  const ROD_COL_X = 34;     // centro columna izquierda
  const ROD_I_SHIFT = 1;    // "I" un poco a la derecha
  const ROD_BASE_Y_OFFSET=65;

  let rodLetters=[], rodBottomY=0, rodizioStarted=false, rodizioFinished=false;

  // control tiempo
  let lastT=0, finishedAt=-1, running=false;

  function open(){
    const modal = document.getElementById('modal-rodizio');
    const closeBtn = document.getElementById('rodizio-close');
    canvas = document.getElementById('rodizio-canvas');
    if (!modal || !canvas) return;

    ctx = canvas.getContext('2d', { alpha:true });
    resizeCanvas();

    closeBtn.onclick = close;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');

    resetState();
    running = true;
    lastT = performance.now();
    requestAnimationFrame(tick);

    window.addEventListener('resize', resizeCanvas);
  }

function close(){
  const modal = document.getElementById('modal-rodizio');
  if (modal){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }
  running = false;
  window.removeEventListener('resize', resizeCanvas);

  // ⬇️ avisa al resto de la página que se cerró
  window.dispatchEvent(new CustomEvent('rodizio:closed'));
}

  function resetState(){
    s = 0; finished=false; taglineAlpha=0; logoReveal=0;
    headOffset={x:0,y:0}; headVel={x:110,y:-90};
    seeds.length=0; spawnAcc=0;
    rodLetters.length=0; rodizioStarted=false; rodizioFinished=false;
    finishedAt = -1;
    updateFitScale();
  }

  function resizeCanvas(){
    const cssW = Math.min(520, canvas.clientWidth || W);
    const ratio = cssW / W;
    canvas.style.height = `${H*ratio}px`;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function tick(now){
    if (!running) return;
    const dt = Math.max(0.001, (now - lastT)/1000);
    lastT = now;

    // fondo
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,W,H);

    // morph
    if (!finished){
      s += sSpeed * dt;
      if (s>=1){ s=1; finished=true; finishedAt=now/1000; }
    }
    const k = easeInOutCubic(clamp01(s));

    const center = { x: W/2, y: H/2 + Y_SHIFT };

    // deriva + rebote
    if (finished && HEAD_DRIFT){
      headOffset.x += headVel.x * dt * HEAD_SPEED;
      headOffset.y += headVel.y * dt * HEAD_SPEED;

      if (HEAD_BOUNCE){
        const rad = R * fitMargin;
        const p = { x: center.x + headOffset.x, y: center.y + headOffset.y };
        let bounced = false;
        if (p.x < rad){ p.x=rad; headVel.x = Math.abs(headVel.x)*BOUNCE_RESTITUTION; bounced=true; }
        if (p.x > W-rad){ p.x=W-rad; headVel.x = -Math.abs(headVel.x)*BOUNCE_RESTITUTION; bounced=true; }
        if (p.y < rad){ p.y=rad; headVel.y = Math.abs(headVel.y)*BOUNCE_RESTITUTION; bounced=true; }
        if (p.y > H-rad){ p.y=H-rad; headVel.y = -Math.abs(headVel.y)*BOUNCE_RESTITUTION; bounced=true; }
        headOffset.x = p.x - center.x;
        headOffset.y = p.y - center.y;

        if (bounced && !rodizioStarted) startRodizio();
      }
    }

    // === Cabezal ===
    ctx.save();
    ctx.translate(center.x + headOffset.x, center.y + headOffset.y);
    const dphi = (Math.PI*2)/SAMPLES;

    // pétalos (relleno)
    for (let L=0; L<phases.length; L++){
      const phase = phases[L];
      ctx.fillStyle = rgbaHSB(0,0,100, lerp(0,petalFillAlpha,k)*layerAlphaMul[L]);
      ctx.beginPath();
      for (let i=0; i<=SAMPLES; i++){
        const t = i*dphi;
        const p = morphedPointPhase(t, phase);
        if (i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // feather
    for (let pass=featherPasses; pass>=1; pass--){
      const w = map(pass,1,featherPasses,1.2,featherMaxW);
      const a = lerp(0,featherAlpha,k) * (pass/featherPasses);
      for (let L=0; L<phases.length; L++){
        ctx.lineWidth = w;
        ctx.strokeStyle = rgbaHSB(0,0,100, a*layerAlphaMul[L]);
        const phase = phases[L];
        ctx.beginPath();
        let p1 = morphedPointPhase(0, phase);
        ctx.moveTo(p1.x, p1.y);
        for (let i=1; i<=SAMPLES; i++){
          const p2 = morphedPointPhase(i*dphi, phase);
          ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
      }
    }

    // borde
    for (let L=0; L<phases.length; L++){
      const phase = phases[L];
      for (let i=0; i<SAMPLES; i++){
        const t0=(i-1)*dphi, t1=i*dphi, t2=(i+1)*dphi;
        const p0 = morphedPointPhase(t0, phase);
        const pA = morphedPointPhase(t1, phase);
        const pB = morphedPointPhase(t2, phase);
        const v1 = {x:pA.x-p0.x, y:pA.y-p0.y};
        const v2 = {x:pB.x-pA.x, y:pB.y-pA.y};
        const ang = angleBetween(v1,v2);
        const w = 1.2 + 2.2 * clamp01(ang/0.30);
        ctx.lineWidth = w;
        ctx.strokeStyle = rgbaHSB(0,0,100, lerp(0,strokeAlphaEdge,k)*layerAlphaMul[L]);
        ctx.beginPath();
        ctx.moveTo(pA.x,pA.y); ctx.lineTo(pB.x,pB.y); ctx.stroke();
      }
    }

    // centro
    const appear = smoothstep(0.25,0.75,k);
    if (appear>0.001){
      const rEff = centerRadiusBase * (0.6 + 0.4*appear);
      drawCenterGlow(rEff, centerAlpha*appear, centerRings);
    }
    ctx.restore();

    // === Letreros fijos ===
    if (finished){
      const tSince = now/1000 - finishedAt;
      if (tSince>=taglineDelay) taglineAlpha = Math.min(1, taglineAlpha + taglineFadeSpeed*dt);
      if (tSince>=logoDelay)    logoReveal   = Math.min(1, logoReveal + logoRevealSpeed*dt);

      const yBelowFlower = (H/2 + Y_SHIFT) + R + 22;

      // tagline
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${taglineAlpha})`;
      ctx.font = `${taglineSize}px sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(tagline, W/2, yBelowFlower);
      ctx.restore();

      // logo (recorte vertical para "reveal")
      if (logoImg){
        const targetW = W*0.62;
        const wFull = Math.min(targetW, logoImg.naturalWidth || targetW);
        const hFull = wFull * (logoImg.naturalHeight||280) / (logoImg.naturalWidth||800);
        const yLogoTop = yBelowFlower + 36;

        const hVis = hFull * logoReveal;
        const dy   = yLogoTop + (hFull - hVis);
        ctx.save();
        ctx.beginPath();
        ctx.rect(W/2 - wFull/2, dy, wFull, hVis);
        ctx.clip();
        ctx.drawImage(logoImg, W/2 - wFull/2, yLogoTop, wFull, hFull);
        ctx.restore();
      }
    }

    // === Semillas ===
    if (ENABLE_SEEDS && finished){
      const tSince = now/1000 - finishedAt;
      if (tSince>=SEEDS_START_DELAY && seeds.length<MAX_SEEDS){
        spawnAcc += dt*SEEDS_PER_SEC;
        while (spawnAcc>=1 && seeds.length<MAX_SEEDS){
          spawnAcc -= 1;
          const ang = Math.random()*Math.PI*2;
          const phase = phases[(Math.random()*phases.length)|0];
          const local = finalPoint(ang, phase);
          const headWorld = { x: (W/2 + headOffset.x), y: (H/2 + Y_SHIFT + headOffset.y) };
          const world = { x: headWorld.x + local.x, y: headWorld.y + local.y };

          let dir = { x: local.x, y: local.y };
          const d = Math.hypot(dir.x,dir.y) || 1; dir.x/=d; dir.y/=d;

          const v0 = (LAUNCH_SPEED + (Math.random()*16-8));
          const life = lerp(SEED_LIFE_MIN, SEED_LIFE_MAX, Math.random());
          const sc   = lerp(SEED_SCALE_MIN, SEED_SCALE_MAX, Math.random());
          seeds.push(new Seed(world.x,world.y, dir.x*v0, dir.y*v0, sc, life));
        }
      }

      for (let i=seeds.length-1; i>=0; i--){
        const s = seeds[i]; s.update(dt); s.draw(ctx);
        if (!s.alive) seeds.splice(i,1);
      }
    }

    // === RODIZIO (todas a la vez) ===
    if (rodLetters.length){
      for (const fl of rodLetters){ fl.update(dt); }
      for (const fl of rodLetters){ fl.draw(ctx); }
    }

    requestAnimationFrame(tick);
  }

  // ===== Helpers / clases =====
  function startRodizio(){
    rodizioStarted = true; rodizioFinished = false; rodLetters.length=0;

    const yBelowFlower = (H/2 + Y_SHIFT) + R + 22;
    rodBottomY = Math.min(H-40, yBelowFlower + ROD_BASE_Y_OFFSET);
    const spacing = ROD_FONT_SIZE * ROD_LETTER_SPACING_MUL;

    for (let i=0;i<ROD_CHARS.length;i++){
      const targetY = rodBottomY - i*spacing;
      rodLetters.push(new FallingLetter(ROD_CHARS[i], ROD_COL_X, targetY, ROD_FALL_SPEED));
    }
  }

  function FallingLetter(ch, cx, targetY, speed){
    this.ch = ch; this.cx = cx; this.y = -60; this.targetY = targetY;
    this.speed = speed; this.settled=false;
  }
  FallingLetter.prototype.update = function(dt){
    if (this.settled) return;
    this.y += this.speed * dt;
    if (this.y >= this.targetY){ this.y=this.targetY; this.settled=true; }
  };
  FallingLetter.prototype.draw = function(g){
    g.save();
    g.textAlign='center'; g.textBaseline='top';
    g.font = `${ROD_FONT_SIZE}px sans-serif`;
    const kx = (this.ch==='I') ? ROD_I_SHIFT : 0;

    // sombrita sutil
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillText(this.ch, this.cx + kx + 1.5, this.y + 1.5);

    // amarillo oscuro (aprox HSB 50,90,75)
    g.fillStyle = 'rgb(191,160,30)';
    g.fillText(this.ch, this.cx + kx, this.y);
    g.restore();
  };

  function Seed(x,y,vx,vy,scale,life){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.scale=scale;
    this.life=life; this.age=0; this.rot=Math.random()*Math.PI*2; this.rotVel=(Math.random()*4-2);
    this.n = Math.random()*1000;
    this.alive=true;
  }
  Seed.prototype.update = function(dt){
    this.age += dt; if (this.age>this.life){ this.alive=false; return; }
    // “ruido” barato: usa seno/cos con fase distinta por semilla
    const angN = 2*Math.PI * (Math.sin(this.n + this.age*NOISE_SPEED) * .5 + .5);
    const nx = Math.cos(angN), ny = Math.sin(angN);
    const wind = { x: WIND_DIR.x*WIND_SPEED, y: WIND_DIR.y*WIND_SPEED };
    const acc = { x: wind.x + nx*NOISE_MAG, y: wind.y + ny*NOISE_MAG };
    this.vx += acc.x*dt; this.vy += acc.y*dt;
    this.vx *= (1 - AIR_DRAG*dt); this.vy *= (1 - AIR_DRAG*dt);
    this.x += this.vx*dt; this.y += this.vy*dt;
    this.rot += this.rotVel*dt;

    const M=80;
    if (this.x<-M || this.x>W+M || this.y<-M || this.y>H+M) this.alive=false;
  };
  Seed.prototype.draw = function(g){
    const t = this.age/this.life;
    const alpha = 1 - smoothstep(0.80,1.00,t);
    const L = 10*this.scale, T = 4*this.scale;

    // dirección "fwd"
    let fx=this.vx, fy=this.vy;
    const d=Math.hypot(fx,fy);
    if (d<1e-3){ fx=Math.cos(this.rot); fy=Math.sin(this.rot); }
    else { fx/=d; fy/=d; }

    const bx = this.x - fx*L, by = this.y - fy*L;

    g.save();
    g.lineWidth=1.2; g.strokeStyle = `rgba(255,255,255,${0.9*alpha})`;
    g.beginPath(); g.moveTo(bx,by); g.lineTo(this.x,this.y); g.stroke();

    const ortx=-fy, orty=fx;
    g.beginPath();
    for (let i=0;i<8;i++){
      const th = (Math.PI*2)*i/8;
      const dx = fx*Math.cos(th) + ortx*Math.sin(th);
      const dy = fy*Math.cos(th) + orty*Math.sin(th);
      g.moveTo(this.x,this.y); g.lineTo(this.x+dx*T, this.y+dy*T);
    }
    g.stroke();
    g.restore();
  };

  // === Dibujo utilidades ===
  function morphedPointPhase(ang, extra){
    const rCircle = R;
    const rG = gielisSafe(ang + phi0 + extra, a,b,m,n1,n2,n3);
    const rGfit = rG * fitScale;
    const r = lerp(rCircle, rGfit, s);
    return { x: r*Math.cos(ang), y: r*Math.sin(ang) };
  }
  function finalPoint(ang, extra){
    const rG = gielisSafe(ang + phi0 + extra, a,b,m,n1,n2,n3);
    const rGfit = rG * fitScale;
    const r = lerp(R, rGfit, 1.0);
    return { x: r*Math.cos(ang), y: r*Math.sin(ang) };
  }
  function drawCenterGlow(r, aBase, rings){
    ctx.save(); ctx.fillStyle='#fff'; ctx.globalCompositeOperation='lighter';
    for (let i=rings; i>=1; i--){
      const rr = r * i / rings;
      const a  = (aBase/100) * (i/rings);
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2);
      ctx.fillStyle = rgbaHSB(centerHue, lerp(centerSat,40,(i-1)/(rings-1)), centerBri, a*100);
      ctx.fill();
    }
    ctx.restore();
  }

  function gielisSafe(phi,a,b,m,n1,n2,n3){
    const ca = Math.abs(Math.cos(m*phi/4)/Math.max(EPS,a));
    const sa = Math.abs(Math.sin(m*phi/4)/Math.max(EPS,b));
    const t1 = Math.pow(Math.max(EPS, ca), n2);
    const t2 = Math.pow(Math.max(EPS, sa), n3);
    const d  = Math.pow(Math.max(EPS, t1 + t2), 1/Math.max(EPS,n1));
    return 1/d;
  }

  function rgbaHSB(h,s,b,a){ // HSB (0..360,0..100,0..100,a 0..100)
    const c = hsb2rgb(h,s,b);
    return `rgba(${c.r},${c.g},${c.b},${a/100})`;
  }
  function hsb2rgb(h,s,b){
    s/=100; b/=100;
    const k = (n)=> (n + h/60) % 6;
    const f = (n)=> b - b*s*Math.max(0, Math.min(k(n),4-k(n),1));
    return { r:Math.round(f(5)*255), g:Math.round(f(3)*255), b:Math.round(f(1)*255) };
  }

  function map(x,a,b,c,d){ return c + (x-a)*(d-c)/(b-a); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function clamp01(x){ return Math.max(0, Math.min(1,x)); }
  function easeInOutCubic(x){ return x<.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; }
  function smoothstep(e0,e1,x){ x=clamp01((x-e0)/(e1-e0)); return x*x*(3-2*x); }
  function angleBetween(a,b){
    const la = Math.max(1e-6, Math.hypot(a.x,a.y)), lb=Math.max(1e-6, Math.hypot(b.x,b.y));
    const c = Math.max(-1, Math.min(1, (a.x*b.x + a.y*b.y)/(la*lb) ));
    return Math.acos(c);
  }
  function norm(v){ const d=Math.hypot(v.x,v.y)||1; return {x:v.x/d,y:v.y/d}; }

  function updateFitScale(){
    const S=2048; let rMax=0;
    for (let i=0;i<S;i++){
      const ang = (Math.PI*2)*i/S;
      const r = gielisSafe(ang+phi0,a,b,m,n1,n2,n3);
      if (isFinite(r)) rMax = Math.max(rMax, r);
    }
    if (rMax<EPS) rMax=1;
    fitScale = (R * fitMargin) / rMax;
  }
  function alignPetalUp(){ phi0 = -Math.PI/(2*m); } alignPetalUp();
  function rebuildPhases(){
    const L = 2*ROTACIONES + 1;
    phases = new Array(L); layerAlphaMul = new Array(L);
    let idx=0;
    for (let k=-ROTACIONES; k<=ROTACIONES; k++){
      phases[idx] = k * GOLDEN_ANGLE;
      layerAlphaMul[idx] = Math.pow(ALPHA_DECAY, Math.abs(k));
      idx++;
    }
  }
})();
