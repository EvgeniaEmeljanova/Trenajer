'use client';

import { useEffect, useRef, useState } from 'react';
import { ROOM_SPEC } from '../scene/room-spec';

type Props = {
  selected: string;
  onSelect: (value: string) => void;
};

type Mesh = { position: number[]; scale: number[]; color: number[]; rotation?: number[] };

const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uMvp;
uniform mat4 uModel;
varying vec3 vNormal;
void main() {
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uMvp * vec4(aPosition, 1.0);
}`;

const fragmentShader = `
precision mediump float;
uniform vec3 uColor;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.45, 0.88, 0.62));
  vec3 fill = normalize(vec3(0.55, 0.25, -0.45));
  vec3 viewDir = normalize(vec3(0.0, 0.38, 0.92));
  vec3 halfDir = normalize(light + viewDir);
  float diffuse = max(dot(n, light), 0.0);
  float softFill = max(dot(n, fill), 0.0);
  float specular = pow(max(dot(n, halfDir), 0.0), 34.0) * 0.2;
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0) * 0.055;
  float shade = 0.43 + diffuse * 0.43 + softFill * 0.12;
  vec3 litColor = uColor * shade + vec3(0.72, 0.82, 0.88) * specular + vec3(0.24, 0.34, 0.4) * rim;
  litColor = pow(max(litColor, vec3(0.0)), vec3(0.94));
  gl_FragColor = vec4(litColor, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Не удалось создать шейдер');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'Ошибка шейдера');
  }
  return shader;
}

function multiply(a: number[], b: number[]) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return out;
}

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect,0,0,0, 0,f,0,0, 0,0,(far + near) * nf,-1, 0,0,2 * far * near * nf,0];
}

function lookAt(eye: number[], center: number[], up: number[]) {
  const norm = (v: number[]) => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const cross = (a: number[], b: number[]) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
  const z = norm(sub(eye, center));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -x[0]*eye[0]-x[1]*eye[1]-x[2]*eye[2], -y[0]*eye[0]-y[1]*eye[1]-y[2]*eye[2], -z[0]*eye[0]-z[1]*eye[1]-z[2]*eye[2],1];
}

function modelMatrix(mesh: Mesh) {
  const [x,y,z] = mesh.position;
  const [sx,sy,sz] = mesh.scale;
  const [rx,ry,rz] = mesh.rotation ?? [0,0,0];
  const cx=Math.cos(rx), sxr=Math.sin(rx), cy=Math.cos(ry), syr=Math.sin(ry), cz=Math.cos(rz), szr=Math.sin(rz);
  const r = [
    cy*cz, cx*szr+sxr*syr*cz, sxr*szr-cx*syr*cz, 0,
    -cy*szr, cx*cz-sxr*syr*szr, sxr*cz+cx*syr*szr, 0,
    syr, -sxr*cy, cx*cy, 0,
    x,y,z,1
  ];
  return multiply(r, [sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1]);
}

