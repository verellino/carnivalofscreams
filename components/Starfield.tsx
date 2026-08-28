"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uMotion;

// Celestial pole, off-canvas to the upper left. Everything rotates about it.
const vec2  POLE  = vec2(-1.9, 1.25);
const float OMEGA = 0.010;  // rad/s — one revolution in ~10 min
const float EXPO  = 1.5;    // shutter time, in seconds, for the motion-blur trail

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float a = hash21(p);
  return vec2(a, hash21(p + a + 19.19));
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + 1.7;
    a *= 0.5;
  }
  return s;
}

vec2 rot(vec2 v, float a) {
  float s = sin(a), c = cos(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// One depth slice of the sky. Stars live on a jittered grid; each is drawn as a
// gaussian smeared along its tangential velocity, so it trails as the sky turns.
vec3 layer(vec2 q, float scale, float seed, float sizeMul, float density, float bright) {
  vec2 sp = q * scale;
  vec2 id = floor(sp);
  vec2 gv = fract(sp) - 0.5;

  vec2  rv   = q - POLE;
  float rad  = max(length(rv), 1e-3);
  vec2  tdir = vec2(-rv.y, rv.x) / rad;   // direction of travel at this point

  float cellPx = uRes.y / (2.0 * scale);
  float trail  = min(OMEGA * EXPO * rad * uMotion * scale, 0.45);  // in cells
  float sk     = 1.0 / (1.0 + trail * trail * 40.0);               // squash along tdir

  vec3 acc = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o   = vec2(float(x), float(y));
      vec2 cid = id + o + seed;
      vec2 r   = hash22(cid);

      float present = step(hash21(cid + 4.31), density);

      vec2  d  = gv - (o + (r - 0.5) * 0.9);
      float al = dot(d, tdir);
      vec2  pe = d - al * tdir;
      float r2 = al * al * sk + dot(pe, pe);

      float mag = pow(hash21(cid + 2.11), 5.5);          // few bright, many faint
      float sig = (0.5 + 4.6 * mag) * sizeMul / cellPx;  // gaussian sigma, in cells
      float s2  = sig * sig;

      // Scintillation: faint stars twinkle hardest, bright ones sit steady.
      float tw = 0.6 + 0.4 * sin(uTime * (1.6 + r.y * 3.2) + r.x * 40.0);
      tw = mix(1.0, tw, (0.35 + 0.5 * (1.0 - mag)) * uMotion);

      float core = exp(-r2 / s2);
      float halo = exp(-r2 / (s2 * 26.0)) * 0.14;
      float g    = (core + halo) * tw * present;

      vec3 tint = mix(vec3(0.60, 0.72, 1.00), vec3(1.00, 0.82, 0.55), hash21(cid + 8.77));
      tint = mix(tint, vec3(1.0), core * 0.75);

      acc += tint * g * bright * (0.22 + 2.0 * mag);
    }
  }
  return acc;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;

  float ang = -uTime * OMEGA * uMotion;
  vec2  q   = rot(p - POLE, ang) + POLE;

  // Atmospheric shimmer — a slow refractive warp, strongest on the near layer.
  vec2 w = vec2(
    fbm(q * 2.2 + vec2(0.0, uTime * 0.050)),
    fbm(q * 2.2 + vec2(7.3, uTime * -0.042))
  ) - 0.5;
  w *= 0.5 + 0.5 * uMotion;

  vec3 col = vec3(0.0);
  col += layer(q + w * 0.030,  4.0,   0.0, 1.45, 0.30, 1.00);
  col += layer(q + w * 0.020,  8.0,  31.0, 1.05, 0.26, 0.60);
  col += layer(q + w * 0.012, 15.0,  67.0, 0.78, 0.22, 0.34);
  col += layer(q + w * 0.006, 27.0, 113.0, 0.58, 0.18, 0.18);

  // Dust band, turning with the sky.
  float dust     = fbm(q * 1.15 + 21.0);
  float bandAxis = dot(q - vec2(0.1, 0.0), normalize(vec2(0.72, -0.69)));
  col += smoothstep(0.42, 0.92, dust) * exp(-bandAxis * bandAxis * 1.6)
       * vec3(0.16, 0.13, 0.20) * 0.55;

  // Upper-centre haze behind the wordmark.
  vec2 gp = (p - vec2(0.0, 0.24)) * vec2(0.78, 1.15);
  col += vec3(0.62, 0.58, 0.70) * exp(-dot(gp, gp) * 1.25) * 0.17;

  col += vec3(0.020, 0.012, 0.031);   // --ink

  float vig = smoothstep(2.05, 0.55, length(p * vec2(0.82, 1.0)));
  col *= mix(0.22, 1.0, vig);

  col = 1.0 - exp(-col * 1.25);
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;   // dither the dark gradient

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMotion = gl.getUniformLocation(prog, "uMotion");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motion = reduce.matches ? 0 : 1;
    gl.uniform1f(uMotion, motion);

    // Cap total fragments so a 5K display doesn't melt the GPU.
    const MAX_PIXELS = 2_600_000;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      const over = (rect.width * rect.height * dpr * dpr) / MAX_PIXELS;
      if (over > 1) dpr /= Math.sqrt(over);
      const nw = Math.max(1, Math.round(rect.width * dpr));
      const nh = Math.max(1, Math.round(rect.height * dpr));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };

    let raf = 0;
    let running = false;
    const start = performance.now();

    const draw = (t: number) => {
      gl.uniform1f(uTime, (t - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const play = () => {
      if (running || motion === 0) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw(performance.now());
    play();

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    ro.observe(canvas);

    // Don't burn frames on a backgrounded tab or a scrolled-past canvas.
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting && !document.hidden ? play() : pause()),
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onReduce = () => {
      motion = reduce.matches ? 0 : 1;
      gl.uniform1f(uMotion, motion);
      if (motion === 0) {
        pause();
        draw(performance.now());
      } else {
        play();
      }
    };
    reduce.addEventListener("change", onReduce);

    const onLost = (e: Event) => {
      e.preventDefault();
      pause();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
