/**
 * Triangular contour field — one fullscreen fragment shader, raw WebGL.
 *
 * Five concentric equilateral triangles, each born small at the centre and
 * scaled outward until it clears the viewport. Evaluating the SDF at a new
 * radius per ring — rather than reading contours off one fixed triangle — is
 * what keeps the corners sharp at every size. Kept free of React so the shader
 * and the component lifecycle can move independently.
 */

/** A DPR-3 phone renders 9x the pixels through a five-division per-pixel loop. */
export const DPR_CAP = 1.5;

export function clampDpr(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, DPR_CAP);
}

export const VERTEX_SHADER = `attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export const FRAGMENT_SHADER = `precision highp float;
uniform vec2 resolution;
uniform float time;

// Inigo Quilez's equilateral-triangle signed distance function.
float sdTri(vec2 p, float r) {
  float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  // Corner distance in uv units: the radius at which a ring has just cleared
  // the viewport. Derived from resolution, so ultrawide and portrait both fall
  // out of the same expression — no per-breakpoint constant.
  float reach = length(resolution) / min(resolution.x, resolution.y);
  float t = time * 0.05;
  float lineWidth = 0.01;
  // Diagonal grain at a quarter slope. mod() has slope 1 whatever its modulus,
  // so at full strength this term out-gradients the triangle itself and the
  // field reads as diagonal banding; scaling the amplitude is what lets the
  // geometry win.
  float shear = 0.25 * mod(uv.x + uv.y, 0.24);
  float acc = 0.0;
  for (int i = 0; i < 5; i++) {
    float ph = fract(t + float(i) * 0.2);
    // The triangle is scaled, not offset. Offsetting an SDF is a Minkowski sum
    // with a disc, which rounds the corners away into a circle at any real
    // distance — the shape has to be re-evaluated at each radius to stay sharp.
    float d = sdTri(uv, mix(0.05, reach, ph));
    // Weight follows phase rather than loop index, so every ring is born and
    // dies at the same brightness and the wrap never pops.
    float w = smoothstep(0.0, 0.06, ph) * (1.0 - smoothstep(0.75, 1.0, ph));
    acc += lineWidth * w / abs(d + shear);
  }
  // navy -> signal -> white. One intensity ramp, so the field obeys the
  // accent rule instead of the source's per-channel RGB fringing.
  vec3 navy   = vec3(0.102, 0.165, 0.267);
  vec3 deep   = vec3(0.067, 0.106, 0.180);
  vec3 signal = vec3(0.353, 0.784, 0.878);
  vec3 col = mix(deep, navy, gl_FragCoord.y / resolution.y);
  float glow = clamp(acc, 0.0, 2.0);
  col = mix(col, signal, clamp(glow, 0.0, 1.0));
  col = mix(col, vec3(1.0), clamp(glow - 1.0, 0.0, 1.0) * 0.75);
  gl_FragColor = vec4(col, 1.0);
}`;

export type ContourProgram = {
  resize(width: number, height: number): void;
  draw(time: number): void;
  dispose(): void;
};

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL could not allocate a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Contour shader failed to compile: ${log}`);
  }
  return shader;
}

export function createContourProgram(gl: WebGLRenderingContext): ContourProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL could not allocate a program");

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    throw new Error(`Contour program failed to link: ${log}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  gl.useProgram(program);

  // One oversized triangle covers the viewport — cheaper than two forming a quad.
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("WebGL could not allocate a buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "resolution");
  const uTime = gl.getUniformLocation(program, "time");

  return {
    resize(width, height) {
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
    },
    draw(time) {
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.useProgram(null);
      gl.deleteProgram(program);
    },
  };
}