function cubeData() {
  // Rounded, bevelled box geometry: softened edges replace the hard block-like silhouette.
  const faces = [
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
    [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
    [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
    [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
    [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
  ];
  const p:number[]=[]; const n:number[]=[];
  const segments=4, bevel=0.14;
  const rounded=(point:number[],faceNormal:number[])=>{
    const core=point.map(v=>Math.max(-1+bevel,Math.min(1-bevel,v)));
    const delta=point.map((v,i)=>v-core[i]);
    const length=Math.hypot(...delta);
    const normal=length>1e-6?delta.map(v=>v/length):faceNormal;
    return {position:core.map((v,i)=>v+normal[i]*bevel),normal};
  };
  const mix=(a:number[],b:number[],t:number)=>a.map((v,i)=>v+(b[i]-v)*t);
  for(const face of faces){
    const [a,b,c,d,faceNormal]=face as number[][]; 
    const grid:number[][][]=[];
    for(let y=0;y<=segments;y++){
      const row:number[][]=[];
      for(let x=0;x<=segments;x++){
        const top=mix(a,b,x/segments),bottom=mix(d,c,x/segments);
        row.push(mix(top,bottom,y/segments));
      }
      grid.push(row);
    }
    for(let y=0;y<segments;y++)for(let x=0;x<segments;x++){
      const vertices=[grid[y][x],grid[y][x+1],grid[y+1][x+1],grid[y][x],grid[y+1][x+1],grid[y+1][x]];
      for(const vertex of vertices){
        const roundedVertex=rounded(vertex,faceNormal);
        p.push(...roundedVertex.position);n.push(...roundedVertex.normal);
      }
    }
  }
  return {p,n};
}

function sphereData(rows=24, cols=32) {
  const p:number[]=[]; const n:number[]=[];
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const u=x/cols, v=y/rows, u2=(x+1)/cols, v2=(y+1)/rows;
    const point=(a:number,b:number)=>[Math.sin(b*Math.PI)*Math.cos(a*2*Math.PI),Math.cos(b*Math.PI),Math.sin(b*Math.PI)*Math.sin(a*2*Math.PI)];
    const a=point(u,v), b=point(u2,v), d=point(u,v2), e=point(u2,v2);
    for(const q of [a,b,e,a,e,d]) { p.push(...q); n.push(...q); }
  }
  return {p,n};
}

function cylinderData(segments=24) {
  const p:number[]=[]; const n:number[]=[];
  for(let i=0;i<segments;i++) {
    const a=i/segments*Math.PI*2, b=(i+1)/segments*Math.PI*2;
    const p1=[Math.cos(a),-1,Math.sin(a)], p2=[Math.cos(b),-1,Math.sin(b)];
    const p3=[Math.cos(b),1,Math.sin(b)], p4=[Math.cos(a),1,Math.sin(a)];
    const n1=[Math.cos(a),0,Math.sin(a)], n2=[Math.cos(b),0,Math.sin(b)];
    for(const [q,norm] of [[p1,n1],[p2,n2],[p3,n2],[p1,n1],[p3,n2],[p4,n1]] as number[][][]) { p.push(...q); n.push(...norm); }
    for(const q of [[0,-1,0],p2,p1,[0,1,0],p4,p3]) { p.push(...q); n.push(0,q[1]===-1?-1:1,0); }
  }
  return {p,n};
}

export default function StudioScene3D({ selected, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  const nearestRef = useRef<{ id: string; label: string; action: string } | null>(null);
  const [nearby, setNearby] = useState<string | null>(null);
  selectedRef.current = selected;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) { setWebglAvailable(false); return; }
    setWebglAvailable(true);
    let program: WebGLProgram | null = null;
    let raf = 0;
    let yaw = 0;
    let pitch = 0;
    const player = { x: 0, y: 1.6, z: 0 };
    let dragging = false;
    let lastX = 0, lastY = 0;
    const keys = new Set<string>();
    const targets = [
      { id: 'manikin_cpr', label: 'Манекен для СЛР', action: 'patient', position: [-0.6, 0.2, 0] },
      { id: 'manikin_choking_vest', label: 'Тренажёр-жилет', action: 'choking', position: [-1.45, 0.2, 1.05] },
      { id: 'phone', label: 'Телефон для вызова помощи', action: 'call', position: [0.15, 0.1, 0.92] },
      { id: 'aed', label: 'Учебный АНД', action: 'aed', position: [0.04, 0.92, -0.34] },
      { id: 'antiseptic_stand', label: 'Подставка с антисептиком', action: 'antiseptic', position: [1.35, 0.5, -1.45] },
    ];
    let lastNearby = '';
    let lastFrame = performance.now();
    let chestAnimationStart = 0;
    try {
      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Ошибка программы');
      gl.useProgram(program);

      const device = navigator as Navigator & { deviceMemory?: number };
      const cores = navigator.hardwareConcurrency || 4;
      const memory = device.deviceMemory || 4;
      const lowPower = cores <= 4 || memory <= 4;
      const cube = cubeData();
      const sphere = sphereData(lowPower ? 16 : 30, lowPower ? 24 : 40);
      const cylinder = cylinderData(lowPower ? 16 : 28);
      const createBuffer = (data:number[]) => {
        const buffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        return buffer;
      };
      const meshes: { mesh:Mesh; p:WebGLBuffer; n:WebGLBuffer; count:number; shape:'cube'|'sphere'|'cylinder' }[] = [];
      const add=(mesh:Mesh, shape:'cube'|'sphere'|'cylinder'='cube')=>{
        const data=shape==='cube'?cube:shape==='sphere'?sphere:cylinder;
        meshes.push({mesh,p:createBuffer(data.p),n:createBuffer(data.n),count:data.p.length/3,shape});
        return mesh;
      };
      const blue=[0.68,0.81,0.87], white=[0.88,0.93,0.95], metal=[0.48,0.61,0.67], skin=[0.79,0.55,0.42], scrubs=[0.16,0.43,0.56], dark=[0.08,0.19,0.24], green=[0.12,0.62,0.43], amber=[0.9,0.63,0.2];
      const spec = (id: string) => ROOM_SPEC.objects.find((item) => item.id === id)!;
      const addBox = (id: string, color: number[], yOffset = 0) => {
        const o = spec(id);
        add({position:[o.position[0],o.position[1]+yOffset,o.position[2]],scale:[o.size[0]/2,o.size[1]/2,o.size[2]/2],color,rotation:[0,((o.rotationY ?? 0)*Math.PI)/180,0]});
      };
      const addCylinder = (position:number[], radius:number, height:number, color:number[]) =>
        add({position,scale:[radius,height/2,radius],color},'cylinder');
      const addSphere = (position:number[], scale:number[], color:number[]) =>
        add({position,scale,color},'sphere');
      // Room shell: 5 x 5 x 3 metres. North is -Z, south is +Z.
      add({position:[0,-0.08,0],scale:[2.5,0.08,2.5],color:[0.78,0.76,0.72]});
      add({position:[0,1.5,-2.5],scale:[2.5,1.5,0.05],color:[0.92,0.94,0.94]});
      add({position:[0,1.5,2.5],scale:[2.5,1.5,0.05],color:[0.91,0.93,0.94]});
      add({position:[-2.5,1.5,0],scale:[0.05,1.5,2.5],color:[0.86,0.9,0.92]});
      add({position:[2.5,1.5,0],scale:[0.05,1.5,2.5],color:[0.86,0.9,0.92]});
      add({position:[0,3,0],scale:[2.5,0.05,2.5],color:[0.97,0.97,0.95]});
      // Floor mats.
      addBox('mat_patient',[0.25,0.55,0.67],0.015);
      addBox('mat_rescuer',[0.33,0.57,0.68],0.015);
      // Subtle contact shadows ground the mannequin and equipment in the room.
      addSphere([-0.6,0.039,0.12],[0.31,0.004,0.9],[0.59,0.64,0.68]);
      addSphere([0.04,0.006,-0.34],[0.22,0.003,0.16],[0.62,0.67,0.7]);
      addSphere([1.35,0.006,-1.45],[0.2,0.003,0.17],[0.62,0.67,0.7]);
      addSphere([2.0,0.006,-0.8],[0.68,0.003,0.42],[0.62,0.67,0.7]);
      // Adult CPR training mannequin: anatomical segments, neutral molded face and articulated limbs.
      const mannequin=[0.78,0.61,0.45], mannequinLight=[0.9,0.75,0.61], mannequinShade=[0.62,0.43,0.33];
      const addLimb=(start:number[],end:number[],radius:number,color:number[])=>{
        const mid=start.map((v,i)=>(v+end[i])/2);
        const dx=end[0]-start[0], dy=end[1]-start[1], dz=end[2]-start[2];
        const length=Math.hypot(dx,dy,dz);
        const rotation=Math.abs(dx)>Math.abs(dz) ? [0,0,Math.PI/2] : [Math.PI/2,0,0];
        add({position:mid,scale:[radius,length/2,radius],color,rotation},'cylinder');
        addSphere(start,[radius,radius,radius],color);
        addSphere(end,[radius,radius,radius],color);
      };
      // Head, ears, neck and facial relief.
      addSphere([-0.6,0.25,-0.73],[0.18,0.125,0.2],mannequin);
      addSphere([-0.6,0.255,-0.79],[0.125,0.075,0.105],mannequinLight);
      addSphere([-0.6,0.205,-0.64],[0.075,0.06,0.075],mannequinShade);
      addSphere([-0.78,0.245,-0.73],[0.035,0.05,0.045],mannequin);
      addSphere([-0.42,0.245,-0.73],[0.035,0.05,0.045],mannequin);
      addSphere([-0.66,0.27,-0.855],[0.018,0.014,0.012],dark);
      addSphere([-0.54,0.27,-0.855],[0.018,0.014,0.012],dark);
      addSphere([-0.6,0.245,-0.835],[0.025,0.025,0.022],mannequinShade);
      addSphere([-0.6,0.215,-0.82],[0.045,0.012,0.018],mannequinShade);
      // Neck and upper torso; chest remains a dedicated animated mesh for CPR.
      addCylinder([-0.6,0.22,-0.49],0.085,0.16,mannequin);
      addSphere([-0.6,0.205,-0.36],[0.245,0.105,0.22],mannequin);
      const chestMesh = addSphere([-0.6,0.23,-0.22],[0.225,0.13,0.34],mannequinLight);
      const chestBaseScale = [...chestMesh.scale];
      addSphere([-0.6,0.2,0.18],[0.19,0.105,0.22],mannequin);
      addSphere([-0.6,0.19,0.55],[0.17,0.105,0.18],mannequin);
      // Shoulder joints and arms, slightly angled away from the torso.
      addLimb([-0.79,0.205,-0.34],[-1.02,0.19,-0.18],0.075,mannequin);
      addLimb([-1.02,0.19,-0.18],[-1.12,0.16,0.08],0.062,mannequinLight);
      addLimb([-0.41,0.205,-0.34],[-0.18,0.19,-0.18],0.075,mannequin);
      addLimb([-0.18,0.19,-0.18],[-0.08,0.16,0.08],0.062,mannequinLight);
      // Pelvis, separated thighs, lower legs and molded feet.
      addSphere([-0.6,0.18,0.68],[0.205,0.105,0.19],mannequinShade);
      addLimb([-0.69,0.17,0.72],[-0.7,0.15,1.12],0.085,mannequin);
      addLimb([-0.7,0.15,1.12],[-0.7,0.13,1.48],0.065,mannequinLight);
      addSphere([-0.7,0.13,1.58],[0.085,0.065,0.15],mannequin);
      addLimb([-0.51,0.17,0.72],[-0.5,0.15,1.12],0.085,mannequin);
      addLimb([-0.5,0.15,1.12],[-0.5,0.13,1.48],0.065,mannequinLight);
      addSphere([-0.5,0.13,1.58],[0.085,0.065,0.15],mannequin);
      // Choking-response training vest / manikin beside the CPR mat.
      add({position:[-1.45,0.23,1.05],scale:[0.22,0.13,0.46],color:[0.85,0.55,0.16]},'sphere');
      // Phone, AED, antiseptic station and APK desk.
      addBox('phone',dark,0.02);
      // Compact AED trainer placed directly on the floor beside the patient's upper chest — no trolley or stand.
      const aedX=0.04, aedZ=-0.34, aedY=0.20;
      addBox('aed',white,0);
      // Front face and readable training display.
      add({position:[aedX,aedY,aedZ-0.116],scale:[0.112,0.062,0.008],color:dark});
      add({position:[aedX-0.027,aedY+0.012,aedZ-0.126],scale:[0.056,0.031,0.004],color:[0.08,0.32,0.37]});
      add({position:[aedX-0.027,aedY+0.014,aedZ-0.13],scale:[0.04,0.002,0.002],color:[0.2,0.92,0.76]});
      add({position:[aedX-0.027,aedY-0.006,aedZ-0.13],scale:[0.045,0.002,0.002],color:[0.72,0.9,0.88]});
      add({position:[aedX+0.055,aedY+0.022,aedZ-0.126],scale:[0.018,0.009,0.004],color:green});
      add({position:[aedX+0.055,aedY,aedZ-0.126],scale:[0.018,0.009,0.004],color:amber});
      addSphere([aedX-0.065,aedY-0.047,aedZ-0.13],[0.022,0.022,0.012],green);
      addSphere([aedX+0.02,aedY-0.047,aedZ-0.13],[0.027,0.027,0.014],[0.86,0.16,0.12]);
      addSphere([aedX+0.085,aedY-0.047,aedZ-0.13],[0.016,0.016,0.01],amber);
      // Two electrode pads placed beside the device, with short visible leads.
      add({position:[aedX+0.22,0.025,aedZ-0.02],scale:[0.065,0.012,0.045],color:white});
      add({position:[aedX+0.22,0.025,aedZ+0.12],scale:[0.065,0.012,0.045],color:white});
      add({position:[aedX+0.22,0.04,aedZ-0.02],scale:[0.04,0.005,0.025],color:[0.16,0.7,0.66]});
      add({position:[aedX+0.22,0.04,aedZ+0.12],scale:[0.04,0.005,0.025],color:[0.16,0.7,0.66]});
      addLimb([aedX+0.07,0.17,aedZ-0.10],[aedX+0.15,0.09,aedZ-0.04],0.008,dark);
      addLimb([aedX+0.15,0.09,aedZ-0.04],[aedX+0.20,0.04,aedZ-0.02],0.008,dark);
      addLimb([aedX+0.07,0.17,aedZ-0.10],[aedX+0.15,0.09,aedZ+0.10],0.008,dark);
      addLimb([aedX+0.15,0.09,aedZ+0.10],[aedX+0.20,0.04,aedZ+0.12],0.008,dark);
      // Cable coils and the trolley's rounded metal uprights.
      addCylinder([1.35,0.25,-1.45],0.025,0.42,metal);
      addCylinder([1.22,0.1,-1.45],0.018,0.18,dark);
      addCylinder([1.48,0.1,-1.45],0.018,0.18,dark);
      addBox('antiseptic_stand',metal);
      addSphere([1.35,0.68,-1.45],[0.07,0.18,0.07],green);
      addSphere([1.35,0.68,-1.45],[0.04,0.1,0.04],white);
      addBox('apk_desk',white);
      addCylinder([2.0,0.34,-0.8],0.045,0.68,metal);
      addCylinder([1.55,0.34,-0.55],0.035,0.68,metal);
      addCylinder([2.45,0.34,-0.55],0.035,0.68,metal);
      addCylinder([1.55,0.34,-1.05],0.035,0.68,metal);
      addCylinder([2.45,0.34,-1.05],0.035,0.68,metal);
      addBox('apk_chair_1',metal);
      addBox('apk_chair_2',metal);
      addBox('apk_pc',dark);
      addBox('apk_pc_cpr',dark);
      addBox('apk_camera',metal);
      addBox('tech_camera',dark);
      addBox('tech_shelf',metal);
      // Door and wall-mounted station display / clock.
      addBox('door',[0.48,0.57,0.62]);
      add({position:[-2.44,1.6,0],scale:[0.025,0.23,0.35],color:dark});
      add({position:[-2.41,2.0,0.9],scale:[0.025,0.12,0.12],color:white});
      // Soft ceiling fixtures.
      for (const x of [-1.4,1.4]) for (const z of [-1.35,1.35]) {
        add({position:[x,2.88,z],scale:[0.42,0.025,0.28],color:[1,0.98,0.88]});
      }

      const positionLoc=gl.getAttribLocation(program,'aPosition');
      const normalLoc=gl.getAttribLocation(program,'aNormal');
      const mvpLoc=gl.getUniformLocation(program,'uMvp');
      const modelLoc=gl.getUniformLocation(program,'uModel');
      const colorLoc=gl.getUniformLocation(program,'uColor');
      const draw=()=>{
        const width=canvas.clientWidth, height=canvas.clientHeight;
        const qualityCap = lowPower ? 1 : cores <= 8 ? 1.25 : 1.6;
        const dpr=Math.min(window.devicePixelRatio||1,qualityCap);
        if(canvas.width!==Math.floor(width*dpr)||canvas.height!==Math.floor(height*dpr)){canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);}
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.clearColor(0.88,0.93,0.96,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
        const eye=[player.x,player.y,player.z];
        const target=[eye[0]+forward[0],eye[1]+forward[1],eye[2]+forward[2]];
        const vp=multiply(perspective(ROOM_SPEC.camera.fov*Math.PI/180,width/Math.max(height,1),0.05,40),lookAt(eye,target,[0,1,0]));
        const compressionPhase = chestAnimationStart ? (performance.now() - chestAnimationStart) / 170 : 1;
        const compressionAmount = compressionPhase >= 0 && compressionPhase < 1 ? Math.sin(compressionPhase * Math.PI) : 0;
        chestMesh.scale[1] = chestBaseScale[1] * (1 - compressionAmount * 0.22);
        chestMesh.position[1] = 0.23 - compressionAmount * 0.018;
        for(const item of meshes){
          gl.bindBuffer(gl.ARRAY_BUFFER,item.p); gl.enableVertexAttribArray(positionLoc); gl.vertexAttribPointer(positionLoc,3,gl.FLOAT,false,0,0);
          gl.bindBuffer(gl.ARRAY_BUFFER,item.n); gl.enableVertexAttribArray(normalLoc); gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,0,0);
          const model=modelMatrix(item.mesh);
          gl.uniformMatrix4fv(modelLoc,false,new Float32Array(model));
          gl.uniformMatrix4fv(mvpLoc,false,new Float32Array(multiply(vp,model)));
          gl.uniform3fv(colorLoc,new Float32Array(item.mesh.color));
          gl.drawArrays(gl.TRIANGLES,0,item.count);
        }
      };
      const render=()=>{draw();};
      let pointerStartX = 0, pointerStartY = 0, pointerMoved = false;
      const pointerDown=(e:PointerEvent)=>{dragging=true;pointerMoved=false;pointerStartX=e.clientX;pointerStartY=e.clientY;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
      const pointerMove=(e:PointerEvent)=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.hypot(e.clientX-pointerStartX,e.clientY-pointerStartY)>7)pointerMoved=true;yaw-=dx*0.0045;pitch=Math.max(-0.85,Math.min(0.85,pitch+dy*0.004));lastX=e.clientX;lastY=e.clientY;render();};
      const hitChest=(clientX:number,clientY:number)=>{
        if(selectedRef.current!=='cpr')return false;
        const rect=canvas.getBoundingClientRect();
        const nx=((clientX-rect.left)/rect.width)*2-1;
        const ny=1-((clientY-rect.top)/rect.height)*2;
        const aspect=rect.width/Math.max(rect.height,1);
        const tan=Math.tan((ROOM_SPEC.camera.fov*Math.PI/180)/2);
        const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
        const right=[Math.cos(yaw),0,Math.sin(yaw)];
        const up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)];
        const direction=[0,1,2].map(i=>forward[i]+right[i]*nx*tan*aspect+up[i]*ny*tan);
        const length=Math.hypot(...direction);
        for(let i=0;i<3;i++)direction[i]/=length;
        const origin=[player.x,player.y,player.z];
        const center=[-0.6,0.27,-0.35];
        const radii=[0.25,0.17,0.28];
        const o=origin.map((v,i)=>(v-center[i])/radii[i]);
        const d=direction.map((v,i)=>v/radii[i]);
        const a=d.reduce((sum,v)=>sum+v*v,0);
        const b=2*o.reduce((sum,v,i)=>sum+v*d[i],0);
        const c=o.reduce((sum,v)=>sum+v*v,0)-1;
        const discriminant=b*b-4*a*c;
        const distanceToChest=Math.hypot(player.x-center[0],player.y-center[1],player.z-center[2]);
        if(discriminant<0||distanceToChest>2.1)return false;
        const t=(-b-Math.sqrt(discriminant))/(2*a);
        if(t<=0)return false;
        chestAnimationStart=performance.now();
        onSelectRef.current('compression');
        return true;
      };
      const hitTarget=(clientX:number,clientY:number)=>{
        const rect=canvas.getBoundingClientRect();
        if(!rect.width||!rect.height)return null;
        const nx=((clientX-rect.left)/rect.width)*2-1;
        const ny=1-((clientY-rect.top)/rect.height)*2;
        const aspect=rect.width/Math.max(rect.height,1);
        const tan=Math.tan((ROOM_SPEC.camera.fov*Math.PI/180)/2);
        const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
        const right=[Math.cos(yaw),0,Math.sin(yaw)];
        const up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)];
        const direction=[0,1,2].map(i=>forward[i]+right[i]*nx*tan*aspect+up[i]*ny*tan);
        const length=Math.hypot(...direction);
        for(let i=0;i<3;i++)direction[i]/=length;
        const origin=[player.x,player.y,player.z];
        let closest=Infinity;
        let selectedTarget: typeof targets[number] | null=null;
        for(const target of targets){
          const radius=target.id==='aed'?0.34:target.id==='manikin_cpr'?0.32:0.27;
          const offset=origin.map((v,i)=>v-target.position[i]);
          const b=2*offset.reduce((sum,v,i)=>sum+v*direction[i],0);
          const c=offset.reduce((sum,v)=>sum+v*v,0)-radius*radius;
          const discriminant=b*b-4*c;
          if(discriminant<0)continue;
          const distance=(-b-Math.sqrt(discriminant))/2;
          if(distance>0&&distance<closest){closest=distance;selectedTarget=target;}
        }
        return selectedTarget;
      };
      const interact=()=>{const target=nearestRef.current;if(target)onSelectRef.current(target.action);};
      const pointerUp=(e:PointerEvent)=>{
        const wasMoved=pointerMoved;
        dragging=false;
        if(!wasMoved&&!hitChest(e.clientX,e.clientY)){
          const clicked=hitTarget(e.clientX,e.clientY);
          if(clicked)onSelectRef.current(clicked.action);
        }
      };

      const keyDown=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==='e'){e.preventDefault();interact();return;}if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());}};
      const keyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
      const tick=(now:number)=>{const dt=Math.min((now-lastFrame)/1000,0.05);lastFrame=now;
        const speed=(keys.has('shift')?2.2:1.35)*dt;
        const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
        const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
        const nextX=player.x+(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed;
        const nextZ=player.z+(-Math.cos(yaw)*forward+Math.sin(yaw)*side)*speed;
        const obstacles = [{x:2.0,z:-0.8,r:0.62},{x:2.0,z:-1.5,r:0.34},{x:2.0,z:-0.1,r:0.34},{x:0.9,z:2.25,r:0.48}];
        const blocked=obstacles.some(o=>Math.hypot(nextX-o.x,nextZ-o.z)<o.r);
        if(!blocked){player.x=Math.max(-2.25,Math.min(2.25,nextX));player.z=Math.max(-2.25,Math.min(2.25,nextZ));}
        let nearest: typeof targets[number] | null = null;
        let nearestDistance=2.2;
        const view=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
        for(const target of targets){
          const dx=target.position[0]-player.x,dy=target.position[1]-player.y,dz=target.position[2]-player.z;
          const distance=Math.hypot(dx,dy,dz);
          if(distance>nearestDistance)continue;
          const dot=(dx*view[0]+dy*view[1]+dz*view[2])/Math.max(distance,0.001);
          if(dot>0.28){nearest=target;nearestDistance=distance;}
        }
        nearestRef.current=nearest;
        const nextLabel=nearest?.label ?? '';
        if(nextLabel!==lastNearby){lastNearby=nextLabel;setNearby(nextLabel||null);}
        draw();raf=requestAnimationFrame(tick);
      };
      canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
      window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);
      const resize=()=>render();window.addEventListener('resize',resize);render();raf=requestAnimationFrame(tick);
      return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);meshes.forEach(m=>{gl.deleteBuffer(m.p);gl.deleteBuffer(m.n);});if(program)gl.deleteProgram(program);};
    } catch {
      setWebglAvailable(false);
      gl.clearColor(0.88,0.93,0.96,1);gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }, []);

  return (
    <div className="scene3d-wrap">
      {webglAvailable ? (
        <>
          <canvas ref={canvasRef} className="scene3d-canvas" aria-label="Объёмная интерактивная сцена симуляционного кабинета. Управление от первого лица: WASD или стрелки — движение, мышь/палец — осмотр." />
          <div className="scene3d-label">3D · ВИД ОТ ПЕРВОГО ЛИЦА</div>
          <div className="scene3d-hotspots">
            <button type="button" className={selected === 'patient' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelectRef.current('patient')}>Пациент</button>
            <button type="button" className={selected === 'aed' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelectRef.current('aed')}>АНД</button>
            <button type="button" className={selected === 'cpr' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelectRef.current('cpr')}>СЛР</button>
          </div>
          <div className="scene3d-hint">WASD / стрелки — движение · мышь или палец — осмотр комнаты</div>
          {selected === 'cpr' ? <div className="scene3d-chest-hint">Наведите прицел на грудную клетку манекена и нажмите, чтобы выполнить одну компрессию</div> : nearby && <button type="button" className="scene3d-interact" onClick={() => { const target = nearestRef.current; if (target) onSelect(target.action); }}>E · Взаимодействовать: {nearby}</button>}
        </>
      ) : (
        <div className="scene2d-fallback">
          <div className="fallback-wall"><span>SIMULATION LAB</span><b>01</b></div>
          <div className="fallback-monitor"><i>〰〰〰</i><small>ECG · SpO₂</small></div>
          <div className="fallback-aed">АНД <strong>♥</strong></div>
          <div className="fallback-bed"><div className="fallback-patient"><i /><b /><span /><em /></div></div>
          <p>Упрощённый режим сцены: 3D-графика недоступна на этом устройстве</p>
          <div className="scene3d-hotspots">
            <button type="button" className="scene3d-hotspot" onClick={() => onSelect('patient')}>Пациент</button>
            <button type="button" className="scene3d-hotspot" onClick={() => onSelect('aed')}>АНД</button>
            <button type="button" className="scene3d-hotspot" onClick={() => onSelect('cpr')}>СЛР</button>
          </div>
        </div>
      )}
    </div>
  );
}
