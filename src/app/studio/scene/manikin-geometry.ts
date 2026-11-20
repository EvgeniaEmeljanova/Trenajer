export type GeometryData = { p: number[]; n: number[] };
export type ManikinPart = {
  geometry: GeometryData;
  position: [number, number, number];
  scale: [number, number, number];
  color: [number, number, number];
  role?: 'chest';
};

const TAU = Math.PI * 2;

function finish(vertices: number[], indices: number[]): GeometryData {
  const normals = new Array(vertices.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3, ib = indices[i + 1] * 3, ic = indices[i + 2] * 3;
    const ax = vertices[ib] - vertices[ia], ay = vertices[ib + 1] - vertices[ia + 1], az = vertices[ib + 2] - vertices[ia + 2];
    const bx = vertices[ic] - vertices[ia], by = vertices[ic + 1] - vertices[ia + 1], bz = vertices[ic + 2] - vertices[ia + 2];
    const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    for (const at of [ia, ib, ic]) { normals[at] += nx; normals[at + 1] += ny; normals[at + 2] += nz; }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length; normals[i + 1] /= length; normals[i + 2] /= length;
  }
  const p: number[] = [], n: number[] = [];
  for (const index of indices) {
    const at = index * 3;
    p.push(vertices[at], vertices[at + 1], vertices[at + 2]);
    n.push(normals[at], normals[at + 1], normals[at + 2]);
  }
  return { p, n };
}

type Section = { z: number; rx: number; ry: number; cy?: number };

function loft(sections: Section[], segments = 40): GeometryData {
  const vertices: number[] = [], indices: number[] = [];
  const rings = sections.length;
  for (const s of sections) for (let j = 0; j <= segments; j++) {
    const a = j / segments * TAU;
    vertices.push(Math.cos(a) * s.rx, (s.cy ?? 0) + Math.sin(a) * s.ry, s.z);
  }
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < segments; j++) {
    const a = i * (segments + 1) + j, b = a + segments + 1;
    indices.push(a, a + 1, b + 1, a, b + 1, b);
  }
  return finish(vertices, indices);
}

function tube(start: [number, number, number], end: [number, number, number], radiusStart: number, radiusEnd: number, segments = 20): GeometryData {
  const vertices: number[] = [], indices: number[] = [];
  const axis = end.map((v, i) => v - start[i]) as [number, number, number];
  const length = Math.hypot(...axis) || 1;
  const w = axis.map(v => v / length) as [number, number, number];
  const helper: [number, number, number] = Math.abs(w[1]) < 0.88 ? [0, 1, 0] : [1, 0, 0];
  const u = [w[1] * helper[2] - w[2] * helper[1], w[2] * helper[0] - w[0] * helper[2], w[0] * helper[1] - w[1] * helper[0]];
  const ul = Math.hypot(...u); for (let i = 0; i < 3; i++) u[i] /= ul;
  const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  const rings = 16;
  for (let k = 0; k <= rings; k++) {
    const t = k / rings, radius = radiusStart * (1 - t) + radiusEnd * t;
    for (let j = 0; j <= segments; j++) {
      const a = j / segments * TAU, c = Math.cos(a) * radius, s = Math.sin(a) * radius;
      vertices.push(start[0] + axis[0] * t + u[0] * c + v[0] * s, start[1] + axis[1] * t + u[1] * c + v[1] * s, start[2] + axis[2] * t + u[2] * c + v[2] * s);
    }
  }
  for (let k = 0; k < rings; k++) for (let j = 0; j < segments; j++) {
    const a = k * (segments + 1) + j, b = a + segments + 1;
    indices.push(a, a + 1, b + 1, a, b + 1, b);
  }
  return finish(vertices, indices);
}

function ellipsoid(rx: number, ry: number, rz: number, segments = 28, rings = 18): GeometryData {
  const vertices: number[] = [], indices: number[] = [];
  for (let y = 0; y <= rings; y++) {
    const phi = Math.PI * y / rings;
    for (let x = 0; x <= segments; x++) {
      const theta = TAU * x / segments;
      vertices.push(rx * Math.sin(phi) * Math.cos(theta), ry * Math.cos(phi), rz * Math.sin(phi) * Math.sin(theta));
    }
  }
  for (let y = 0; y < rings; y++) for (let x = 0; x < segments; x++) {
    const a = y * (segments + 1) + x, b = a + segments + 1;
    indices.push(a, a + 1, b + 1, a, b + 1, b);
  }
  return finish(vertices, indices);
}

