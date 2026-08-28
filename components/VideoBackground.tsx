"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Samples the video, softens it toward the edges, lays the scrim over the top
// and dithers the result — the vignette is a long dark ramp and would band badly
// in 8-bit without it.
const FRAG = `
precision mediump float;

uniform sampler2D uTex;
uniform vec2  uRes;
uniform vec2  uTexRes;
uniform float uTime;
uniform float uMotion;

const vec3 INK = vec3(0.020, 0.012, 0.031);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

// Ordered 8x8 Bayer, built by recursion rather than a lookup table.
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv   = frag / uRes;

  // object-cover: crop the axis that overflows.
  float canvasA = uRes.x / uRes.y;
  float texA    = uTexRes.x / uTexRes.y;
  vec2  crop    = canvasA > texA ? vec2(1.0, texA / canvasA) : vec2(canvasA / texA, 1.0);
  uv = (uv - 0.5) * crop + 0.5;

  vec2  p = (frag - 0.5 * uRes) / uRes.y * 2.0;
  float r = length(p * vec2(0.72, 1.0));

  // Light defocus that opens up toward the edges; the centre stays sharp.
  float rad = mix(0.0004, 0.0055, smoothstep(0.30, 1.30, r));
  vec2  agg = vec2(1.0 / canvasA, 1.0) * rad;

  vec3 col = texture2D(uTex, uv).rgb;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853981634;
    col += texture2D(uTex, uv + vec2(cos(a), sin(a)) * agg).rgb;
  }
  col /= 9.0;

  col = mix(col, INK, 0.55);                              // scrim
  col = mix(col, INK, smoothstep(0.20, 1.20, r) * 0.69);  // vignette

  col += (bayer8(frag) - 0.5) / 255.0;
  col += (hash21(frag + floor(uTime * 24.0) * uMotion) - 0.5) * 0.008;

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

export default function VideoBackground({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    // The autoplay attribute does the work in a real browser; this only pulls
    // the video back to a still frame for reduced-motion users, and retries
    // play() where the attribute alone didn't take.
    const syncPlayback = () => {
      if (reduce.matches) {
        video.pause();
        video.currentTime = 0;
      } else if (video.paused) {
        video.play().catch(() => {});
      }
    };

    syncPlayback();
    reduce.addEventListener("change", syncPlayback);

    const canvas = canvasRef.current;
    const gl =
      canvas?.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      }) ?? null;

    // No WebGL: the video element and the CSS scrim underneath stand in for it.
    if (!canvas || !gl) {
      return () => reduce.removeEventListener("change", syncPlayback);
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !prog) {
      return () => reduce.removeEventListener("change", syncPlayback);
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return () => reduce.removeEventListener("change", syncPlayback);
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTexRes = gl.getUniformLocation(prog, "uTexRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMotion = gl.getUniformLocation(prog, "uMotion");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(prog, "uTex"), 0);

    // Nine texture fetches per pixel, so keep the fragment count in check.
    const MAX_PIXELS = 2_200_000;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
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
    let ready = false;
    const start = performance.now();

    const draw = (now: number) => {
      if (video.readyState < 2) return;
      if (!ready) {
        gl.uniform2f(uTexRes, video.videoWidth || 16, video.videoHeight || 9);
        ready = true;
      }
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform1f(uMotion, reduce.matches ? 0 : 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.live = "true";
    };

    const frame = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    play();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting && !document.hidden ? play() : pause()),
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (e: Event) => {
      e.preventDefault();
      pause();
      delete canvas.dataset.live;
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", syncPlayback);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/stargate-poster.webp"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/stargate-bg.mp4" type="video/mp4" />
      </video>

      {/* Fallback scrim for the no-WebGL path; the canvas paints over both. */}
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_20%,rgba(5,3,8,0.68)_100%)]" />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
