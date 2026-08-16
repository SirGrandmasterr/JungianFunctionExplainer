import{i as O}from"./header-BaFUgrvS.js";import{m as H,h as X,r as q,c as M,l as P,a as C,C as v,R as U}from"./math-DT21pYWd.js";import{i as z,a as W,b as Y}from"./energy-charts-DYEflvhl.js";import{F as k}from"./fi-glyph-D1YvHVI9.js";const D=o=>o-Math.floor(o),b=`#version 300 es
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
void main(){ fragColor = value * texture(uTexture, vUv); }`,J=x+`
uniform sampler2D uTarget;
uniform float aspectRatio, radius;
uniform vec3 color;
uniform vec2 point;
void main(){
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,Z=x+`
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,Q=x+`
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
}`,K=x+`
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,$=x+`
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
}`,ee=x+`
uniform sampler2D uPressure, uDivergence;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,te=x+`
uniform sampler2D uPressure, uVelocity;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`,ie=x+`
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
}`,re=x+`
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
}`,se=x+`
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
}`;function I(o,r,t){const e=o.createShader(r);if(o.shaderSource(e,t),o.compileShader(e),!o.getShaderParameter(e,o.COMPILE_STATUS))throw new Error(o.getShaderInfoLog(e));return e}class w{constructor(r,t,e){this.gl=r;const i=r.createProgram();if(r.attachShader(i,I(r,r.VERTEX_SHADER,t)),r.attachShader(i,I(r,r.FRAGMENT_SHADER,e)),r.linkProgram(i),!r.getProgramParameter(i,r.LINK_STATUS))throw new Error(r.getProgramInfoLog(i));this.p=i,this.u={};const s=r.getProgramParameter(i,r.ACTIVE_UNIFORMS);for(let n=0;n<s;n++){const a=r.getActiveUniform(i,n).name.replace(/\[0\]$/,"");this.u[a]=r.getUniformLocation(i,a)}}bind(){return this.gl.useProgram(this.p),this.u}}class B{constructor(r,t={}){this.ok=!1,this.cv=r,this.o=Object.assign({simRes:128,dyeRes:384,pressureIterations:12,curl:34,densityDissipation:.6,velocityDissipation:.22,pressure:.8,renderScale:.75,seed:7,baseColor:"#f56a8c"},t),this.time=0,this.rnd=H(this.o.seed*7919+13),this._queue=[],this._initPalette();try{const e=r.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1});if(!e)return;this.gl=e,e.getExtension("EXT_color_buffer_float"),e.getExtension("EXT_color_buffer_half_float");const i=e.HALF_FLOAT;if(this.fRGBA=this._format(e.RGBA16F,e.RGBA,i),!this.fRGBA)return;this.fRG=this._format(e.RG16F,e.RG,i)||this.fRGBA,this.fR=this._format(e.R16F,e.RED,i)||this.fRG,this._initQuad(),this.prog={clear:new w(e,b,j),splat:new w(e,b,J),advect:new w(e,b,Z),divergence:new w(e,b,Q),curl:new w(e,b,K),vorticity:new w(e,b,$),pressure:new w(e,b,ee),gradient:new w(e,b,te),force:new w(e,b,ie),emit:new w(e,b,re),display:new w(e,b,se)},this.ok=!0,this.resize()}catch{this.ok=!1}}_initPalette(){const r=X(this.o.baseColor);this.anchor=q(r.r/255,r.g/255,r.b/255),this.hue=this.anchor,this.hueTarget=this.anchor,this.spin=0,this.spinRate=1,this._hueT=0,this.tint={r:r.r,g:r.g,b:r.b}}_stepPalette(r,t){if(this._hueT-=r,this._hueT<=0){const s=.26+.14*M(t.noise*1.5+t.stress,0,1);this.hueTarget=this.anchor+(this.rnd()-.5)*2*s,this._hueT=.5+this.rnd()*1.6}const e=P(this.hueTarget,.005,t.shift*.8);this.hue=P(this.hue,e,1-Math.pow(.25,r)),this.spinRate=.55+.75*t.awake,this.spin+=r*this.spinRate;const i=C(D(this.hue),.82,1);this.tint={r:i.r*255,g:i.g*255,b:i.b*255}}_emitters(r){const t=r.R,e=this.spinRate,i=(a,u,m,y,p,h)=>{const d=t*u;return{x:Math.cos(a)*d,y:Math.sin(a)*d,vx:-Math.sin(a)*d*m*e,vy:Math.cos(a)*d*m*e,r:t*h,col:C(D(y),p,1)}},s=2.05,n=-1.35;this.em={a:i(this.spin*s,.3+.11*Math.sin(this.spin*.63),s,this.hue,.8,.2),b:i(this.spin*n+2.1,.46+.15*Math.sin(this.spin*.41+2),n,this.hue+.28*Math.sin(this.spin*.37),.95,.12)}}_format(r,t,e){const i=this.gl,s=i.createTexture();i.bindTexture(i.TEXTURE_2D,s),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.texImage2D(i.TEXTURE_2D,0,r,4,4,0,t,e,null);const n=i.createFramebuffer();i.bindFramebuffer(i.FRAMEBUFFER,n),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,s,0);const a=i.checkFramebufferStatus(i.FRAMEBUFFER)===i.FRAMEBUFFER_COMPLETE;return i.bindFramebuffer(i.FRAMEBUFFER,null),i.deleteFramebuffer(n),i.deleteTexture(s),a?{internal:r,format:t,type:e}:null}_initQuad(){const r=this.gl;this.vao=r.createVertexArray(),r.bindVertexArray(this.vao);const t=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,t),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),r.STATIC_DRAW);const e=r.createBuffer();r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e),r.bufferData(r.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),r.STATIC_DRAW),r.enableVertexAttribArray(0),r.vertexAttribPointer(0,2,r.FLOAT,!1,0,0),r.bindVertexArray(null),this._quadBufs=[t,e]}_fbo(r,t,e,i){const s=this.gl,n=s.createTexture();s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,n),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,i),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,i),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),s.texImage2D(s.TEXTURE_2D,0,e.internal,r,t,0,e.format,e.type,null);const a=s.createFramebuffer();return s.bindFramebuffer(s.FRAMEBUFFER,a),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,n,0),s.viewport(0,0,r,t),s.clear(s.COLOR_BUFFER_BIT),s.bindFramebuffer(s.FRAMEBUFFER,null),{tex:n,fbo:a,w:r,h:t,tx:1/r,ty:1/t,attach:u=>(s.activeTexture(s.TEXTURE0+u),s.bindTexture(s.TEXTURE_2D,n),u)}}_double(r,t,e,i){let s=this._fbo(r,t,e,i),n=this._fbo(r,t,e,i);return{w:r,h:t,tx:s.tx,ty:s.ty,get read(){return s},set read(a){s=a},get write(){return n},set write(a){n=a},swap(){const a=s;s=n,n=a}}}_res(r){const t=this.gl;let e=t.drawingBufferWidth/t.drawingBufferHeight;e<1&&(e=1/e);const i=Math.round(r),s=Math.round(r*e);return t.drawingBufferWidth>t.drawingBufferHeight?{w:s,h:i}:{w:i,h:s}}resize(){if(!this.gl)return;const r=this.cv.getBoundingClientRect();if(!r.width||!r.height)return;const t=this.o.renderScale,e=Math.max(8,Math.round(r.width*t)),i=Math.max(8,Math.round(r.height*t));if(this.cv.width===e&&this.cv.height===i&&this.dye)return;this.cv.width=e,this.cv.height=i,this.W=r.width,this.H=r.height;const s=this.gl,n=this._res(this.o.simRes),a=this._res(this.o.dyeRes);this._freeTargets(),s.clearColor(0,0,0,0),this.dye=this._double(a.w,a.h,this.fRGBA,s.LINEAR),this.vel=this._double(n.w,n.h,this.fRG,s.LINEAR),this.div=this._fbo(n.w,n.h,this.fR,s.NEAREST),this.crl=this._fbo(n.w,n.h,this.fR,s.NEAREST),this.prs=this._double(n.w,n.h,this.fR,s.NEAREST)}_freeTargets(){const r=this.gl,t=e=>{e&&(r.deleteTexture(e.tex),r.deleteFramebuffer(e.fbo))};for(const e of[this.dye,this.vel,this.prs])e&&(t(e.read),t(e.write));t(this.div),t(this.crl),this.dye=this.vel=this.prs=this.div=this.crl=null}destroy(){var t;if(!this.gl)return;const r=this.gl;this._freeTargets();for(const e of Object.values(this.prog||{}))r.deleteProgram(e.p);for(const e of this._quadBufs||[])r.deleteBuffer(e);this.vao&&r.deleteVertexArray(this.vao),(t=r.getExtension("WEBGL_lose_context"))==null||t.loseContext(),this.ok=!1}_blit(r){const t=this.gl;r?(t.viewport(0,0,r.w,r.h),t.bindFramebuffer(t.FRAMEBUFFER,r.fbo)):(t.viewport(0,0,this.cv.width,this.cv.height),t.bindFramebuffer(t.FRAMEBUFFER,null)),t.drawElements(t.TRIANGLES,6,t.UNSIGNED_SHORT,0)}_texel(r,t){this.gl.uniform2f(r.texelSize,t.tx,t.ty)}splat(r,t,e,i,s,n){this.ok&&(this._queue.push({x:r,y:t,dx:e,dy:i,col:s,rad:n||40}),this._queue.length>24&&this._queue.splice(0,this._queue.length-24))}_uv(r,t,e){return[(e.center.x+r)/this.W,1-(e.center.y+t)/this.H]}_applySplats(r){if(!this._queue.length)return;const t=this.gl,e=this.W/this.H,i=this.prog.splat.bind();for(const s of this._queue){const[n,a]=this._uv(s.x,s.y,r),u=Math.pow(Math.max(s.rad,4)/this.H,2);t.uniform1f(i.aspectRatio,e),t.uniform2f(i.point,n,a),t.uniform1f(i.radius,u),t.uniform1i(i.uTarget,this.vel.read.attach(0)),t.uniform3f(i.color,s.dx*this.vel.w/this.W,-s.dy*this.vel.h/this.H,0),this._blit(this.vel.write),this.vel.swap(),s.col&&(t.uniform1i(i.uTarget,this.dye.read.attach(0)),t.uniform3f(i.color,s.col.r,s.col.g,s.col.b),this._blit(this.dye.write),this.dye.swap())}this._queue.length=0}_prime(r){const t=r.R;for(let e=0;e<16;e++){const i=this.rnd()*Math.PI*2,s=t*(.08+.72*Math.sqrt(this.rnd())),n=C(D(this.hue+(this.rnd()-.5)*.3),.6+this.rnd()*.35,1),a=70+this.rnd()*110;this.splat(Math.cos(i)*s,Math.sin(i)*s,-Math.sin(i)*a,Math.cos(i)*a,{r:n.r*.5,g:n.g*.5,b:n.b*.5},t*(.15+.17*this.rnd()))}}frame(r,t){if(!this.ok)return;const e=this.gl;(!this.cv.width||!this.W)&&this.resize(),this.dye&&(r=Math.min(r,1/60),this.time+=r,this._stepPalette(r,t),this._emitters(t),this._primed||(this._primed=!0,this._prime(t)),e.disable(e.BLEND),e.bindVertexArray(this.vao),this._applySplats(t),this._force(r,t),this._project(r),this._advect(r),this._emit(r,t),this._display(t),e.bindVertexArray(null),e.bindFramebuffer(e.FRAMEBUFFER,null))}_force(r,t){const e=this.gl,i=this.prog.force.bind();this._texel(i,this.vel),e.uniform1i(i.uVelocity,this.vel.read.attach(0));const[s,n]=this._uv(0,0,t),a=this.W/this.H,u=t.R/this.H,m=this.vel.h/this.H;e.uniform2f(i.uCenter,s,n),e.uniform1f(i.uAspect,a),e.uniform1f(i.uR,u),e.uniform1f(i.uDt,r),e.uniform1f(i.uTime,this.time),e.uniform1f(i.uAwake,t.awake),e.uniform1f(i.uWall,940*m),e.uniform1f(i.uOut,(110+190*t.pleasure)*m*(.4+.6*t.awake)),e.uniform1f(i.uSwirl,t.swirl*11*m),e.uniform1f(i.uTurb,(70+190*t.noise+110*t.stress)*m);const y=this.em,p=2.4;for(const[c,f]of[["uEmA",y.a],["uEmB",y.b]]){const[E,R]=this._uv(f.x,f.y,t);e.uniform4f(i[c],E,R,f.vx*m*p,-f.vy*m*p)}e.uniform2f(i.uEmR,Math.pow(y.a.r/this.H,2),Math.pow(y.b.r/this.H,2));const h=new Float32Array(32),d=Math.min(t.vortices.length,8);for(let c=0;c<d;c++){const f=t.vortices[c],[E,R]=this._uv(f.x,f.y,t);h[c*4]=E,h[c*4+1]=R,h[c*4+2]=f.s*.06*m,h[c*4+3]=f.life}e.uniform4fv(i.uVort,h),e.uniform1i(i.uVortN,d);const g=new Float32Array(8),A=new Float32Array(2);for(let c=0;c<Math.min(t.bullets.length,2);c++){const f=t.bullets[c],[E,R]=this._uv(f.x,f.y,t);g[c*4]=E,g[c*4+1]=R,g[c*4+2]=f.dx,g[c*4+3]=-f.dy,A[c]=f.on*100*m}e.uniform4fv(i.uBul,g),e.uniform2fv(i.uBulOn,A);const l=new Float32Array(8),F=Math.min(t.pushes.length,2);for(let c=0;c<F;c++){const f=t.pushes[c],[E,R]=this._uv(f.x,f.y,t);l[c*4]=E,l[c*4+1]=R,l[c*4+2]=f.r/this.H,l[c*4+3]=f.s*m}e.uniform4fv(i.uPush,l),e.uniform1i(i.uPushN,F),this._blit(this.vel.write),this.vel.swap()}_project(r){const t=this.gl;let e=this.prog.curl.bind();this._texel(e,this.vel),t.uniform1i(e.uVelocity,this.vel.read.attach(0)),this._blit(this.crl),e=this.prog.vorticity.bind(),this._texel(e,this.vel),t.uniform1i(e.uVelocity,this.vel.read.attach(0)),t.uniform1i(e.uCurl,this.crl.attach(1)),t.uniform1f(e.curl,this.o.curl),t.uniform1f(e.dt,r),this._blit(this.vel.write),this.vel.swap(),e=this.prog.divergence.bind(),this._texel(e,this.vel),t.uniform1i(e.uVelocity,this.vel.read.attach(0)),this._blit(this.div),e=this.prog.clear.bind(),this._texel(e,this.prs),t.uniform1i(e.uTexture,this.prs.read.attach(0)),t.uniform1f(e.value,this.o.pressure),this._blit(this.prs.write),this.prs.swap(),e=this.prog.pressure.bind(),this._texel(e,this.prs),t.uniform1i(e.uDivergence,this.div.attach(0));for(let i=0;i<this.o.pressureIterations;i++)t.uniform1i(e.uPressure,this.prs.read.attach(1)),this._blit(this.prs.write),this.prs.swap();e=this.prog.gradient.bind(),this._texel(e,this.prs),t.uniform1i(e.uPressure,this.prs.read.attach(0)),t.uniform1i(e.uVelocity,this.vel.read.attach(1)),this._blit(this.vel.write),this.vel.swap()}_advect(r){const t=this.gl,e=this.prog.advect.bind();this._texel(e,this.vel),t.uniform1f(e.dt,r),t.uniform1i(e.uVelocity,this.vel.read.attach(0)),t.uniform1i(e.uSource,this.vel.read.attach(0)),t.uniform1f(e.dissipation,this.o.velocityDissipation),this._blit(this.vel.write),this.vel.swap(),t.uniform1i(e.uVelocity,this.vel.read.attach(0)),t.uniform1i(e.uSource,this.dye.read.attach(1)),t.uniform1f(e.dissipation,this.o.densityDissipation),this._blit(this.dye.write),this.dye.swap()}_emit(r,t){const e=this.gl,i=this.prog.emit.bind();e.uniform1i(i.uTarget,this.dye.read.attach(0));const[s,n]=this._uv(0,0,t),a=this.em,[u,m]=this._uv(a.a.x,a.a.y,t),[y,p]=this._uv(a.b.x,a.b.y,t),h=t.emit*(.55+.45*t.awake);e.uniform2f(i.uCenter,s,n),e.uniform1f(i.uAspect,this.W/this.H),e.uniform1f(i.uR,t.R/this.H),e.uniform2f(i.uA,u,m),e.uniform2f(i.uB,y,p),e.uniform1f(i.uRA,Math.pow(a.a.r/this.H,2)),e.uniform1f(i.uRB,Math.pow(a.b.r/this.H,2)),e.uniform1f(i.uAmtA,2.6*h*r),e.uniform1f(i.uAmtB,3.4*h*r),e.uniform3f(i.uColA,a.a.col.r,a.a.col.g,a.a.col.b),e.uniform3f(i.uColB,a.b.col.r,a.b.col.g,a.b.col.b),e.uniform1f(i.uHold,Math.pow(.02,r)),this._blit(this.dye.write),this.dye.swap()}_display(r){const t=this.gl,e=this.prog.display.bind();t.uniform2f(e.texelSize,this.dye.tx,this.dye.ty),t.uniform1i(e.uTexture,this.dye.read.attach(0));const[i,s]=this._uv(0,0,r);t.uniform2f(e.uCenter,i,s),t.uniform1f(e.uAspect,this.W/this.H),t.uniform1f(e.uR,r.R/this.H),t.uniform1f(e.uAlpha,r.alpha),t.uniform1f(e.uDim,1-.45*r.mood),t.uniform1f(e.uShift,r.shift),t.uniform3f(e.uRed,224/255,72/255,72/255),t.clearColor(0,0,0,0),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.cv.width,this.cv.height),t.clear(t.COLOR_BUFFER_BIT),this._blit(null)}}function oe(){const o={fn:v("--c-accent"),n:v("--c-n"),s:v("--c-s"),f:v("--c-f"),pos:[v("--pos-1"),v("--pos-2"),v("--pos-3"),v("--pos-4")],sh:v("--pos-sh"),warn:v("--warn"),crit:v("--crit"),ink:v("--ink"),ink2:v("--ink-2"),muted:v("--muted"),grid:v("--grid"),axis:v("--axis"),surface:v("--surface")},r=[{key:"dominant",name:"Dominant",sub:"1st · hero",types:"INFP · ISFP",shadow:!1,series:0,params:{scale:1,fidelity:.95,latency:0,noise:0,duty:1,control:1,contrary:0},dial:[.95,.95,.9,.95,.9],text:"The world is measured against an inner tone. Conviction is effortless and constant — not argued, simply known. The core burns steady; the hierarchy of what matters is deep, calm, and exact."},{key:"auxiliary",name:"Auxiliary",sub:"2nd · parent",types:"ENFP · ESFP",shadow:!1,series:1,params:{scale:.8,fidelity:.85,latency:80,noise:.05,duty:.85,control:.9,contrary:0},dial:[.8,.85,.8,.85,.78],text:'The compass behind the explorer. Fi here vets what the dominant perceiver drags home — "is this us? could I live with this?" — quiet in the background, decisive at exactly the moments that matter.'},{key:"tertiary",name:"Tertiary",sub:"3rd · eternal child",types:"ISTJ · INTJ",shadow:!1,series:2,params:{scale:.55,fidelity:.6,latency:250,noise:.2,duty:.5,control:.6,contrary:0},dial:[.5,.55,.5,.55,.45],text:'A private moral sense, real but narrow — fierce loyalty to a few people and principles, guarded like contraband and dismissed in public as "just being practical". It blooms, quietly, with age.'},{key:"inferior",name:"Inferior",sub:"4th · aspirational",types:"ESTJ · ENTJ",shadow:!1,series:3,params:{scale:.4,fidelity:.35,latency:700,noise:.45,duty:.25,control:.35,contrary:0},dial:[.25,.3,.3,.3,.35],text:`Feeling arrives late and off-balance. Long stretches of "emotions are noise in the data", punctuated — under stress — by waves of wounded, moralizing sentiment that don't sound like them at all.`},{key:"opposing",name:"Opposing",sub:"5th · shadow",types:"ENFJ · ESFJ",shadow:!0,series:4,params:{scale:.46,fidelity:.42,latency:600,noise:.5,duty:.45,control:.4,contrary:.25},dial:[.35,.4,.5,.3,.2],text:`The stubborn conscience. When their Fe harmonizing is challenged, Fi wakes up contrary — "I don't care what the room needs, this is where I stand" — protective, prickly, and briefly immovable.`},{key:"critical",name:"Critical Parent",sub:"6th · shadow",types:"INFJ · ISFJ",shadow:!0,series:4,params:{scale:.44,fidelity:.35,latency:900,noise:.55,duty:.35,control:.3,contrary:.35},dial:[.3,.45,.4,.25,.15],text:'An inner voice that interrogates the heart: "do you even know what you want? your feelings are self-indulgent." Harsh, sporadic, and aimed mostly at the self.'},{key:"trickster",name:"Trickster",sub:"7th · shadow",types:"ESTP · ENTP",shadow:!0,series:4,params:{scale:.42,fidelity:.28,latency:1200,noise:.6,duty:.3,control:.2,contrary:.55},dial:[.2,.25,.35,.15,.1],text:"Personal conviction as a trap to wriggle out of. Asked what they truly feel, this position deflects with charm or contrarian play — blind, without malice, to the difference between a value and a preference."},{key:"demon",name:"Demon",sub:"8th · shadow",types:"ISTP · INTP",shadow:!0,series:4,params:{scale:.4,fidelity:.2,latency:1500,noise:.65,duty:.22,control:.12,contrary:.65},dial:[.15,.3,.25,.1,.05],text:"Rarely touched, and volcanic when it erupts: a conviction of worthlessness or betrayal so total it presents itself as objective fact — moral certainty aimed inward like a weapon."}],t=[{key:"ne",name:"Ne",color:o.n,canonical:!0,pair:"the INFP coupling",cfg:{rate:.36,branchy:.85,speed:.35,spread:.95,persistence:.35},text:"Moral imagination. Ne delivers forking possibilities, and each one is struck against the core — could I live with this? who would I be in that world? The hierarchy grows wide: many futures held lightly, waiting to see which ones ring true."},{key:"se",name:"Se",color:o.s,canonical:!0,pair:"the ISFP coupling",cfg:{rate:.58,branchy:0,speed:1,spread:.15,persistence:.95},text:"Embodied conviction. Se delivers the vivid, concrete present — Fi weighs what is actually here, now, in front of it. The hierarchy grows tight and lived-in: taste, beauty, and right-action felt in the hands rather than argued in the head."},{key:"si",name:"Si",color:"#c07f10",canonical:!1,pair:"the loop coupling (Fi–Si, INFP under stress)",cfg:{rate:.3,branchy:0,speed:.3,spread:.2,persistence:1},text:"Experience drawn from the archive rather than the world: old wounds and old kindnesses replayed against the core tone, verdicts re-felt instead of re-tested. Tender, airless, and increasingly detached from anything new — the visual signature of a cognitive loop."},{key:"ni",name:"Ni",color:"#7148d8",canonical:!1,pair:"a non-standard coupling",cfg:{rate:.15,branchy:.15,speed:.2,spread:.5,persistence:.7},text:"Speculative: a thin stream of pre-converged meaning. Fi receives few experiences but heavy ones — each arrival re-weighing the whole hierarchy at once. No standard stack places Ni directly above Fi."},{key:"te",name:"Te",color:"#3fb4c9",canonical:!1,unstable:!0,pair:"judging feeding judging",cfg:{rate:.12,branchy:0,speed:.3,spread:.4,persistence:.5},text:"Two sorters, no gatherer. Te hands Fi verdicts about efficiency rather than lived experience — the chamber idles hungry, with almost nothing arriving to weigh. This is why real stacks alternate perceiving and judging."}];function e(l){const F=20*Math.pow(l/60,1.25);let c=0;for(const[E,R]of[[16,8],[41,12],[68,9],[97,9]])l>=E&&(c+=R*M((l-E)/2,0,1));const f=l<2?0:1.6*Math.sin(l*.9)+1.2*Math.sin(l*2.3+1);return M(F+c+f,0,100)}const i=[{key:"dom",label:"Dominant",color:o.pos[0],f:l=>Math.max(0,13*(l/60)-2.2*Math.pow(Math.max(0,Math.sin(l/8.2)),3))},{key:"aux",label:"Auxiliary",color:o.pos[1],f:l=>21*Math.pow(l/60,1.08)},{key:"tert",label:"Tertiary",color:o.pos[2],f:l=>30*Math.pow(l/60,1.4)},{key:"inf",label:"Inferior",color:o.pos[3],f:l=>Math.min(100,82*Math.pow(l/60,1.9))},{key:"sh",label:"Shadow",color:o.sh,f:e}],s=60*Math.pow(100/82,1/1.9),n=[{label:"Dominant",v:1,color:o.pos[0],series:0},{label:"Auxiliary",v:1.5,color:o.pos[1],series:1},{label:"Tertiary",v:2.5,color:o.pos[2],series:2},{label:"Inferior",v:4,color:o.pos[3],series:3},{label:"Shadow",v:4.5,color:o.sh,band:[3,6],series:4}],a=[{label:"Dominant",color:o.pos[0],note:"Refills in minutes — and partially during use (flow).",f:l=>l<=30?100-i[0].f(l):u(0)+(100-u(0))*(1-Math.exp(-(l-30)/6))},{label:"Auxiliary",color:o.pos[1],note:"Quick, clean recovery.",f:l=>l<=30?100-i[1].f(l):u(1)+(100-u(1))*(1-Math.exp(-(l-30)/10))},{label:"Tertiary",color:o.pos[2],note:"A slower refill; rest must be deliberate.",f:l=>l<=30?100-i[2].f(l):u(2)+(100-u(2))*(1-Math.exp(-(l-30)/16))},{label:"Inferior",color:o.pos[3],note:"The hangover shelf: ~30 min where the whole system runs dim.",f:l=>l<=30?100-i[3].f(l):l<60?u(3):u(3)+(100-u(3))*(1-Math.exp(-(l-60)/20))},{label:"Shadow",color:o.sh,note:"Incomplete — some of the charge simply doesn't come back today.",f:l=>l<=30?100-i[4].f(l):u(4)+(93-u(4))*(1-Math.exp(-(l-30)/25))}];function u(l){return 100-i[l].f(30)}const m={buttons:[{id:"btnAuthGood",label:"Experience authentic joy",sub:"something true and resonant",color:"#f0b95c"},{id:"btnAuthBad",label:"Experience authentic grief",sub:"true, painful, held deeply",color:"#6272dd"},{id:"btnFakeGood",label:"Hear an inauthentic pleasantry",sub:"flattery glides off unabsorbed",color:"#ffd9e6"},{id:"btnFakeBad",label:"Witness an inauthentic violation",sub:"a falsehood tears the mist",color:o.crit}],narrations:{authGood:"Something joyful — and true — arrives. It rings against the core, diffuses deep into the nebula, and sets the mist gently turning. Pleasure blooms, and for a while the colour of the whole warms toward what was taken in.",authBad:"Something painful — and true. Fi does not flinch: the grief diffuses inward and the mist slows, darkens, and holds it. Stress rises, but so does resonance — this is not enjoyment, it is rightness. It, too, will colour the whole.",fakeGood:"Flattery arrives — pleasant, glossy, and hollow. The mist refuses to mix with it…",fakeGoodEnd:"…it glides along the inside of the chamber, dissolving nothing and being dissolved by nothing, is politely tolerated — and shown out exactly as it came. The nebula keeps none of it.",fakeBad:"A falsehood strikes what matters. It tears straight through the nebula — mist churns away from its path, a vacuum drags behind it —",fakeBadMid:"— and some of the mist bleeds out through the wound. The chamber red-shifts while everything attached to the wounded value finds a new place.",fakeBadEnd:"…the wound closes. The mist stills, the colour steadies — darker in places, rearranged in others. Fi keeps what was real, and remembers where it bled."}},y={tag:"introverted feeling",title:"Introverted Feeling",subtitle:"A quiet nebula around a core tone — weighing every experience against an unargued inner compass."},p={kicker:"Zone B · stack position",heading:"The Eight Faces of Fi",lede:"Click any position to see how the nebula changes — from the deep, steady conviction of a dominant to the volcanic, inward-facing moral certainty of the demon. Drag the maturity slider to watch the lower positions slowly gain fidelity with age."},h={kicker:"Zone C · feeder coupling",heading:"What Feeds Into Fi?",lede:"Every judging function needs a perceiving partner to deliver raw material. Click a feeder to watch how the nebula changes shape and motion."},d={kicker:"Zone D · verification lab",heading:"The Verification Lab",lede:"Watch Fi weigh experiences against its core tone in real time. Each button triggers a different lifecycle event inside the nebula."},g={kicker:"Zone E · energy economics",heading:"Energy Economics",lede:"Every invocation of Fi costs energy. The lower it sits in the stack, the more expensive it becomes — and the faster the battery drains."},A={kicker:"Zone F · field notes",heading:"Field Notes",lede:"Patterns from the wild — how Fi shows up in daily life.",mirror:{label:"Fi",counterpart:"Fe",counterpartColor:o.f},vignettes:[{title:"The Silent Compass",text:'An INFP sits quietly in a meeting where everyone agrees on a compromise. Suddenly they say "no" — not loudly, not with a ten-point argument, but with an absolute firmness that stops the room.'},{title:"The Loop",text:"Under stress, INFP Fi pairs with tertiary Si: replaying old wounds and old kindnesses against the core tone, re-feeling verdicts instead of re-testing them. Tender, airless, and detached from anything new."},{title:"The Inferior Eruption",text:"An ESTJ under stress suddenly breaks down into overwhelming, wounded moralizing — accusing others of betrayal and heartlessness with an intensity that startles everyone."}]};return{COL:o,SLOTS:r,FEEDERS:t,SERIES:i,GRIP_T:s,COSTS:n,RECOVERY:a,VERIFY:m,HERO:y,ZONE_B:p,ZONE_C:h,ZONE_D:d,ZONE_E:g,ZONE_F:A}}O("fi");const T=oe(),{COL:_,SLOTS:ae,FEEDERS:ne,SERIES:le,GRIP_T:ue,COSTS:he,RECOVERY:ce}=T,S=window.__FI={glyphs:{}},L=document.getElementById("glyphHero");if(L){const o=new k(L,{seed:7,coreGlow:1,Fluid:B,COL:_,fluid:{dyeRes:512}});o.setTarget({scale:1,fidelity:.95,latency:0,noise:0,duty:1,control:1}),o.start(),S.glyphs.hero=o}const de=z({series:le,costs:he,recovery:ce,fnLabel:"Fi",gripT:ue,gripNote:"forced inferior Fi"}),V=document.getElementById("glyphRail");if(V){const o=new k(V,{seed:21,coreGlow:.9,Fluid:B,COL:_});o.bombard=!0,o.start(),S.glyphs.rail=o,W({slots:ae,glyph:o,highlightSeries:de.highlightSeries})}const G=document.getElementById("feederCanvas");if(G){const o=new k(G,{seed:33,coreGlow:.85,interactive:!1,Fluid:B,COL:_});o.setTarget({scale:.8,fidelity:.9,latency:0,noise:0,duty:1,control:1}),o.start(),S.glyphs.feeder=o,Y({feeders:ne,glyph:o,fnLabel:"Fi"})}const N=document.getElementById("verifyCanvas");if(N){let y=function(){if(!e||!i)return;const h=Math.round(o.stress*100),d=Math.round(o.pleasure*100);e.style.width=h+"%",s.textContent=h+"%",i.style.width=d+"%",n.textContent=d+"%"},p=function(h){if(!U)return;const d=Math.round(h*30);for(let g=0;g<d;g++)o.step(1/30);o.draw(),y()};const o=new k(N,{seed:55,coreGlow:.95,Fluid:B,COL:_});o.setTarget({scale:.85,fidelity:.92,latency:0,noise:0,duty:1,control:.7}),o.setStructure({countMul:1.1,k:3,rigidity:.55}),o.start(),S.glyphs.verify=o;const r=document.getElementById("verifyNarr"),t=["btnAuthGood","btnAuthBad","btnFakeGood","btnFakeBad"].map(h=>document.getElementById(h)),e=document.getElementById("mStress"),i=document.getElementById("mPleasure"),s=document.getElementById("mStressVal"),n=document.getElementById("mPleasureVal");let a=0;const u=h=>{r&&(r.textContent=h)},m=(h,d,g)=>setTimeout(()=>{h===a&&g()},d);U||(function h(){y(),requestAnimationFrame(h)})(),t[0]&&t[0].addEventListener("click",()=>{a++,o.spawnSub("authGood",{color:"#f0b95c"}),u(T.VERIFY.narrations.authGood),p(4.5)}),t[1]&&t[1].addEventListener("click",()=>{a++,o.spawnSub("authBad",{color:"#6272dd"}),u(T.VERIFY.narrations.authBad),p(4.5)}),t[2]&&t[2].addEventListener("click",()=>{a++;const h=a;o.spawnSub("fakeGood",{color:"#ffd9e6"}),u(T.VERIFY.narrations.fakeGood),p(3),m(h,3200,()=>{u(T.VERIFY.narrations.fakeGoodEnd),p(2.5)})}),t[3]&&t[3].addEventListener("click",()=>{a++;const h=a;t.forEach(d=>{d&&(d.disabled=!0)}),o.spawnSub("fakeBad",{color:_.crit}),u(T.VERIFY.narrations.fakeBad),p(2.2),m(h,2e3,()=>{u(T.VERIFY.narrations.fakeBadMid),p(2.5)}),m(h,7200,()=>{u(T.VERIFY.narrations.fakeBadEnd),p(6),t.forEach(d=>{d&&(d.disabled=!1)})})})}