/** Original smooth-surface adult CPR training manikin. Coordinates are local to the room's patient mat. */
export function buildAdultCprManikin(): ManikinPart[] {
  const plastic: [number, number, number] = [0.82, 0.70, 0.57];
  const chestPlastic: [number, number, number] = [0.91, 0.82, 0.70];
  const seam: [number, number, number] = [0.59, 0.48, 0.38];
  const dark: [number, number, number] = [0.055, 0.075, 0.085];
  const parts: ManikinPart[] = [];
  const add = (geometry: GeometryData, position: [number, number, number], scale: [number, number, number] = [1, 1, 1], color = plastic, role?: 'chest') =>
    parts.push({ geometry, position, scale, color, role });

  // Main continuous molded shell: shoulders, thorax, waist and pelvis in one lofted surface.
  add(loft([
    { z: -0.57, rx: 0.075, ry: 0.075, cy: 0.01 },
    { z: -0.48, rx: 0.16, ry: 0.105, cy: 0.005 },
    { z: -0.39, rx: 0.215, ry: 0.12, cy: 0 },
    { z: -0.23, rx: 0.235, ry: 0.135, cy: 0 },
    { z: -0.04, rx: 0.215, ry: 0.12, cy: -0.005 },
    { z: 0.16, rx: 0.18, ry: 0.105, cy: -0.005 },
    { z: 0.38, rx: 0.19, ry: 0.11, cy: 0 },
    { z: 0.57, rx: 0.205, ry: 0.115, cy: 0 },
    { z: 0.69, rx: 0.17, ry: 0.095, cy: 0 },
    { z: 0.76, rx: 0.09, ry: 0.065, cy: 0 },
  ]), [-0.6, 0.215, 0], [1, 1, 1], plastic);

  // Separate resilient chest plate so the compression animation can move only the contact area.
  add(loft([
    { z: -0.43, rx: 0.155, ry: 0.09, cy: 0 },
    { z: -0.37, rx: 0.205, ry: 0.12, cy: 0 },
    { z: -0.25, rx: 0.225, ry: 0.135, cy: 0 },
    { z: -0.13, rx: 0.215, ry: 0.12, cy: 0 },
    { z: -0.07, rx: 0.17, ry: 0.09, cy: 0 },
  ]), [-0.6, 0.225, 0], [1, 1, 1], chestPlastic, 'chest');

  // Head: a molded oval shell with a defined occiput, cheek line and chin; face looks toward +Z.
  add(loft([
    { z: -0.94, rx: 0.045, ry: 0.055, cy: 0 },
    { z: -0.90, rx: 0.105, ry: 0.09, cy: 0 },
    { z: -0.82, rx: 0.145, ry: 0.12, cy: 0 },
    { z: -0.73, rx: 0.155, ry: 0.125, cy: 0 },
    { z: -0.65, rx: 0.13, ry: 0.105, cy: -0.005 },
    { z: -0.59, rx: 0.075, ry: 0.065, cy: -0.015 },
    { z: -0.565, rx: 0.025, ry: 0.025, cy: -0.02 },
  ]), [-0.6, 0.255, 0], [1, 1, 1], plastic);
  // Recessed eye sockets and small molded details, not a human face texture.
  add(ellipsoid(0.027, 0.018, 0.012), [-0.665, 0.274, -0.598], [1, 1, 1], dark);
  add(ellipsoid(0.027, 0.018, 0.012), [-0.535, 0.274, -0.598], [1, 1, 1], dark);
  add(ellipsoid(0.022, 0.034, 0.024), [-0.6, 0.238, -0.574], [1, 1, 1], seam);
  add(tube([-0.642, 0.218, -0.585], [-0.6, 0.211, -0.577], 0.006, 0.004, 10), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.6, 0.211, -0.577], [-0.558, 0.218, -0.585], 0.004, 0.006, 10), [0, 0, 0], [1, 1, 1], seam);
  // More recognizable molded training face: ears, closed lids, nose and airway opening.
  add(ellipsoid(0.026, 0.052, 0.064), [-0.748, 0.252, -0.73], [1, 1, 1], plastic);
  add(ellipsoid(0.026, 0.052, 0.064), [-0.452, 0.252, -0.73], [1, 1, 1], plastic);
  add(ellipsoid(0.012, 0.027, 0.035), [-0.754, 0.252, -0.73], [1, 1, 1], seam);
  add(ellipsoid(0.012, 0.027, 0.035), [-0.446, 0.252, -0.73], [1, 1, 1], seam);
  add(tube([-0.69, 0.278, -0.598], [-0.64, 0.282, -0.588], 0.005, 0.005, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.56, 0.282, -0.588], [-0.51, 0.278, -0.598], 0.005, 0.005, 12), [0, 0, 0], [1, 1, 1], seam);
  add(ellipsoid(0.03, 0.035, 0.026), [-0.6, 0.242, -0.568], [1, 1, 1], chestPlastic);
  add(ellipsoid(0.009, 0.006, 0.008), [-0.619, 0.229, -0.565], [1, 1, 1], dark);
  add(ellipsoid(0.009, 0.006, 0.008), [-0.581, 0.229, -0.565], [1, 1, 1], dark);
  add(ellipsoid(0.042, 0.016, 0.009), [-0.6, 0.204, -0.572], [1, 1, 1], dark);
  add(tube([-0.65, 0.195, -0.57], [-0.6, 0.19, -0.568], 0.004, 0.004, 10), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.6, 0.19, -0.568], [-0.55, 0.195, -0.57], 0.004, 0.004, 10), [0, 0, 0], [1, 1, 1], seam);

  // Neck, shoulder transitions and smooth tapered arms.
  add(tube([-0.6, 0.22, -0.56], [-0.6, 0.22, -0.43], 0.075, 0.09), [-0, 0, 0], [1, 1, 1], plastic);
  for (const side of [-1, 1]) {
    const shoulder: [number, number, number] = [-0.6 + side * 0.19, 0.205, -0.36];
    const elbow: [number, number, number] = [-0.6 + side * 0.42, 0.17, -0.13];
    const wrist: [number, number, number] = [-0.6 + side * 0.52, 0.13, 0.12];
    const palm: [number, number, number] = [-0.6 + side * 0.55, 0.12, 0.22];
    add(tube(shoulder, elbow, 0.078, 0.061), [0, 0, 0], [1, 1, 1], plastic);
    add(tube(elbow, wrist, 0.061, 0.042), [0, 0, 0], [1, 1, 1], plastic);
    add(ellipsoid(0.065, 0.025, 0.085), palm, [1, 1, 1], plastic);
    for (let finger = 0; finger < 4; finger++) {
      const offset = (finger - 1.5) * 0.027;
      const from: [number, number, number] = [palm[0] + side * offset, 0.115, 0.27];
      const to: [number, number, number] = [from[0] + side * 0.012, 0.105, 0.345];
      add(tube(from, to, 0.012, 0.008, 10), [0, 0, 0], [1, 1, 1], plastic);
    }
    const hip: [number, number, number] = [-0.6 + side * 0.105, 0.17, 0.67];
    const knee: [number, number, number] = [-0.6 + side * 0.105, 0.145, 1.10];
    const ankle: [number, number, number] = [-0.6 + side * 0.105, 0.12, 1.48];
    const foot: [number, number, number] = [-0.6 + side * 0.105, 0.105, 1.62];
    add(tube(hip, knee, 0.09, 0.072), [0, 0, 0], [1, 1, 1], plastic);
    add(tube(knee, ankle, 0.068, 0.052), [0, 0, 0], [1, 1, 1], plastic);
    add(ellipsoid(0.075, 0.047, 0.13), foot, [1, 1, 1], chestPlastic);
  }
  // Subtle molded shoulder/collar seams and a lower chest reference line.
  add(tube([-0.79, 0.285, -0.38], [-0.6, 0.302, -0.32], 0.009, 0.009, 16), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.6, 0.302, -0.32], [-0.41, 0.285, -0.38], 0.009, 0.009, 16), [0, 0, 0], [1, 1, 1], seam);
  // Fine molded landmarks on the compression panel, kept low-contrast like real matte plastic.
  add(tube([-0.6, 0.357, -0.37], [-0.6, 0.359, -0.13], 0.0045, 0.0045, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.78, 0.345, -0.39], [-0.69, 0.357, -0.35], 0.005, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.69, 0.357, -0.35], [-0.6, 0.36, -0.34], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.6, 0.36, -0.34], [-0.51, 0.357, -0.35], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.51, 0.357, -0.35], [-0.42, 0.345, -0.39], 0.005, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  // Short curved seams suggest a molded torso shell rather than a segmented toy figure.
  add(tube([-0.79, 0.285, -0.22], [-0.72, 0.31, -0.17], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.72, 0.31, -0.17], [-0.6, 0.318, -0.15], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.6, 0.318, -0.15], [-0.48, 0.31, -0.17], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);
  add(tube([-0.48, 0.31, -0.17], [-0.41, 0.285, -0.22], 0.004, 0.004, 12), [0, 0, 0], [1, 1, 1], seam);

  // Scale the complete body to a realistic adult training-mannequin length (~1.85 m).
  // Transform normals with the inverse scale so the highlights remain smooth.
  const lengthScale = 0.72;
  for (const part of parts) {
    part.position[2] *= lengthScale;
    const p = part.geometry.p;
    const n = part.geometry.n;
    for (let i = 2; i < p.length; i += 3) p[i] *= lengthScale;
    for (let i = 2; i < n.length; i += 3) n[i] /= lengthScale;
    for (let i = 0; i < n.length; i += 3) {
      const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
      n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
    }
  }
  return parts;
}
