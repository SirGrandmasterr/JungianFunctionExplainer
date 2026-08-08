/* ============================================================
   FI MIST — GPU nebula engine (WebGL2 transform feedback)
   ~50–90k fine grains per chamber, advected by the same force
   field the CPU proxy mist uses.
   Falls back silently (returns ok:false) when WebGL2 is
   unavailable — the 2D blob mist then renders instead.
   ============================================================ */

const UPDATE_VS = `#version 300 es
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
}`;

const UPDATE_FS = `#version 300 es
precision highp float;
out vec4 o;
void main(){ o = vec4(0.0); }`;

const RENDER_VS = `#version 300 es
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
}`;

const RENDER_FS = `#version 300 es
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
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function link(gl, vs, fs, tfVaryings) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  if (tfVaryings) gl.transformFeedbackVaryings(p, tfVaryings, gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

const STRIDE = 9 * 4;

export class MistGPU {
  constructor(canvas, opts = {}) {
    this.ok = false;
    this.cv = canvas;
    this.count = opts.count || 50000;
    this.baseHex = opts.baseColor || '#f56a8c';
    this.seed = opts.seed || 7;
    try {
      const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;
      this.gl = gl;
      this.progU = link(gl, UPDATE_VS, UPDATE_FS, ['vPos', 'vVel', 'vHomeR', 'vSeed', 'vCol']);
      this.progR = link(gl, RENDER_VS, RENDER_FS, null);
      this.uni = {};
      for (const n of ['uDt', 'uTime', 'uR', 'uSwirl', 'uNoise', 'uAwake', 'uBase', 'uVort', 'uVortN', 'uBul', 'uBulOn', 'uPush', 'uPushN', 'uSplat', 'uSplatCol', 'uSplatN'])
        this.uni[n] = gl.getUniformLocation(this.progU, n);
      this.uniR = {};
      for (const n of ['uRes', 'uCenter', 'uDpr', 'uAlpha', 'uShift', 'uRed'])
        this.uniR[n] = gl.getUniformLocation(this.progR, n);
      this._initBuffers(opts.initR || 200);
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.time = 0;
      this.ok = true;
    } catch (e) { this.ok = false; }
  }
  _rng() {
    let s = (this.seed * 2654435761) >>> 0;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  _hexVec(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  _initBuffers(R0) {
    const gl = this.gl, N = this.count;
    const rnd = this._rng();
    const base = this._hexVec(this.baseHex);
    const dark = [16 / 255, 12 / 255, 28 / 255];
    const data = new Float32Array(N * 9);
    for (let i = 0; i < N; i++) {
      const u = rnd();
      const homeR = 0.08 + 1.06 * Math.pow(u, 1.5);
      const a = rnd() * Math.PI * 2;
      const o = i * 9;
      data[o] = Math.cos(a) * homeR * R0; data[o + 1] = Math.sin(a) * homeR * R0;
      data[o + 2] = 0; data[o + 3] = 0;
      data[o + 4] = homeR; data[o + 5] = rnd() * 1000;
      const t = rnd() * 0.35;
      data[o + 6] = base[0] + (dark[0] - base[0]) * t;
      data[o + 7] = base[1] + (dark[1] - base[1]) * t;
      data[o + 8] = base[2] + (dark[2] - base[2]) * t;
    }
    this.bufs = [gl.createBuffer(), gl.createBuffer()];
    this.vaos = [gl.createVertexArray(), gl.createVertexArray()];
    this.tfs = [gl.createTransformFeedback(), gl.createTransformFeedback()];
    for (let i = 0; i < 2; i++) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs[i]);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_COPY);
      gl.bindVertexArray(this.vaos[i]);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE, 8);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, STRIDE, 16);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, STRIDE, 20);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 3, gl.FLOAT, false, STRIDE, 24);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tfs[i]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.bufs[i]);
    }
    gl.bindVertexArray(null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.cur = 0;
  }
  resize() {
    if (!this.ok) return;
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = Math.round(r.width * this.dpr);
    this.cv.height = Math.round(r.height * this.dpr);
    this.W = r.width; this.H = r.height;
  }
  frame(dt, st) {
    if (!this.ok) return;
    const gl = this.gl;
    if (!this.cv.width) this.resize();
    this.time += dt;
    gl.useProgram(this.progU);
    gl.uniform1f(this.uni.uDt, Math.min(dt, 0.05));
    gl.uniform1f(this.uni.uTime, this.time);
    gl.uniform1f(this.uni.uR, st.R);
    gl.uniform1f(this.uni.uSwirl, st.swirl);
    gl.uniform1f(this.uni.uNoise, st.noise);
    gl.uniform1f(this.uni.uAwake, st.awake);
    gl.uniform3fv(this.uni.uBase, st.base);
    const vorts = new Float32Array(32);
    const vn = Math.min(st.vortices.length, 8);
    for (let i = 0; i < vn; i++) { const v = st.vortices[i]; vorts[i * 4] = v.x; vorts[i * 4 + 1] = v.y; vorts[i * 4 + 2] = v.s; vorts[i * 4 + 3] = v.life; }
    gl.uniform4fv(this.uni.uVort, vorts); gl.uniform1i(this.uni.uVortN, vn);
    const buls = new Float32Array(8), bon = new Float32Array(2);
    for (let i = 0; i < Math.min(st.bullets.length, 2); i++) { const b = st.bullets[i]; buls[i * 4] = b.x; buls[i * 4 + 1] = b.y; buls[i * 4 + 2] = b.dx; buls[i * 4 + 3] = b.dy; bon[i] = b.on; }
    gl.uniform4fv(this.uni.uBul, buls); gl.uniform1fv(this.uni.uBulOn, bon);
    const pushes = new Float32Array(8); const pn = Math.min(st.pushes.length, 2);
    for (let i = 0; i < pn; i++) { const p = st.pushes[i]; pushes[i * 4] = p.x; pushes[i * 4 + 1] = p.y; pushes[i * 4 + 2] = p.r; pushes[i * 4 + 3] = p.s; }
    gl.uniform4fv(this.uni.uPush, pushes); gl.uniform1i(this.uni.uPushN, pn);
    const spl = new Float32Array(16), splc = new Float32Array(12); const sn = Math.min(st.splats.length, 4);
    for (let i = 0; i < sn; i++) { const s = st.splats[i]; spl[i * 4] = s.x; spl[i * 4 + 1] = s.y; spl[i * 4 + 2] = s.r; spl[i * 4 + 3] = s.s; splc[i * 3] = s.col[0]; splc[i * 3 + 1] = s.col[1]; splc[i * 3 + 2] = s.col[2]; }
    gl.uniform4fv(this.uni.uSplat, spl); gl.uniform3fv(this.uni.uSplatCol, splc); gl.uniform1i(this.uni.uSplatN, sn);
    const src = this.cur, dst = 1 - this.cur;
    gl.bindVertexArray(this.vaos[src]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tfs[dst]);
    gl.enable(gl.RASTERIZER_DISCARD); gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.endTransformFeedback(); gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    this.cur = dst;
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.progR);
    gl.uniform2f(this.uniR.uRes, this.cv.width, this.cv.height);
    gl.uniform2f(this.uniR.uCenter, st.center.x, st.center.y);
    gl.uniform1f(this.uniR.uDpr, this.dpr);
    gl.uniform1f(this.uniR.uAlpha, st.alpha);
    gl.uniform1f(this.uniR.uShift, st.shift);
    gl.uniform3f(this.uniR.uRed, 224 / 255, 72 / 255, 72 / 255);
    gl.bindVertexArray(this.vaos[this.cur]);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null); gl.disable(gl.BLEND);
  }
}
