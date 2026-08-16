/* ============================================================
   FI FLUID — GPU fluid nebula (WebGL2)

   A Stam-style incompressible solver built on the same pipeline
   as PavelDoGreat/WebGL-Fluid-Simulation:

     splat → force → curl → vorticity confinement → divergence
        → Jacobi pressure (N iters) → gradient subtract
        → advect velocity → advect dye → emit → display

   Two of those passes are Fi's rather than the reference toy's:

     · FORCE — a containment shell, a core outflow, a swirl and a
       curl-noise turbulence field. The nebula holds its chamber
       with no particles to keep track of, and events (vortices,
       piercing bullets, gliding rim-pushes) are uniforms here
       instead of per-particle work.
     · EMIT  — continuous dye injection at the core tone, on two
       hues that wander around the rose anchor and get thrown
       wide by what the chamber takes in.

   Cost is ~30 fullscreen passes over a 128² velocity grid plus
   two over the dye grid — replacing 50–90k transform-feedback
   particles per chamber, each with an overdrawn point sprite.

   Falls back silently (ok:false) when WebGL2 or half-float
   render targets are unavailable — the CPU blob mist renders.
   ============================================================ */
import { clamp, lerp, hexRGB, mulberry32, hsv, rgbHue } from '../utils/math.js';

const frac = (v) => v - Math.floor(v);

/* ---------- shaders ---------- */

const BASE_VERT = `#version 300 es
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
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
`;

const CLEAR_FRAG = HEAD + `
uniform sampler2D uTexture;
uniform float value;
void main(){ fragColor = value * texture(uTexture, vUv); }`;

