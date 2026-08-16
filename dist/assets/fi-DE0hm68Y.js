import{i as M}from"./header-BaFUgrvS.js";import{C as d,c as R,R as T}from"./math-YdX3NTr0.js";import{i as _,a as O,b as L}from"./energy-charts-CNzplDFq.js";import{F as S}from"./fi-glyph-CoIsVf0o.js";const G=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec2 aVel;
layout(location=2) in float aHomeR;
layout(location=3) in float aSeed;
layout(location=4) in vec3 aCol;

uniform float uDt, uTime, uR, uSwirl, uNoise, uAwake;
uniform vec3 uBase;
uniform vec4 uVort[8];
uniform int  uVortN;
uniform vec4 uBul[2];
uniform float uBulOn[2];
uniform vec4 uPush[2];
uniform int  uPushN;
uniform vec4 uSplat[4];
uniform vec3 uSplatCol[4];
uniform int  uSplatN;

out vec2 vPos;
out vec2 vVel;
out float vHomeR;
out float vSeed;
out vec3 vCol;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 p = aPos;
  vec2 v = aVel;
  vec3 c = aCol;
  float d = max(length(p), 1.0);
  vec2 rad = p / d;
  vec2 tng = vec2(-rad.y, rad.x);
  float target = aHomeR * uR;
  v += rad * (target - d) * uDt * 2.6;
  v += tng * uSwirl * (0.35 + 0.65 * d / max(uR, 1.0)) * uDt;
  v += vec2(
    sin(p.y * 0.021 + uTime * 0.55 + aSeed * 6.28),
    sin(p.x * 0.019 - uTime * 0.47 + aSeed * 12.56)
  ) * 3.0 * uAwake * uDt;
  if (uNoise > 0.02){
    v += vec2(hash(vec2(aSeed, floor(uTime * 9.0))) - 0.5,
              hash(vec2(aSeed + 7.0, floor(uTime * 9.0))) - 0.5) * uNoise * 170.0 * uDt;
  }
  for (int i = 0; i < 8; i++){
    if (i >= uVortN) break;
    vec2 dv = p - uVort[i].xy;
    float vd = length(dv) + 14.0;
    vec2 vt = vec2(-dv.y, dv.x) / vd;
    float f = uVort[i].z * uVort[i].w / vd;
    v += vt * f * uDt * 9.6;
    v -= (dv / vd) * f * uDt * 3.0;
  }
  for (int i = 0; i < 2; i++){
    if (uBulOn[i] <= 0.0) continue;
    vec2 bp = uBul[i].xy;
    vec2 bd = uBul[i].zw;
    vec2 dv = p - bp;
    float bdist = length(dv) + 1.0;
    if (bdist < 52.0)
      v += (dv / bdist) * (1.0 - bdist / 52.0) * 520.0 * uBulOn[i] * uDt;
    vec2 tp = bp - bd * 34.0;
    dv = p - tp;
    float td = length(dv) + 1.0;
    if (td < 80.0)
      v -= (dv / td) * (1.0 - td / 80.0) * 340.0 * uBulOn[i] * uDt;
  }
  for (int i = 0; i < 2; i++){
    if (i >= uPushN) break;
    vec2 dv = p - uPush[i].xy;
    float pd = length(dv) + 1.0;
    if (pd < uPush[i].z)
      v += (dv / pd) * (1.0 - pd / uPush[i].z) * uPush[i].w * uDt;
  }
  v *= exp(-3.1 * uDt);
  p += v * uDt;
  c = mix(c, uBase, clamp(uDt * 0.055, 0.0, 1.0));
  for (int i = 0; i < 4; i++){
    if (i >= uSplatN) break;
    float sd = distance(p, uSplat[i].xy);
    if (sd < uSplat[i].z)
      c = mix(c, uSplatCol[i], uSplat[i].w * (1.0 - sd / uSplat[i].z));
  }
  vPos = p; vVel = v; vHomeR = aHomeR; vSeed = aSeed; vCol = c;
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}`,U=`#version 300 es
precision highp float;
out vec4 o;
void main(){ o = vec4(0.0); }`,H=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=3) in float aSeed;
layout(location=4) in vec3 aCol;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uDpr;
out vec3 vCol;
out float vTw;
void main(){
  vec2 px = (uCenter + aPos) * uDpr;
  vec2 clip = px / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = (1.1 + fract(aSeed * 13.73) * 1.9) * uDpr;
  vCol = aCol;
  vTw = fract(aSeed * 7.31);
}`,Y=`#version 300 es
precision highp float;
in vec3 vCol;
in float vTw;
uniform float uAlpha;
uniform float uShift;
uniform vec3 uRed;
out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a = (1.0 - r2) * (1.0 - r2) * uAlpha * (0.6 + 0.4 * vTw);
  vec3 col = mix(vCol, uRed, uShift);
  o = vec4(col * a, a);
}`;function A(i,r,e){const t=i.createShader(r);if(i.shaderSource(t,e),i.compileShader(t),!i.getShaderParameter(t,i.COMPILE_STATUS))throw new Error(i.getShaderInfoLog(t));return t}function x(i,r,e,t){const s=i.createProgram();if(i.attachShader(s,A(i,i.VERTEX_SHADER,r)),i.attachShader(s,A(i,i.FRAGMENT_SHADER,e)),t&&i.transformFeedbackVaryings(s,t,i.INTERLEAVED_ATTRIBS),i.linkProgram(s),!i.getProgramParameter(s,i.LINK_STATUS))throw new Error(i.getProgramInfoLog(s));return s}const b=36;class E{constructor(r,e={}){this.ok=!1,this.cv=r,this.count=e.count||5e4,this.baseHex=e.baseColor||"#f56a8c",this.seed=e.seed||7;try{const t=r.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!t)return;this.gl=t,this.progU=x(t,G,U,["vPos","vVel","vHomeR","vSeed","vCol"]),this.progR=x(t,H,Y,null),this.uni={};for(const s of["uDt","uTime","uR","uSwirl","uNoise","uAwake","uBase","uVort","uVortN","uBul","uBulOn","uPush","uPushN","uSplat","uSplatCol","uSplatN"])this.uni[s]=t.getUniformLocation(this.progU,s);this.uniR={};for(const s of["uRes","uCenter","uDpr","uAlpha","uShift","uRed"])this.uniR[s]=t.getUniformLocation(this.progR,s);this._initBuffers(e.initR||200),this.dpr=Math.min(devicePixelRatio||1,2),this.time=0,this.ok=!0}catch{this.ok=!1}}_rng(){let r=this.seed*2654435761>>>0;return()=>(r^=r<<13,r^=r>>>17,r^=r<<5,r>>>=0,r/4294967296)}_hexVec(r){const e=r.replace("#","");return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}_initBuffers(r){const e=this.gl,t=this.count,s=this._rng(),p=this._hexVec(this.baseHex),m=[16/255,12/255,28/255],c=new Float32Array(t*9);for(let o=0;o<t;o++){const y=s(),f=.08+1.06*Math.pow(y,1.5),h=s()*Math.PI*2,l=o*9;c[l]=Math.cos(h)*f*r,c[l+1]=Math.sin(h)*f*r,c[l+2]=0,c[l+3]=0,c[l+4]=f,c[l+5]=s()*1e3;const u=s()*.35;c[l+6]=p[0]+(m[0]-p[0])*u,c[l+7]=p[1]+(m[1]-p[1])*u,c[l+8]=p[2]+(m[2]-p[2])*u}this.bufs=[e.createBuffer(),e.createBuffer()],this.vaos=[e.createVertexArray(),e.createVertexArray()],this.tfs=[e.createTransformFeedback(),e.createTransformFeedback()];for(let o=0;o<2;o++)e.bindBuffer(e.ARRAY_BUFFER,this.bufs[o]),e.bufferData(e.ARRAY_BUFFER,c,e.DYNAMIC_COPY),e.bindVertexArray(this.vaos[o]),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,b,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,b,8),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,b,16),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,1,e.FLOAT,!1,b,20),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,3,e.FLOAT,!1,b,24),e.bindTransformFeedback(e.TRANSFORM_FEEDBACK,this.tfs[o]),e.bindBufferBase(e.TRANSFORM_FEEDBACK_BUFFER,0,this.bufs[o]);e.bindVertexArray(null),e.bindTransformFeedback(e.TRANSFORM_FEEDBACK,null),e.bindBuffer(e.ARRAY_BUFFER,null),this.cur=0}resize(){if(!this.ok)return;const r=this.cv.getBoundingClientRect();!r.width||!r.height||(this.cv.width=Math.round(r.width*this.dpr),this.cv.height=Math.round(r.height*this.dpr),this.W=r.width,this.H=r.height)}frame(r,e){if(!this.ok)return;const t=this.gl;this.cv.width||this.resize(),this.time+=r,t.useProgram(this.progU),t.uniform1f(this.uni.uDt,Math.min(r,.05)),t.uniform1f(this.uni.uTime,this.time),t.uniform1f(this.uni.uR,e.R),t.uniform1f(this.uni.uSwirl,e.swirl),t.uniform1f(this.uni.uNoise,e.noise),t.uniform1f(this.uni.uAwake,e.awake),t.uniform3fv(this.uni.uBase,e.base);const s=new Float32Array(32),p=Math.min(e.vortices.length,8);for(let n=0;n<p;n++){const a=e.vortices[n];s[n*4]=a.x,s[n*4+1]=a.y,s[n*4+2]=a.s,s[n*4+3]=a.life}t.uniform4fv(this.uni.uVort,s),t.uniform1i(this.uni.uVortN,p);const m=new Float32Array(8),c=new Float32Array(2);for(let n=0;n<Math.min(e.bullets.length,2);n++){const a=e.bullets[n];m[n*4]=a.x,m[n*4+1]=a.y,m[n*4+2]=a.dx,m[n*4+3]=a.dy,c[n]=a.on}t.uniform4fv(this.uni.uBul,m),t.uniform1fv(this.uni.uBulOn,c);const o=new Float32Array(8),y=Math.min(e.pushes.length,2);for(let n=0;n<y;n++){const a=e.pushes[n];o[n*4]=a.x,o[n*4+1]=a.y,o[n*4+2]=a.r,o[n*4+3]=a.s}t.uniform4fv(this.uni.uPush,o),t.uniform1i(this.uni.uPushN,y);const f=new Float32Array(16),h=new Float32Array(12),l=Math.min(e.splats.length,4);for(let n=0;n<l;n++){const a=e.splats[n];f[n*4]=a.x,f[n*4+1]=a.y,f[n*4+2]=a.r,f[n*4+3]=a.s,h[n*3]=a.col[0],h[n*3+1]=a.col[1],h[n*3+2]=a.col[2]}t.uniform4fv(this.uni.uSplat,f),t.uniform3fv(this.uni.uSplatCol,h),t.uniform1i(this.uni.uSplatN,l);const u=this.cur,v=1-this.cur;t.bindVertexArray(this.vaos[u]),t.bindTransformFeedback(t.TRANSFORM_FEEDBACK,this.tfs[v]),t.enable(t.RASTERIZER_DISCARD),t.beginTransformFeedback(t.POINTS),t.drawArrays(t.POINTS,0,this.count),t.endTransformFeedback(),t.disable(t.RASTERIZER_DISCARD),t.bindTransformFeedback(t.TRANSFORM_FEEDBACK,null),this.cur=v,t.viewport(0,0,this.cv.width,this.cv.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE),t.useProgram(this.progR),t.uniform2f(this.uniR.uRes,this.cv.width,this.cv.height),t.uniform2f(this.uniR.uCenter,e.center.x,e.center.y),t.uniform1f(this.uniR.uDpr,this.dpr),t.uniform1f(this.uniR.uAlpha,e.alpha),t.uniform1f(this.uniR.uShift,e.shift),t.uniform3f(this.uniR.uRed,224/255,72/255,72/255),t.bindVertexArray(this.vaos[this.cur]),t.drawArrays(t.POINTS,0,this.count),t.bindVertexArray(null),t.disable(t.BLEND)}}function z(){const i={fn:d("--c-accent"),n:d("--c-n"),s:d("--c-s"),f:d("--c-f"),pos:[d("--pos-1"),d("--pos-2"),d("--pos-3"),d("--pos-4")],sh:d("--pos-sh"),warn:d("--warn"),crit:d("--crit"),ink:d("--ink"),ink2:d("--ink-2"),muted:d("--muted"),grid:d("--grid"),axis:d("--axis"),surface:d("--surface")},r=[{key:"dominant",name:"Dominant",sub:"1st · hero",types:"INFP · ISFP",shadow:!1,series:0,params:{scale:1,fidelity:.95,latency:0,noise:0,duty:1,control:1,contrary:0},dial:[.95,.95,.9,.95,.9],text:"The world is measured against an inner tone. Conviction is effortless and constant — not argued, simply known. The core burns steady; the hierarchy of what matters is deep, calm, and exact."},{key:"auxiliary",name:"Auxiliary",sub:"2nd · parent",types:"ENFP · ESFP",shadow:!1,series:1,params:{scale:.8,fidelity:.85,latency:80,noise:.05,duty:.85,control:.9,contrary:0},dial:[.8,.85,.8,.85,.78],text:'The compass behind the explorer. Fi here vets what the dominant perceiver drags home — "is this us? could I live with this?" — quiet in the background, decisive at exactly the moments that matter.'},{key:"tertiary",name:"Tertiary",sub:"3rd · eternal child",types:"ISTJ · INTJ",shadow:!1,series:2,params:{scale:.55,fidelity:.6,latency:250,noise:.2,duty:.5,control:.6,contrary:0},dial:[.5,.55,.5,.55,.45],text:'A private moral sense, real but narrow — fierce loyalty to a few people and principles, guarded like contraband and dismissed in public as "just being practical". It blooms, quietly, with age.'},{key:"inferior",name:"Inferior",sub:"4th · aspirational",types:"ESTJ · ENTJ",shadow:!1,series:3,params:{scale:.4,fidelity:.35,latency:700,noise:.45,duty:.25,control:.35,contrary:0},dial:[.25,.3,.3,.3,.35],text:`Feeling arrives late and off-balance. Long stretches of "emotions are noise in the data", punctuated — under stress — by waves of wounded, moralizing sentiment that don't sound like them at all.`},{key:"opposing",name:"Opposing",sub:"5th · shadow",types:"ENFJ · ESFJ",shadow:!0,series:4,params:{scale:.46,fidelity:.42,latency:600,noise:.5,duty:.45,control:.4,contrary:.25},dial:[.35,.4,.5,.3,.2],text:`The stubborn conscience. When their Fe harmonizing is challenged, Fi wakes up contrary — "I don't care what the room needs, this is where I stand" — protective, prickly, and briefly immovable.`},{key:"critical",name:"Critical Parent",sub:"6th · shadow",types:"INFJ · ISFJ",shadow:!0,series:4,params:{scale:.44,fidelity:.35,latency:900,noise:.55,duty:.35,control:.3,contrary:.35},dial:[.3,.45,.4,.25,.15],text:'An inner voice that interrogates the heart: "do you even know what you want? your feelings are self-indulgent." Harsh, sporadic, and aimed mostly at the self.'},{key:"trickster",name:"Trickster",sub:"7th · shadow",types:"ESTP · ENTP",shadow:!0,series:4,params:{scale:.42,fidelity:.28,latency:1200,noise:.6,duty:.3,control:.2,contrary:.55},dial:[.2,.25,.35,.15,.1],text:"Personal conviction as a trap to wriggle out of. Asked what they truly feel, this position deflects with charm or contrarian play — blind, without malice, to the difference between a value and a preference."},{key:"demon",name:"Demon",sub:"8th · shadow",types:"ISTP · INTP",shadow:!0,series:4,params:{scale:.4,fidelity:.2,latency:1500,noise:.65,duty:.22,control:.12,contrary:.65},dial:[.15,.3,.25,.1,.05],text:"Rarely touched, and volcanic when it erupts: a conviction of worthlessness or betrayal so total it presents itself as objective fact — moral certainty aimed inward like a weapon."}],e=[{key:"ne",name:"Ne",color:i.n,canonical:!0,pair:"the INFP coupling",cfg:{rate:.36,branchy:.85,speed:.35,spread:.95,persistence:.35},text:"Moral imagination. Ne delivers forking possibilities, and each one is struck against the core — could I live with this? who would I be in that world? The hierarchy grows wide: many futures held lightly, waiting to see which ones ring true."},{key:"se",name:"Se",color:i.s,canonical:!0,pair:"the ISFP coupling",cfg:{rate:.58,branchy:0,speed:1,spread:.15,persistence:.95},text:"Embodied conviction. Se delivers the vivid, concrete present — Fi weighs what is actually here, now, in front of it. The hierarchy grows tight and lived-in: taste, beauty, and right-action felt in the hands rather than argued in the head."},{key:"si",name:"Si",color:"#c07f10",canonical:!1,pair:"the loop coupling (Fi–Si, INFP under stress)",cfg:{rate:.3,branchy:0,speed:.3,spread:.2,persistence:1},text:"Experience drawn from the archive rather than the world: old wounds and old kindnesses replayed against the core tone, verdicts re-felt instead of re-tested. Tender, airless, and increasingly detached from anything new — the visual signature of a cognitive loop."},{key:"ni",name:"Ni",color:"#7148d8",canonical:!1,pair:"a non-standard coupling",cfg:{rate:.15,branchy:.15,speed:.2,spread:.5,persistence:.7},text:"Speculative: a thin stream of pre-converged meaning. Fi receives few experiences but heavy ones — each arrival re-weighing the whole hierarchy at once. No standard stack places Ni directly above Fi."},{key:"te",name:"Te",color:"#3fb4c9",canonical:!1,unstable:!0,pair:"judging feeding judging",cfg:{rate:.12,branchy:0,speed:.3,spread:.4,persistence:.5},text:"Two sorters, no gatherer. Te hands Fi verdicts about efficiency rather than lived experience — the chamber idles hungry, with almost nothing arriving to weigh. This is why real stacks alternate perceiving and judging."}];function t(a){const N=20*Math.pow(a/60,1.25);let k=0;for(const[F,V]of[[16,8],[41,12],[68,9],[97,9]])a>=F&&(k+=V*R((a-F)/2,0,1));const D=a<2?0:1.6*Math.sin(a*.9)+1.2*Math.sin(a*2.3+1);return R(N+k+D,0,100)}const s=[{key:"dom",label:"Dominant",color:i.pos[0],f:a=>Math.max(0,13*(a/60)-2.2*Math.pow(Math.max(0,Math.sin(a/8.2)),3))},{key:"aux",label:"Auxiliary",color:i.pos[1],f:a=>21*Math.pow(a/60,1.08)},{key:"tert",label:"Tertiary",color:i.pos[2],f:a=>30*Math.pow(a/60,1.4)},{key:"inf",label:"Inferior",color:i.pos[3],f:a=>Math.min(100,82*Math.pow(a/60,1.9))},{key:"sh",label:"Shadow",color:i.sh,f:t}],p=60*Math.pow(100/82,1/1.9),m=[{label:"Dominant",v:1,color:i.pos[0],series:0},{label:"Auxiliary",v:1.5,color:i.pos[1],series:1},{label:"Tertiary",v:2.5,color:i.pos[2],series:2},{label:"Inferior",v:4,color:i.pos[3],series:3},{label:"Shadow",v:4.5,color:i.sh,band:[3,6],series:4}],c=[{label:"Dominant",color:i.pos[0],note:"Refills in minutes — and partially during use (flow).",f:a=>a<=30?100-s[0].f(a):o(0)+(100-o(0))*(1-Math.exp(-(a-30)/6))},{label:"Auxiliary",color:i.pos[1],note:"Quick, clean recovery.",f:a=>a<=30?100-s[1].f(a):o(1)+(100-o(1))*(1-Math.exp(-(a-30)/10))},{label:"Tertiary",color:i.pos[2],note:"A slower refill; rest must be deliberate.",f:a=>a<=30?100-s[2].f(a):o(2)+(100-o(2))*(1-Math.exp(-(a-30)/16))},{label:"Inferior",color:i.pos[3],note:"The hangover shelf: ~30 min where the whole system runs dim.",f:a=>a<=30?100-s[3].f(a):a<60?o(3):o(3)+(100-o(3))*(1-Math.exp(-(a-60)/20))},{label:"Shadow",color:i.sh,note:"Incomplete — some of the charge simply doesn't come back today.",f:a=>a<=30?100-s[4].f(a):o(4)+(93-o(4))*(1-Math.exp(-(a-30)/25))}];function o(a){return 100-s[a].f(30)}const y={buttons:[{id:"btnAuthGood",label:"Experience authentic joy",sub:"something true and resonant",color:"#f0b95c"},{id:"btnAuthBad",label:"Experience authentic grief",sub:"true, painful, held deeply",color:"#6272dd"},{id:"btnFakeGood",label:"Hear an inauthentic pleasantry",sub:"flattery glides off unabsorbed",color:"#ffd9e6"},{id:"btnFakeBad",label:"Witness an inauthentic violation",sub:"a falsehood tears the mist",color:i.crit}],narrations:{authGood:"Something joyful — and true — arrives. It rings against the core, diffuses deep into the nebula, and sets the mist gently turning. Pleasure blooms, and for a while the colour of the whole warms toward what was taken in.",authBad:"Something painful — and true. Fi does not flinch: the grief diffuses inward and the mist slows, darkens, and holds it. Stress rises, but so does resonance — this is not enjoyment, it is rightness. It, too, will colour the whole.",fakeGood:"Flattery arrives — pleasant, glossy, and hollow. The mist refuses to mix with it…",fakeGoodEnd:"…it glides along the inside of the chamber, dissolving nothing and being dissolved by nothing, is politely tolerated — and shown out exactly as it came. The nebula keeps none of it.",fakeBad:"A falsehood strikes what matters. It tears straight through the nebula — mist churns away from its path, a vacuum drags behind it —",fakeBadMid:"— and some of the mist bleeds out through the wound. The chamber red-shifts while everything attached to the wounded value finds a new place.",fakeBadEnd:"…the wound closes. The mist stills, the colour steadies — darker in places, rearranged in others. Fi keeps what was real, and remembers where it bled."}},f={tag:"introverted feeling",title:"Introverted Feeling",subtitle:"A quiet nebula around a core tone — weighing every experience against an unargued inner compass."},h={kicker:"Zone B · stack position",heading:"The Eight Faces of Fi",lede:"Click any position to see how the nebula changes — from the deep, steady conviction of a dominant to the volcanic, inward-facing moral certainty of the demon. Drag the maturity slider to watch the lower positions slowly gain fidelity with age."},l={kicker:"Zone C · feeder coupling",heading:"What Feeds Into Fi?",lede:"Every judging function needs a perceiving partner to deliver raw material. Click a feeder to watch how the nebula changes shape and motion."},u={kicker:"Zone D · verification lab",heading:"The Verification Lab",lede:"Watch Fi weigh experiences against its core tone in real time. Each button triggers a different lifecycle event inside the nebula."},v={kicker:"Zone E · energy economics",heading:"Energy Economics",lede:"Every invocation of Fi costs energy. The lower it sits in the stack, the more expensive it becomes — and the faster the battery drains."},n={kicker:"Zone F · field notes",heading:"Field Notes",lede:"Patterns from the wild — how Fi shows up in daily life.",mirror:{label:"Fi",counterpart:"Fe",counterpartColor:i.f},vignettes:[{title:"The Silent Compass",text:'An INFP sits quietly in a meeting where everyone agrees on a compromise. Suddenly they say "no" — not loudly, not with a ten-point argument, but with an absolute firmness that stops the room.'},{title:"The Loop",text:"Under stress, INFP Fi pairs with tertiary Si: replaying old wounds and old kindnesses against the core tone, re-feeling verdicts instead of re-testing them. Tender, airless, and detached from anything new."},{title:"The Inferior Eruption",text:"An ESTJ under stress suddenly breaks down into overwhelming, wounded moralizing — accusing others of betrayal and heartlessness with an intensity that startles everyone."}]};return{COL:i,SLOTS:r,FEEDERS:e,SERIES:s,GRIP_T:p,COSTS:m,RECOVERY:c,VERIFY:y,HERO:f,ZONE_B:h,ZONE_C:l,ZONE_D:u,ZONE_E:v,ZONE_F:n}}M("fi");const g=z(),{COL:w,SLOTS:Z,FEEDERS:j,SERIES:J,GRIP_T:q,COSTS:K,RECOVERY:W}=g,I=document.getElementById("glyphHero");if(I){const i=new S(I,{seed:7,coreGlow:1,mistCount:9e4,MistGPU:E,COL:w});i.setTarget({scale:1,fidelity:.95,latency:0,noise:0,duty:1,control:1}),i.start()}const Q=_({series:J,costs:K,recovery:W,fnLabel:"Fi",gripT:q,gripNote:"forced inferior Fi"}),P=document.getElementById("glyphRail");if(P){const i=new S(P,{seed:21,coreGlow:.9,MistGPU:E,COL:w});i.bombard=!0,i.start(),O({slots:Z,glyph:i,highlightSeries:Q.highlightSeries})}const B=document.getElementById("feederCanvas");if(B){const i=new S(B,{seed:33,coreGlow:.85,interactive:!1,MistGPU:E,COL:w});i.setTarget({scale:.8,fidelity:.9,latency:0,noise:0,duty:1,control:1}),i.start(),L({feeders:j,glyph:i,fnLabel:"Fi"})}const C=document.getElementById("verifyCanvas");if(C){let f=function(){if(!t||!s)return;const l=Math.round(i.stress*100),u=Math.round(i.pleasure*100);t.style.width=l+"%",p.textContent=l+"%",s.style.width=u+"%",m.textContent=u+"%"},h=function(l){if(!T)return;const u=Math.round(l*30);for(let v=0;v<u;v++)i.step(1/30);i.draw(),f()};const i=new S(C,{seed:55,coreGlow:.95,mistCount:6e4,MistGPU:E,COL:w});i.setTarget({scale:.85,fidelity:.92,latency:0,noise:0,duty:1,control:.7}),i.setStructure({countMul:1.1,k:3,rigidity:.55}),i.start();const r=document.getElementById("verifyNarr"),e=["btnAuthGood","btnAuthBad","btnFakeGood","btnFakeBad"].map(l=>document.getElementById(l)),t=document.getElementById("mStress"),s=document.getElementById("mPleasure"),p=document.getElementById("mStressVal"),m=document.getElementById("mPleasureVal");let c=0;const o=l=>{r&&(r.textContent=l)},y=(l,u,v)=>setTimeout(()=>{l===c&&v()},u);T||(function l(){f(),requestAnimationFrame(l)})(),e[0]&&e[0].addEventListener("click",()=>{c++,i.spawnSub("authGood",{color:"#f0b95c"}),o(g.VERIFY.narrations.authGood),h(4.5)}),e[1]&&e[1].addEventListener("click",()=>{c++,i.spawnSub("authBad",{color:"#6272dd"}),o(g.VERIFY.narrations.authBad),h(4.5)}),e[2]&&e[2].addEventListener("click",()=>{c++;const l=c;i.spawnSub("fakeGood",{color:"#ffd9e6"}),o(g.VERIFY.narrations.fakeGood),h(3),y(l,3200,()=>{o(g.VERIFY.narrations.fakeGoodEnd),h(2.5)})}),e[3]&&e[3].addEventListener("click",()=>{c++;const l=c;e.forEach(u=>{u&&(u.disabled=!0)}),i.spawnSub("fakeBad",{color:w.crit}),o(g.VERIFY.narrations.fakeBad),h(2.2),y(l,2e3,()=>{o(g.VERIFY.narrations.fakeBadMid),h(2.5)}),y(l,7200,()=>{o(g.VERIFY.narrations.fakeBadEnd),h(6),e.forEach(u=>{u&&(u.disabled=!1)})})})}
