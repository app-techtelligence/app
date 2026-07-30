import { describe, expect, it, vi } from "vitest";
import {
  DPR_CAP,
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  clampDpr,
  createContourProgram,
} from "./contour-shader";

/**
 * Minimal stand-in for WebGLRenderingContext. Only the calls the factory makes
 * are implemented; overrides let a test force a compile or link failure.
 */
function fakeGl(overrides: Record<string, unknown> = {}) {
  const calls: { name: string; args: unknown[] }[] = [];
  const record =
    (name: string, result?: unknown) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return result;
    };

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    createShader: record("createShader", { id: "shader" }),
    shaderSource: record("shaderSource"),
    compileShader: record("compileShader"),
    getShaderParameter: record("getShaderParameter", true),
    getShaderInfoLog: record("getShaderInfoLog", "syntax error on line 12"),
    deleteShader: record("deleteShader"),
    createProgram: record("createProgram", { id: "program" }),
    attachShader: record("attachShader"),
    linkProgram: record("linkProgram"),
    getProgramParameter: record("getProgramParameter", true),
    getProgramInfoLog: record("getProgramInfoLog", "link failed"),
    deleteProgram: record("deleteProgram"),
    useProgram: record("useProgram"),
    createBuffer: record("createBuffer", { id: "buffer" }),
    deleteBuffer: record("deleteBuffer"),
    bindBuffer: record("bindBuffer"),
    bufferData: record("bufferData"),
    getAttribLocation: record("getAttribLocation", 0),
    enableVertexAttribArray: record("enableVertexAttribArray"),
    vertexAttribPointer: record("vertexAttribPointer"),
    getUniformLocation: record("getUniformLocation", { id: "uniform" }),
    uniform1f: record("uniform1f"),
    uniform2f: record("uniform2f"),
    viewport: record("viewport"),
    drawArrays: record("drawArrays"),
    ...overrides,
  };

  return { gl: gl as unknown as WebGLRenderingContext, calls };
}

describe("clampDpr", () => {
  it("caps high-density screens", () => {
    // A DPR-3 phone would otherwise render 9x the pixels through a per-pixel
    // loop with five divisions.
    expect(clampDpr(3)).toBe(DPR_CAP);
    expect(clampDpr(2)).toBe(DPR_CAP);
  });

  it("leaves standard and unknown densities alone", () => {
    expect(clampDpr(1)).toBe(1);
    expect(clampDpr(1.25)).toBe(1.25);
    expect(clampDpr(Number.NaN)).toBe(1);
    expect(clampDpr(0)).toBe(1);
  });
});

describe("FRAGMENT_SHADER", () => {
  // The entire geometry change from the circular source material is the
  // distance function. If this reverts, the hero silently becomes a circle.
  it("uses the triangle SDF, not the source's radial distance", () => {
    expect(FRAGMENT_SHADER).toContain("float sdTri(");
    expect(FRAGMENT_SHADER).toContain("sdTri(uv,");
    expect(FRAGMENT_SHADER).not.toMatch(/float d\s*=\s*length\(uv\)/);
  });

  it("declares the uniforms the factory looks up", () => {
    expect(FRAGMENT_SHADER).toContain("uniform vec2 resolution;");
    expect(FRAGMENT_SHADER).toContain("uniform float time;");
  });

  it("has a vertex shader for the single covering triangle", () => {
    expect(VERTEX_SHADER).toContain("attribute vec2 p;");
  });
});

describe("createContourProgram", () => {
  it("compiles, links and uploads one oversized triangle", () => {
    const { gl, calls } = fakeGl();
    const program = createContourProgram(gl);

    expect(calls.filter((c) => c.name === "compileShader")).toHaveLength(2);
    expect(calls.some((c) => c.name === "linkProgram")).toBe(true);

    // Two triangles forming a quad would be 6 vertices; this is 3.
    const upload = calls.find((c) => c.name === "bufferData");
    expect(Array.from(upload?.args[1] as Float32Array)).toEqual([
      -1, -1, 3, -1, -1, 3,
    ]);
    expect(program.draw).toBeTypeOf("function");
  });

  it("throws with the driver log when a shader fails to compile", () => {
    const { gl } = fakeGl({ getShaderParameter: () => false });
    expect(() => createContourProgram(gl)).toThrow(/syntax error on line 12/);
  });

  it("throws with the driver log when the program fails to link", () => {
    const { gl } = fakeGl({ getProgramParameter: () => false });
    expect(() => createContourProgram(gl)).toThrow(/link failed/);
  });

  it("resize sets the viewport and the resolution uniform", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).resize(800, 400);

    expect(calls).toContainEqual({ name: "viewport", args: [0, 0, 800, 400] });
    const uniform = calls.find((c) => c.name === "uniform2f");
    expect(uniform?.args.slice(1)).toEqual([800, 400]);
  });

  it("draw pushes time and issues exactly one 3-vertex draw call", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).draw(12.5);

    const time = calls.find((c) => c.name === "uniform1f");
    expect(time?.args[1]).toBe(12.5);
    const draws = calls.filter((c) => c.name === "drawArrays");
    expect(draws).toHaveLength(1);
    expect(draws[0].args).toEqual([gl.TRIANGLES, 0, 3]);
  });

  it("dispose releases the program and the buffer", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).dispose();

    expect(calls.some((c) => c.name === "deleteProgram")).toBe(true);
    expect(calls.some((c) => c.name === "deleteBuffer")).toBe(true);
  });
});