const SPLAT_FRAG = HEAD + `
uniform sampler2D uTarget;
uniform float aspectRatio, radius;
uniform vec3 color;
uniform vec2 point;
void main(){
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;

const ADVECT_FRAG = HEAD + `
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`;

const DIVERGENCE_FRAG = HEAD + `
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
}`;

const CURL_FRAG = HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY_FRAG = HEAD + `
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
}`;

const PRESSURE_FRAG = HEAD + `
uniform sampler2D uPressure, uDivergence;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_FRAG = HEAD + `
uniform sampler2D uPressure, uVelocity;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

/* The chamber itself: everything that makes this nebula Fi's and
   not a free-floating smoke box. All of it is one pass. */
const FORCE_FRAG = HEAD + `
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
}`;

/* Two wandering emitters keep the nebula fed and off-centre. */
const EMIT_FRAG = HEAD + `
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
}`;

const DISPLAY_FRAG = HEAD + `
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
}`;

/* ---------- gl plumbing ---------- */

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

class Program {
  constructor(gl, vertSrc, fragSrc) {
    this.gl = gl;
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.p = p;
    this.u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, '');
      this.u[name] = gl.getUniformLocation(p, name);
    }
  }
  bind() { this.gl.useProgram(this.p); return this.u; }
}

export class FluidGPU {
  constructor(canvas, opts = {}) {
    this.ok = false;
    this.cv = canvas;
    this.o = Object.assign({
      simRes: 128,
      dyeRes: 384,
      /* the reference runs 20; the forcing here is continuous rather than
         impulsive, so the projection converges well below that and the
         iterations are the single biggest slice of the frame */
      pressureIterations: 12,
      curl: 34,
      densityDissipation: 0.60,
      velocityDissipation: 0.22,
      pressure: 0.8,
      /* the dye field carries no detail finer than a few pixels, so the
         display pass — the only one that runs at canvas resolution —
         renders below CSS scale and lets the compositor stretch it */
      renderScale: 0.75,
      seed: 7,
      baseColor: '#f56a8c',
    }, opts);
    this.time = 0;
    this.rnd = mulberry32(this.o.seed * 7919 + 13);
    this._queue = [];
    this._initPalette();
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: true, premultipliedAlpha: true, antialias: false,
        depth: false, stencil: false, preserveDrawingBuffer: false,
      });
      if (!gl) return;
      this.gl = gl;
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('EXT_color_buffer_half_float');
      const HF = gl.HALF_FLOAT;
      this.fRGBA = this._format(gl.RGBA16F, gl.RGBA, HF);
      if (!this.fRGBA) return;
      this.fRG = this._format(gl.RG16F, gl.RG, HF) || this.fRGBA;
      this.fR = this._format(gl.R16F, gl.RED, HF) || this.fRG;
      this._initQuad();
      this.prog = {
        clear: new Program(gl, BASE_VERT, CLEAR_FRAG),
        splat: new Program(gl, BASE_VERT, SPLAT_FRAG),
        advect: new Program(gl, BASE_VERT, ADVECT_FRAG),
        divergence: new Program(gl, BASE_VERT, DIVERGENCE_FRAG),
        curl: new Program(gl, BASE_VERT, CURL_FRAG),
        vorticity: new Program(gl, BASE_VERT, VORTICITY_FRAG),
        pressure: new Program(gl, BASE_VERT, PRESSURE_FRAG),
        gradient: new Program(gl, BASE_VERT, GRADIENT_FRAG),
        force: new Program(gl, BASE_VERT, FORCE_FRAG),
        emit: new Program(gl, BASE_VERT, EMIT_FRAG),
        display: new Program(gl, BASE_VERT, DISPLAY_FRAG),
      };
      /* ok as soon as GL is good — targets are allocated on the first
         resize that finds real layout, which may be after construction */
      this.ok = true;
      this.resize();
    } catch (e) {
      this.ok = false;
    }
  }

  /* ---------- palette ----------
     Vivid and randomized, but anchored: the hue wanders in a wide
     band around the accent so the chamber reads as Fi's rose even
     while every plume it throws is a different colour. */
  _initPalette() {
    const c = hexRGB(this.o.baseColor);
    this.anchor = rgbHue(c.r / 255, c.g / 255, c.b / 255);
    this.hue = this.anchor;
    this.hueTarget = this.anchor;
    this.spin = 0;
    this.spinRate = 1;
    this._hueT = 0;
    this.tint = { r: c.r, g: c.g, b: c.b };
  }
  _stepPalette(dt, st) {
    this._hueT -= dt;
    if (this._hueT <= 0) {
      /* wider excursions when the chamber is agitated */
      const spread = 0.26 + 0.14 * clamp(st.noise * 1.5 + st.stress, 0, 1);
      this.hueTarget = this.anchor + (this.rnd() - 0.5) * 2 * spread;
      this._hueT = 0.5 + this.rnd() * 1.6;
    }
    /* stress drags the whole palette toward the red end */
    const shifted = lerp(this.hueTarget, 0.005, st.shift * 0.8);
    this.hue = lerp(this.hue, shifted, 1 - Math.pow(0.25, dt));
    this.spinRate = 0.55 + 0.75 * st.awake;
    this.spin += dt * this.spinRate;
    const c = hsv(frac(this.hue), 0.82, 1);
    this.tint = { r: c.r * 255, g: c.g * 255, b: c.b * 255 };
  }

  /* Two counter-orbiting emitters — the moving pointers this sim never
     gets from a mouse. Position, drag velocity, radius and colour are
     all decided here so the force and dye passes agree on them. */
  _emitters(st) {
    const R = st.R, sr = this.spinRate;
    const mk = (ang, orbit, w, hue, sat, rad) => {
      const r = R * orbit;
      return {
        x: Math.cos(ang) * r, y: Math.sin(ang) * r,
        vx: -Math.sin(ang) * r * w * sr, vy: Math.cos(ang) * r * w * sr,
        r: R * rad, col: hsv(frac(hue), sat, 1),
      };
    };
    const wA = 2.05, wB = -1.35;
    /* B's hue swings right through A's, so their additive overlap moves
       across the wheel instead of parking on one mixed colour */
    this.em = {
      a: mk(this.spin * wA, 0.30 + 0.11 * Math.sin(this.spin * 0.63), wA,
            this.hue, 0.80, 0.20),
      b: mk(this.spin * wB + 2.1, 0.46 + 0.15 * Math.sin(this.spin * 0.41 + 2), wB,
            this.hue + 0.28 * Math.sin(this.spin * 0.37), 0.95, 0.12),
    };
  }

  /* ---------- resources ---------- */
  _format(internal, format, type) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return ok ? { internal, format, type } : null;
  }
  _initQuad() {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this._quadBufs = [vb, ib];
  }
  _fbo(w, h, f, filter) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, f.type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      tex, fbo, w, h, tx: 1 / w, ty: 1 / h,
      attach: (id) => { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; },
    };
  }
  _double(w, h, f, filter) {
    let a = this._fbo(w, h, f, filter), b = this._fbo(w, h, f, filter);
    return {
      w, h, tx: a.tx, ty: a.ty,
      get read() { return a; }, set read(v) { a = v; },
      get write() { return b; }, set write(v) { b = v; },
      swap() { const t = a; a = b; b = t; },
    };
  }
  _res(base) {
    const gl = this.gl;
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const min = Math.round(base), max = Math.round(base * ar);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  }
  resize() {
    if (!this.gl) return;
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const s = this.o.renderScale;
    const w = Math.max(8, Math.round(r.width * s)), h = Math.max(8, Math.round(r.height * s));
    if (this.cv.width === w && this.cv.height === h && this.dye) return;
    this.cv.width = w; this.cv.height = h;
    this.W = r.width; this.H = r.height;
    const gl = this.gl;
    const sim = this._res(this.o.simRes), dye = this._res(this.o.dyeRes);
    this._freeTargets();
    gl.clearColor(0, 0, 0, 0);
    this.dye = this._double(dye.w, dye.h, this.fRGBA, gl.LINEAR);
    this.vel = this._double(sim.w, sim.h, this.fRG, gl.LINEAR);
    this.div = this._fbo(sim.w, sim.h, this.fR, gl.NEAREST);
    this.crl = this._fbo(sim.w, sim.h, this.fR, gl.NEAREST);
    this.prs = this._double(sim.w, sim.h, this.fR, gl.NEAREST);
  }
  _freeTargets() {
    const gl = this.gl;
    const kill = (t) => { if (!t) return; gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); };
    for (const d of [this.dye, this.vel, this.prs]) { if (d) { kill(d.read); kill(d.write); } }
    kill(this.div); kill(this.crl);
    this.dye = this.vel = this.prs = this.div = this.crl = null;
  }
  destroy() {
    if (!this.gl) return;
    const gl = this.gl;
    this._freeTargets();
    for (const p of Object.values(this.prog || {})) gl.deleteProgram(p.p);
    for (const b of this._quadBufs || []) gl.deleteBuffer(b);
    if (this.vao) gl.deleteVertexArray(this.vao);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.ok = false;
  }

  _blit(target) {
    const gl = this.gl;
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, this.cv.width, this.cv.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  _texel(u, t) { this.gl.uniform2f(u.texelSize, t.tx, t.ty); }

  /* ---------- public input ----------
     x/y are chamber-local px (0,0 = centre), dx/dy px·s⁻¹,
     col {r,g,b} in 0..1, rad in px. */
  splat(x, y, dx, dy, col, rad) {
    if (!this.ok) return;
    this._queue.push({ x, y, dx, dy, col, rad: rad || 40 });
    if (this._queue.length > 24) this._queue.splice(0, this._queue.length - 24);
  }
  /** Chamber-local px → texture uv. */
  _uv(x, y, st) {
    return [(st.center.x + x) / this.W, 1 - (st.center.y + y) / this.H];
  }
  _applySplats(st) {
    if (!this._queue.length) return;
    const gl = this.gl;
    const aspect = this.W / this.H;
    const u = this.prog.splat.bind();
    for (const s of this._queue) {
      const [px, py] = this._uv(s.x, s.y, st);
      const rad = Math.pow(Math.max(s.rad, 4) / this.H, 2);
      gl.uniform1f(u.aspectRatio, aspect);
      gl.uniform2f(u.point, px, py);
      gl.uniform1f(u.radius, rad);
      /* velocity is in sim-texels·s⁻¹ — and v points up in uv */
      gl.uniform1i(u.uTarget, this.vel.read.attach(0));
      gl.uniform3f(u.color, s.dx * this.vel.w / this.W, -s.dy * this.vel.h / this.H, 0);
      this._blit(this.vel.write); this.vel.swap();
      if (s.col) {
        gl.uniform1i(u.uTarget, this.dye.read.attach(0));
        gl.uniform3f(u.color, s.col.r, s.col.g, s.col.b);
        this._blit(this.dye.write); this.dye.swap();
      }
    }
    this._queue.length = 0;
  }

  /* A chamber has to look like a nebula on the frame it is born: a
     reduced-motion render only ever gets a handful of steps, and a
     fresh page should not fade up out of an empty box. */
  _prime(st) {
    const R = st.R;
    for (let i = 0; i < 16; i++) {
      const a = this.rnd() * Math.PI * 2;
      const r = R * (0.08 + 0.72 * Math.sqrt(this.rnd()));
      const c = hsv(frac(this.hue + (this.rnd() - 0.5) * 0.3), 0.6 + this.rnd() * 0.35, 1);
      const sp = 70 + this.rnd() * 110;
      this.splat(Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * sp, Math.cos(a) * sp,
        { r: c.r * 0.5, g: c.g * 0.5, b: c.b * 0.5 }, R * (0.15 + 0.17 * this.rnd()));
    }
  }

  /* ---------- frame ---------- */
  frame(dt, st) {
    if (!this.ok) return;
    const gl = this.gl;
    if (!this.cv.width || !this.W) this.resize();
    if (!this.dye) return;
    dt = Math.min(dt, 1 / 60);
    this.time += dt;
    this._stepPalette(dt, st);
    this._emitters(st);
    if (!this._primed) { this._primed = true; this._prime(st); }

    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vao);

    this._applySplats(st);
    this._force(dt, st);
    this._project(dt);
    this._advect(dt);
    this._emit(dt, st);
    this._display(st);

    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _force(dt, st) {
    const gl = this.gl;
    const u = this.prog.force.bind();
    this._texel(u, this.vel);
    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    const [cx, cy] = this._uv(0, 0, st);
    const aspect = this.W / this.H;
    const R = st.R / this.H;
    const px2t = this.vel.h / this.H;              /* px·s⁻¹ → sim-texels·s⁻¹ */
    gl.uniform2f(u.uCenter, cx, cy);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uR, R);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uAwake, st.awake);
    gl.uniform1f(u.uWall, 940 * px2t);
    gl.uniform1f(u.uOut, (110 + 190 * st.pleasure) * px2t * (0.4 + 0.6 * st.awake));
    gl.uniform1f(u.uSwirl, st.swirl * 11 * px2t);
    gl.uniform1f(u.uTurb, (70 + 190 * st.noise + 110 * st.stress) * px2t);
    const em = this.em, JET = 2.4;
    for (const [k, e] of [['uEmA', em.a], ['uEmB', em.b]]) {
      const [x, y] = this._uv(e.x, e.y, st);
      gl.uniform4f(u[k], x, y, e.vx * px2t * JET, -e.vy * px2t * JET);
    }
    gl.uniform2f(u.uEmR, Math.pow(em.a.r / this.H, 2), Math.pow(em.b.r / this.H, 2));

    const vorts = new Float32Array(32);
    const vn = Math.min(st.vortices.length, 8);
    for (let i = 0; i < vn; i++) {
      const v = st.vortices[i];
      const [x, y] = this._uv(v.x, v.y, st);
      vorts[i * 4] = x; vorts[i * 4 + 1] = y;
      vorts[i * 4 + 2] = v.s * 0.06 * px2t; vorts[i * 4 + 3] = v.life;
    }
    gl.uniform4fv(u.uVort, vorts); gl.uniform1i(u.uVortN, vn);

    const buls = new Float32Array(8), bon = new Float32Array(2);
    for (let i = 0; i < Math.min(st.bullets.length, 2); i++) {
      const b = st.bullets[i];
      const [x, y] = this._uv(b.x, b.y, st);
      buls[i * 4] = x; buls[i * 4 + 1] = y;
      buls[i * 4 + 2] = b.dx; buls[i * 4 + 3] = -b.dy;
      bon[i] = b.on * 100 * px2t;
    }
    gl.uniform4fv(u.uBul, buls); gl.uniform2fv(u.uBulOn, bon);

    const push = new Float32Array(8);
    const pn = Math.min(st.pushes.length, 2);
    for (let i = 0; i < pn; i++) {
      const p = st.pushes[i];
      const [x, y] = this._uv(p.x, p.y, st);
      push[i * 4] = x; push[i * 4 + 1] = y;
      push[i * 4 + 2] = p.r / this.H; push[i * 4 + 3] = p.s * px2t;
    }
    gl.uniform4fv(u.uPush, push); gl.uniform1i(u.uPushN, pn);

    this._blit(this.vel.write); this.vel.swap();
  }

  _project(dt) {
    const gl = this.gl;
    let u = this.prog.curl.bind();
    this._texel(u, this.vel);
    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    this._blit(this.crl);

    u = this.prog.vorticity.bind();
    this._texel(u, this.vel);
    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    gl.uniform1i(u.uCurl, this.crl.attach(1));
    gl.uniform1f(u.curl, this.o.curl);
    gl.uniform1f(u.dt, dt);
    this._blit(this.vel.write); this.vel.swap();

    u = this.prog.divergence.bind();
    this._texel(u, this.vel);
    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    this._blit(this.div);

    u = this.prog.clear.bind();
    this._texel(u, this.prs);
    gl.uniform1i(u.uTexture, this.prs.read.attach(0));
    gl.uniform1f(u.value, this.o.pressure);
    this._blit(this.prs.write); this.prs.swap();

    u = this.prog.pressure.bind();
    this._texel(u, this.prs);
    gl.uniform1i(u.uDivergence, this.div.attach(0));
    for (let i = 0; i < this.o.pressureIterations; i++) {
      gl.uniform1i(u.uPressure, this.prs.read.attach(1));
      this._blit(this.prs.write); this.prs.swap();
    }

    u = this.prog.gradient.bind();
    this._texel(u, this.prs);
    gl.uniform1i(u.uPressure, this.prs.read.attach(0));
    gl.uniform1i(u.uVelocity, this.vel.read.attach(1));
    this._blit(this.vel.write); this.vel.swap();
  }

  _advect(dt) {
    const gl = this.gl;
    const u = this.prog.advect.bind();
    this._texel(u, this.vel);
    gl.uniform1f(u.dt, dt);
    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    gl.uniform1i(u.uSource, this.vel.read.attach(0));
    gl.uniform1f(u.dissipation, this.o.velocityDissipation);
    this._blit(this.vel.write); this.vel.swap();

    gl.uniform1i(u.uVelocity, this.vel.read.attach(0));
    gl.uniform1i(u.uSource, this.dye.read.attach(1));
    gl.uniform1f(u.dissipation, this.o.densityDissipation);
    this._blit(this.dye.write); this.dye.swap();
  }

  _emit(dt, st) {
    const gl = this.gl;
    const u = this.prog.emit.bind();
    gl.uniform1i(u.uTarget, this.dye.read.attach(0));
    const [cx, cy] = this._uv(0, 0, st);
    const em = this.em;
    const [ax, ay] = this._uv(em.a.x, em.a.y, st);
    const [bx, by] = this._uv(em.b.x, em.b.y, st);
    const gate = st.emit * (0.55 + 0.45 * st.awake);
    gl.uniform2f(u.uCenter, cx, cy);
    gl.uniform1f(u.uAspect, this.W / this.H);
    gl.uniform1f(u.uR, st.R / this.H);
    gl.uniform2f(u.uA, ax, ay);
    gl.uniform2f(u.uB, bx, by);
    gl.uniform1f(u.uRA, Math.pow(em.a.r / this.H, 2));
    gl.uniform1f(u.uRB, Math.pow(em.b.r / this.H, 2));
    gl.uniform1f(u.uAmtA, 2.6 * gate * dt);
    gl.uniform1f(u.uAmtB, 3.4 * gate * dt);
    gl.uniform3f(u.uColA, em.a.col.r, em.a.col.g, em.a.col.b);
    gl.uniform3f(u.uColB, em.b.col.r, em.b.col.g, em.b.col.b);
    gl.uniform1f(u.uHold, Math.pow(0.02, dt));
    this._blit(this.dye.write); this.dye.swap();
  }

  _display(st) {
    const gl = this.gl;
    const u = this.prog.display.bind();
    gl.uniform2f(u.texelSize, this.dye.tx, this.dye.ty);
    gl.uniform1i(u.uTexture, this.dye.read.attach(0));
    const [cx, cy] = this._uv(0, 0, st);
    gl.uniform2f(u.uCenter, cx, cy);
    gl.uniform1f(u.uAspect, this.W / this.H);
    gl.uniform1f(u.uR, st.R / this.H);
    gl.uniform1f(u.uAlpha, st.alpha);
    gl.uniform1f(u.uDim, 1 - 0.45 * st.mood);
    gl.uniform1f(u.uShift, st.shift);
    gl.uniform3f(u.uRed, 224 / 255, 72 / 255, 72 / 255);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this._blit(null);
  }
}

