import{i as k}from"./header-BBuxVNPY.js";import{m as O,a as H,r as N,c as X,l as S,b as B,R as P}from"./dom-E87FTS4S.js";import{i as z,a as q,b as W}from"./energy-teaser-CsPVRrV7.js";import{F as A}from"./fi-glyph-BXAGbfad.js";import{l as Y}from"./fi-data-6i3b5d84.js";const U=n=>n-Math.floor(n),p=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main(){
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,x=`#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
`,j=x+`
uniform sampler2D uTexture;
uniform float value;
void main(){ fragColor = value * texture(uTexture, vUv); }`,Q=x+`
uniform sampler2D uTarget;
uniform float aspectRatio, radius;
uniform vec3 color;
uniform vec2 point;
void main(){
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,J=x+`
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,K=x+`
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,$=x+`
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,Z=x+`
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main(){
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}`,tt=x+`
uniform sampler2D uPressure, uDivergence;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,et=x+`
uniform sampler2D uPressure, uVelocity;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`,it=x+`
uniform sampler2D uVelocity;
uniform vec2 uCenter;
uniform float uAspect, uR, uDt, uTime;
uniform float uSwirl, uWall, uOut, uTurb, uAwake;
uniform vec4 uEmA, uEmB;   /* xy uv position, zw jet velocity */
uniform vec2 uEmR;         /* squared gaussian radii */
uniform vec4 uVort[8];
uniform int uVortN;
uniform vec4 uBul[2];
uniform vec2 uBulOn;
uniform vec4 uPush[2];
uniform int uPushN;

/* curl of a sine potential — divergence-free by construction, so
   the projection step has almost nothing to undo. Two octaves, both
   fine enough to break the dye into filaments rather than push the
   whole blob around. */
vec2 turbulence(vec2 q, float t){
  float k1 = 26.0, k2 = 47.0;
  float dpdy = -sin(k1 * q.x + 1.3 * t) * sin(k1 * q.y - 0.9 * t)
             + 0.5 * cos(k2 * q.y + 0.7 * t) * cos(k2 * q.x + 1.7 * t);
  float dpdx =  cos(k1 * q.x + 1.3 * t) * cos(k1 * q.y - 0.9 * t)
             - 0.5 * sin(k2 * q.y + 0.7 * t) * sin(k2 * q.x + 1.7 * t);
  return vec2(dpdy, -dpdx);
}

void main(){
  vec2 v = texture(uVelocity, vUv).xy;
  vec2 p = (vUv - uCenter) * vec2(uAspect, 1.0);
  float d = length(p) + 1e-5;
  vec2 rad = p / d;
  vec2 tng = vec2(-rad.y, rad.x);
  float rn = d / max(uR, 1e-4);

  /* soft wall: nothing until the shell, then a hard pull home */
  v -= rad * smoothstep(0.86, 1.24, rn) * uWall * uDt;
  /* core outflow — the tone pushing its own dye outward */
  v += rad * exp(-rn * rn * 9.0) * uOut * uDt;
  /* swirl, strongest out at the rim */
  v += tng * uSwirl * (0.3 + 0.7 * min(rn, 1.4)) * uDt;
  /* turbulence, held inside the chamber */
  v += turbulence(p, uTime) * uTurb * (0.35 + 0.65 * uAwake)
       * smoothstep(1.5, 0.5, rn) * uDt;
  /* the two emitters drag velocity along with them, the way a pointer
     drag does in the reference — this is what makes ribbons, not blobs */
  vec2 da = (vUv - uEmA.xy) * vec2(uAspect, 1.0);
  v += uEmA.zw * exp(-dot(da, da) / uEmR.x) * uDt;
  vec2 db = (vUv - uEmB.xy) * vec2(uAspect, 1.0);
  v += uEmB.zw * exp(-dot(db, db) / uEmR.y) * uDt;

  for (int i = 0; i < 8; i++){
    if (i >= uVortN) break;
    vec2 dv = (vUv - uVort[i].xy) * vec2(uAspect, 1.0);
    float vd = length(dv) + 0.02;
    float f = uVort[i].z * uVort[i].w / vd;
    v += vec2(-dv.y, dv.x) / vd * f * uDt;
    v -= dv / vd * f * uDt * 0.3;
  }
  for (int i = 0; i < 2; i++){
    if (uBulOn[i] <= 0.0) continue;
    vec2 dv = (vUv - uBul[i].xy) * vec2(uAspect, 1.0);
    float bd = length(dv) + 0.004;
    /* shoulder: mist thrown off the path */
    v += dv / bd * smoothstep(0.10, 0.0, bd) * 9.0 * uBulOn[i] * uDt;
    /* wake: a vacuum dragged behind it */
    dv = (vUv - uBul[i].xy + uBul[i].zw * 0.07) * vec2(uAspect, 1.0);
    float td = length(dv) + 0.004;
    v -= dv / td * smoothstep(0.13, 0.0, td) * 6.0 * uBulOn[i] * uDt;
  }
  for (int i = 0; i < 2; i++){
    if (i >= uPushN) break;
    vec2 dv = (vUv - uPush[i].xy) * vec2(uAspect, 1.0);
    float pd = length(dv) + 0.004;
    v += dv / pd * smoothstep(uPush[i].z, 0.0, pd) * uPush[i].w * uDt;
  }
  fragColor = vec4(v, 0.0, 1.0);
}`,rt=x+`
uniform sampler2D uTarget;
uniform vec2 uCenter, uA, uB;
uniform float uAspect, uRA, uRB, uAmtA, uAmtB, uR, uHold;
uniform vec3 uColA, uColB;
void main(){
  vec3 base = texture(uTarget, vUv).xyz;
  vec2 pa = (vUv - uA) * vec2(uAspect, 1.0);
  vec2 pb = (vUv - uB) * vec2(uAspect, 1.0);
  vec3 add = exp(-dot(pa, pa) / uRA) * uColA * uAmtA
           + exp(-dot(pb, pb) / uRB) * uColB * uAmtB;
  /* anything that got past the wall gives its dye up */
  float rn = length((vUv - uCenter) * vec2(uAspect, 1.0)) / max(uR, 1e-4);
  fragColor = vec4((base + add) * mix(1.0, uHold, smoothstep(1.15, 1.75, rn)), 1.0);
}`,st=x+`
uniform sampler2D uTexture;
uniform vec2 texelSize, uCenter;
uniform float uAspect, uR, uAlpha, uShift, uDim;
uniform vec3 uRed;
void main(){
  vec3 c = texture(uTexture, vUv).rgb;
  vec3 lc = texture(uTexture, vL).rgb;
  vec3 rc = texture(uTexture, vR).rgb;
  vec3 tc = texture(uTexture, vT).rgb;
  vec3 bc = texture(uTexture, vB).rgb;
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(texelSize)));
  c *= clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);

  float lum = max(c.r, max(c.g, c.b));
  c = mix(c, uRed * lum, uShift * 0.75);
  float rn = length((vUv - uCenter) * vec2(uAspect, 1.0)) / max(uR, 1e-4);
  c *= uAlpha * uDim * smoothstep(1.62, 1.05, rn);
  float a = max(c.r, max(c.g, c.b));
  fragColor = vec4(c, min(a, 1.0));
}`;function M(n,i,e){const t=n.createShader(i);if(n.shaderSource(t,e),n.compileShader(t),!n.getShaderParameter(t,n.COMPILE_STATUS))throw new Error(n.getShaderInfoLog(t));return t}class R{constructor(i,e,t){this.gl=i;const r=i.createProgram();if(i.attachShader(r,M(i,i.VERTEX_SHADER,e)),i.attachShader(r,M(i,i.FRAGMENT_SHADER,t)),i.linkProgram(r),!i.getProgramParameter(r,i.LINK_STATUS))throw new Error(i.getProgramInfoLog(r));this.p=r,this.u={};const s=i.getProgramParameter(r,i.ACTIVE_UNIFORMS);for(let u=0;u<s;u++){const o=i.getActiveUniform(r,u).name.replace(/\[0\]$/,"");this.u[o]=i.getUniformLocation(r,o)}}bind(){return this.gl.useProgram(this.p),this.u}}class w{constructor(i,e={}){this.ok=!1,this.cv=i,this.o=Object.assign({simRes:128,dyeRes:384,pressureIterations:12,curl:34,densityDissipation:.6,velocityDissipation:.22,pressure:.8,renderScale:.75,seed:7,baseColor:"#f56a8c"},e),this.time=0,this.rnd=O(this.o.seed*7919+13),this._queue=[],this._initPalette();try{const t=i.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1});if(!t)return;this.gl=t,t.getExtension("EXT_color_buffer_float"),t.getExtension("EXT_color_buffer_half_float");const r=t.HALF_FLOAT;if(this.fRGBA=this._format(t.RGBA16F,t.RGBA,r),!this.fRGBA)return;this.fRG=this._format(t.RG16F,t.RG,r)||this.fRGBA,this.fR=this._format(t.R16F,t.RED,r)||this.fRG,this._initQuad(),this.prog={clear:new R(t,p,j),splat:new R(t,p,Q),advect:new R(t,p,J),divergence:new R(t,p,K),curl:new R(t,p,$),vorticity:new R(t,p,Z),pressure:new R(t,p,tt),gradient:new R(t,p,et),force:new R(t,p,it),emit:new R(t,p,rt),display:new R(t,p,st)},this.ok=!0,this.resize()}catch{this.ok=!1}}_initPalette(){const i=H(this.o.baseColor);this.anchor=N(i.r/255,i.g/255,i.b/255),this.hue=this.anchor,this.hueTarget=this.anchor,this.spin=0,this.spinRate=1,this._hueT=0,this.tint={r:i.r,g:i.g,b:i.b}}_stepPalette(i,e){if(this._hueT-=i,this._hueT<=0){const s=.26+.14*X(e.noise*1.5+e.stress,0,1);this.hueTarget=this.anchor+(this.rnd()-.5)*2*s,this._hueT=.5+this.rnd()*1.6}const t=S(this.hueTarget,.005,e.shift*.8);this.hue=S(this.hue,t,1-Math.pow(.25,i)),this.spinRate=.55+.75*e.awake,this.spin+=i*this.spinRate;const r=B(U(this.hue),.82,1);this.tint={r:r.r*255,g:r.g*255,b:r.b*255}}_emitters(i){const e=i.R,t=this.spinRate,r=(o,f,v,m,d,a)=>{const l=e*f;return{x:Math.cos(o)*l,y:Math.sin(o)*l,vx:-Math.sin(o)*l*v*t,vy:Math.cos(o)*l*v*t,r:e*a,col:B(U(m),d,1)}},s=2.05,u=-1.35;this.em={a:r(this.spin*s,.3+.11*Math.sin(this.spin*.63),s,this.hue,.8,.2),b:r(this.spin*u+2.1,.46+.15*Math.sin(this.spin*.41+2),u,this.hue+.28*Math.sin(this.spin*.37),.95,.12)}}_format(i,e,t){const r=this.gl,s=r.createTexture();r.bindTexture(r.TEXTURE_2D,s),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),r.texImage2D(r.TEXTURE_2D,0,i,4,4,0,e,t,null);const u=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,u),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,s,0);const o=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteFramebuffer(u),r.deleteTexture(s),o?{internal:i,format:e,type:t}:null}_initQuad(){const i=this.gl;this.vao=i.createVertexArray(),i.bindVertexArray(this.vao);const e=i.createBuffer();i.bindBuffer(i.ARRAY_BUFFER,e),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),i.STATIC_DRAW);const t=i.createBuffer();i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t),i.bufferData(i.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),i.STATIC_DRAW),i.enableVertexAttribArray(0),i.vertexAttribPointer(0,2,i.FLOAT,!1,0,0),i.bindVertexArray(null),this._quadBufs=[e,t]}_fbo(i,e,t,r){const s=this.gl,u=s.createTexture();s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,u),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,r),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,r),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),s.texImage2D(s.TEXTURE_2D,0,t.internal,i,e,0,t.format,t.type,null);const o=s.createFramebuffer();return s.bindFramebuffer(s.FRAMEBUFFER,o),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,u,0),s.viewport(0,0,i,e),s.clear(s.COLOR_BUFFER_BIT),s.bindFramebuffer(s.FRAMEBUFFER,null),{tex:u,fbo:o,w:i,h:e,tx:1/i,ty:1/e,attach:f=>(s.activeTexture(s.TEXTURE0+f),s.bindTexture(s.TEXTURE_2D,u),f)}}_double(i,e,t,r){let s=this._fbo(i,e,t,r),u=this._fbo(i,e,t,r);return{w:i,h:e,tx:s.tx,ty:s.ty,get read(){return s},set read(o){s=o},get write(){return u},set write(o){u=o},swap(){const o=s;s=u,u=o}}}_res(i){const e=this.gl;let t=e.drawingBufferWidth/e.drawingBufferHeight;t<1&&(t=1/t);const r=Math.round(i),s=Math.round(i*t);return e.drawingBufferWidth>e.drawingBufferHeight?{w:s,h:r}:{w:r,h:s}}resize(){if(!this.gl)return;const i=this.cv.getBoundingClientRect();if(!i.width||!i.height)return;const e=this.o.renderScale,t=Math.max(8,Math.round(i.width*e)),r=Math.max(8,Math.round(i.height*e));if(this.cv.width===t&&this.cv.height===r&&this.dye)return;this.cv.width=t,this.cv.height=r,this.W=i.width,this.H=i.height;const s=this.gl,u=this._res(this.o.simRes),o=this._res(this.o.dyeRes);this._freeTargets(),s.clearColor(0,0,0,0),this.dye=this._double(o.w,o.h,this.fRGBA,s.LINEAR),this.vel=this._double(u.w,u.h,this.fRG,s.LINEAR),this.div=this._fbo(u.w,u.h,this.fR,s.NEAREST),this.crl=this._fbo(u.w,u.h,this.fR,s.NEAREST),this.prs=this._double(u.w,u.h,this.fR,s.NEAREST)}_freeTargets(){const i=this.gl,e=t=>{t&&(i.deleteTexture(t.tex),i.deleteFramebuffer(t.fbo))};for(const t of[this.dye,this.vel,this.prs])t&&(e(t.read),e(t.write));e(this.div),e(this.crl),this.dye=this.vel=this.prs=this.div=this.crl=null}destroy(){var e;if(!this.gl)return;const i=this.gl;this._freeTargets();for(const t of Object.values(this.prog||{}))i.deleteProgram(t.p);for(const t of this._quadBufs||[])i.deleteBuffer(t);this.vao&&i.deleteVertexArray(this.vao),(e=i.getExtension("WEBGL_lose_context"))==null||e.loseContext(),this.ok=!1}_blit(i){const e=this.gl;i?(e.viewport(0,0,i.w,i.h),e.bindFramebuffer(e.FRAMEBUFFER,i.fbo)):(e.viewport(0,0,this.cv.width,this.cv.height),e.bindFramebuffer(e.FRAMEBUFFER,null)),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)}_texel(i,e){this.gl.uniform2f(i.texelSize,e.tx,e.ty)}splat(i,e,t,r,s,u){this.ok&&(this._queue.push({x:i,y:e,dx:t,dy:r,col:s,rad:u||40}),this._queue.length>24&&this._queue.splice(0,this._queue.length-24))}_uv(i,e,t){return[(t.center.x+i)/this.W,1-(t.center.y+e)/this.H]}_applySplats(i){if(!this._queue.length)return;const e=this.gl,t=this.W/this.H,r=this.prog.splat.bind();for(const s of this._queue){const[u,o]=this._uv(s.x,s.y,i),f=Math.pow(Math.max(s.rad,4)/this.H,2);e.uniform1f(r.aspectRatio,t),e.uniform2f(r.point,u,o),e.uniform1f(r.radius,f),e.uniform1i(r.uTarget,this.vel.read.attach(0)),e.uniform3f(r.color,s.dx*this.vel.w/this.W,-s.dy*this.vel.h/this.H,0),this._blit(this.vel.write),this.vel.swap(),s.col&&(e.uniform1i(r.uTarget,this.dye.read.attach(0)),e.uniform3f(r.color,s.col.r,s.col.g,s.col.b),this._blit(this.dye.write),this.dye.swap())}this._queue.length=0}_prime(i){const e=i.R;for(let t=0;t<16;t++){const r=this.rnd()*Math.PI*2,s=e*(.08+.72*Math.sqrt(this.rnd())),u=B(U(this.hue+(this.rnd()-.5)*.3),.6+this.rnd()*.35,1),o=70+this.rnd()*110;this.splat(Math.cos(r)*s,Math.sin(r)*s,-Math.sin(r)*o,Math.cos(r)*o,{r:u.r*.5,g:u.g*.5,b:u.b*.5},e*(.15+.17*this.rnd()))}}frame(i,e){if(!this.ok)return;const t=this.gl;(!this.cv.width||!this.W)&&this.resize(),this.dye&&(i=Math.min(i,1/60),this.time+=i,this._stepPalette(i,e),this._emitters(e),this._primed||(this._primed=!0,this._prime(e)),t.disable(t.BLEND),t.bindVertexArray(this.vao),this._applySplats(e),this._force(i,e),this._project(i),this._advect(i),this._emit(i,e),this._display(e),t.bindVertexArray(null),t.bindFramebuffer(t.FRAMEBUFFER,null))}_force(i,e){const t=this.gl,r=this.prog.force.bind();this._texel(r,this.vel),t.uniform1i(r.uVelocity,this.vel.read.attach(0));const[s,u]=this._uv(0,0,e),o=this.W/this.H,f=e.R/this.H,v=this.vel.h/this.H;t.uniform2f(r.uCenter,s,u),t.uniform1f(r.uAspect,o),t.uniform1f(r.uR,f),t.uniform1f(r.uDt,i),t.uniform1f(r.uTime,this.time),t.uniform1f(r.uAwake,e.awake),t.uniform1f(r.uWall,940*v),t.uniform1f(r.uOut,(110+190*e.pleasure)*v*(.4+.6*e.awake)),t.uniform1f(r.uSwirl,e.swirl*11*v),t.uniform1f(r.uTurb,(70+190*e.noise+110*e.stress)*v);const m=this.em,d=2.4;for(const[h,c]of[["uEmA",m.a],["uEmB",m.b]]){const[g,T]=this._uv(c.x,c.y,e);t.uniform4f(r[h],g,T,c.vx*v*d,-c.vy*v*d)}t.uniform2f(r.uEmR,Math.pow(m.a.r/this.H,2),Math.pow(m.b.r/this.H,2));const a=new Float32Array(32),l=Math.min(e.vortices.length,8);for(let h=0;h<l;h++){const c=e.vortices[h],[g,T]=this._uv(c.x,c.y,e);a[h*4]=g,a[h*4+1]=T,a[h*4+2]=c.s*.06*v,a[h*4+3]=c.life}t.uniform4fv(r.uVort,a),t.uniform1i(r.uVortN,l);const E=new Float32Array(8),C=new Float32Array(2);for(let h=0;h<Math.min(e.bullets.length,2);h++){const c=e.bullets[h],[g,T]=this._uv(c.x,c.y,e);E[h*4]=g,E[h*4+1]=T,E[h*4+2]=c.dx,E[h*4+3]=-c.dy,C[h]=c.on*100*v}t.uniform4fv(r.uBul,E),t.uniform2fv(r.uBulOn,C);const _=new Float32Array(8),D=Math.min(e.pushes.length,2);for(let h=0;h<D;h++){const c=e.pushes[h],[g,T]=this._uv(c.x,c.y,e);_[h*4]=g,_[h*4+1]=T,_[h*4+2]=c.r/this.H,_[h*4+3]=c.s*v}t.uniform4fv(r.uPush,_),t.uniform1i(r.uPushN,D),this._blit(this.vel.write),this.vel.swap()}_project(i){const e=this.gl;let t=this.prog.curl.bind();this._texel(t,this.vel),e.uniform1i(t.uVelocity,this.vel.read.attach(0)),this._blit(this.crl),t=this.prog.vorticity.bind(),this._texel(t,this.vel),e.uniform1i(t.uVelocity,this.vel.read.attach(0)),e.uniform1i(t.uCurl,this.crl.attach(1)),e.uniform1f(t.curl,this.o.curl),e.uniform1f(t.dt,i),this._blit(this.vel.write),this.vel.swap(),t=this.prog.divergence.bind(),this._texel(t,this.vel),e.uniform1i(t.uVelocity,this.vel.read.attach(0)),this._blit(this.div),t=this.prog.clear.bind(),this._texel(t,this.prs),e.uniform1i(t.uTexture,this.prs.read.attach(0)),e.uniform1f(t.value,this.o.pressure),this._blit(this.prs.write),this.prs.swap(),t=this.prog.pressure.bind(),this._texel(t,this.prs),e.uniform1i(t.uDivergence,this.div.attach(0));for(let r=0;r<this.o.pressureIterations;r++)e.uniform1i(t.uPressure,this.prs.read.attach(1)),this._blit(this.prs.write),this.prs.swap();t=this.prog.gradient.bind(),this._texel(t,this.prs),e.uniform1i(t.uPressure,this.prs.read.attach(0)),e.uniform1i(t.uVelocity,this.vel.read.attach(1)),this._blit(this.vel.write),this.vel.swap()}_advect(i){const e=this.gl,t=this.prog.advect.bind();this._texel(t,this.vel),e.uniform1f(t.dt,i),e.uniform1i(t.uVelocity,this.vel.read.attach(0)),e.uniform1i(t.uSource,this.vel.read.attach(0)),e.uniform1f(t.dissipation,this.o.velocityDissipation),this._blit(this.vel.write),this.vel.swap(),e.uniform1i(t.uVelocity,this.vel.read.attach(0)),e.uniform1i(t.uSource,this.dye.read.attach(1)),e.uniform1f(t.dissipation,this.o.densityDissipation),this._blit(this.dye.write),this.dye.swap()}_emit(i,e){const t=this.gl,r=this.prog.emit.bind();t.uniform1i(r.uTarget,this.dye.read.attach(0));const[s,u]=this._uv(0,0,e),o=this.em,[f,v]=this._uv(o.a.x,o.a.y,e),[m,d]=this._uv(o.b.x,o.b.y,e),a=e.emit*(.55+.45*e.awake);t.uniform2f(r.uCenter,s,u),t.uniform1f(r.uAspect,this.W/this.H),t.uniform1f(r.uR,e.R/this.H),t.uniform2f(r.uA,f,v),t.uniform2f(r.uB,m,d),t.uniform1f(r.uRA,Math.pow(o.a.r/this.H,2)),t.uniform1f(r.uRB,Math.pow(o.b.r/this.H,2)),t.uniform1f(r.uAmtA,2.6*a*i),t.uniform1f(r.uAmtB,3.4*a*i),t.uniform3f(r.uColA,o.a.col.r,o.a.col.g,o.a.col.b),t.uniform3f(r.uColB,o.b.col.r,o.b.col.g,o.b.col.b),t.uniform1f(r.uHold,Math.pow(.02,i)),this._blit(this.dye.write),this.dye.swap()}_display(i){const e=this.gl,t=this.prog.display.bind();e.uniform2f(t.texelSize,this.dye.tx,this.dye.ty),e.uniform1i(t.uTexture,this.dye.read.attach(0));const[r,s]=this._uv(0,0,i);e.uniform2f(t.uCenter,r,s),e.uniform1f(t.uAspect,this.W/this.H),e.uniform1f(t.uR,i.R/this.H),e.uniform1f(t.uAlpha,i.alpha),e.uniform1f(t.uDim,1-.45*i.mood),e.uniform1f(t.uShift,i.shift),e.uniform3f(t.uRed,224/255,72/255,72/255),e.clearColor(0,0,0,0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.cv.width,this.cv.height),e.clear(e.COLOR_BUFFER_BIT),this._blit(null)}}k("fi");const y=Y(),{COL:b,SLOTS:ot,FEEDERS:ut,SERIES:dt,GRIP_T:nt,COSTS:at,RECOVERY:mt}=y,F=window.__FI={glyphs:{}},L=document.getElementById("glyphHero");if(L){const n=new A(L,{seed:7,coreGlow:1,Fluid:w,COL:b,fluid:{dyeRes:512}});n.setTarget({scale:1,fidelity:.95,latency:0,noise:0,duty:1,control:1}),n.start(),F.glyphs.hero=n}z({costs:at,fnLabel:"Fi",gripT:nt,gripInto:"Te"});const V=document.getElementById("glyphRail");if(V){const n=new A(V,{seed:21,coreGlow:.9,Fluid:w,COL:b});n.bombard=!0,n.start(),F.glyphs.rail=n,q({slots:ot,glyph:n})}const I=document.getElementById("feederCanvas");if(I){const n=new A(I,{seed:33,coreGlow:.85,interactive:!1,Fluid:w,COL:b});n.setTarget({scale:.8,fidelity:.9,latency:0,noise:0,duty:1,control:1}),n.start(),F.glyphs.feeder=n,W({feeders:ut,glyph:n,fnLabel:"Fi"})}const G=document.getElementById("verifyCanvas");if(G){let m=function(){if(!t||!r)return;const a=Math.round(n.stress*100),l=Math.round(n.pleasure*100);t.style.width=a+"%",s.textContent=a+"%",r.style.width=l+"%",u.textContent=l+"%"},d=function(a){if(!P)return;const l=Math.round(a*30);for(let E=0;E<l;E++)n.step(1/30);n.draw(),m()};const n=new A(G,{seed:55,coreGlow:.95,Fluid:w,COL:b});n.setTarget({scale:.85,fidelity:.92,latency:0,noise:0,duty:1,control:.7}),n.setStructure({countMul:1.1,k:3,rigidity:.55}),n.start(),F.glyphs.verify=n;const i=document.getElementById("verifyNarr"),e=["btnAuthGood","btnAuthBad","btnFakeGood","btnFakeBad"].map(a=>document.getElementById(a)),t=document.getElementById("mStress"),r=document.getElementById("mPleasure"),s=document.getElementById("mStressVal"),u=document.getElementById("mPleasureVal");let o=0;const f=a=>{i&&(i.textContent=a)},v=(a,l,E)=>setTimeout(()=>{a===o&&E()},l);P||(function a(){m(),requestAnimationFrame(a)})(),e[0]&&e[0].addEventListener("click",()=>{o++,n.spawnSub("authGood",{color:"#f0b95c"}),f(y.VERIFY.narrations.authGood),d(4.5)}),e[1]&&e[1].addEventListener("click",()=>{o++,n.spawnSub("authBad",{color:"#6272dd"}),f(y.VERIFY.narrations.authBad),d(4.5)}),e[2]&&e[2].addEventListener("click",()=>{o++;const a=o;n.spawnSub("fakeGood",{color:"#ffd9e6"}),f(y.VERIFY.narrations.fakeGood),d(3),v(a,3200,()=>{f(y.VERIFY.narrations.fakeGoodEnd),d(2.5)})}),e[3]&&e[3].addEventListener("click",()=>{o++;const a=o;e.forEach(l=>{l&&(l.disabled=!0)}),n.spawnSub("fakeBad",{color:b.crit}),f(y.VERIFY.narrations.fakeBad),d(2.2),v(a,2e3,()=>{f(y.VERIFY.narrations.fakeBadMid),d(2.5)}),v(a,7200,()=>{f(y.VERIFY.narrations.fakeBadEnd),d(6),e.forEach(l=>{l&&(l.disabled=!1)})})})}
