'use client';

import { useEffect, useRef, useState } from 'react';

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
  vec3 light = normalize(vec3(-0.45, 0.85, 0.65));
  float diffuse = max(dot(n, light), 0.0);
  float shade = 0.42 + diffuse * 0.58;
  gl_FragColor = vec4(uColor * shade, 1.0);
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
  const faces = [
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
    [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
    [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
    [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
    [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
  ];
  const p:number[]=[]; const n:number[]=[];
  for (const f of faces) {
    const ids=[0,1,2,0,2,3];
    for (const id of ids) { p.push(...f[id]); n.push(...f[4]); }
  }
  return {p,n};
}

function sphereData(rows=14, cols=20) {
  const p:number[]=[]; const n:number[]=[];
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
    const u=x/cols, v=y/rows, u2=(x+1)/cols, v2=(y+1)/rows;
    const point=(a:number,b:number)=>[Math.sin(b*Math.PI)*Math.cos(a*2*Math.PI),Math.cos(b*Math.PI),Math.sin(b*Math.PI)*Math.sin(a*2*Math.PI)];
    const a=point(u,v), b=point(u2,v), c=point(u2,v2), d=point(u,v2);
    for(const q of [a,b,c,a,c,d]) { p.push(...q); n.push(...q); }
  }
  return {p,n};
}

export default function StudioScene3D({ selected, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) { setWebglAvailable(false); return; }
    setWebglAvailable(true);
    let program: WebGLProgram | null = null;
    let raf = 0;
    let yaw = 0.62;
    let pitch = 0.48;
    let distance = 8.8;
    let dragging = false;
    let lastX = 0, lastY = 0;
    try {
      program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Ошибка программы');
      gl.useProgram(program);

      const cube = cubeData();
      const sphere = sphereData();
      const createBuffer = (data:number[]) => {
        const buffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        return buffer;
      };
      const meshes: { mesh:Mesh; p:WebGLBuffer; n:WebGLBuffer; count:number; shape:'cube'|'sphere' }[] = [];
      const add=(mesh:Mesh, shape:'cube'|'sphere'='cube')=>{
        const data=shape==='cube'?cube:sphere;
        meshes.push({mesh,p:createBuffer(data.p),n:createBuffer(data.n),count:data.p.length/3,shape});
      };
      const blue=[0.68,0.81,0.87], white=[0.88,0.93,0.95], metal=[0.48,0.61,0.67], skin=[0.79,0.55,0.42], scrubs=[0.16,0.43,0.56], dark=[0.08,0.19,0.24], green=[0.12,0.62,0.43], amber=[0.9,0.63,0.2];
      // Room shell and floor
      add({position:[0,-0.16,0],scale:[5.2,0.12,4.1],color:[0.76,0.84,0.88]});
      add({position:[0,2.7,-3.6],scale:[5.2,2.8,0.12],color:[0.9,0.94,0.96]});
      add({position:[-5.05,2.7,0],scale:[0.12,2.8,3.7],color:[0.83,0.9,0.93]});
      // Bed frame, mattress and legs
      add({position:[-0.1,0.83,0],scale:[2.35,0.13,0.88],color:white});
      add({position:[-0.1,0.67,0],scale:[2.18,0.08,0.76],color:metal});
      for(const x of [-1.9,1.65]) for(const z of [-0.62,0.62]) {
        add({position:[x,0.35,z],scale:[0.07,0.34,0.07],color:metal});
        add({position:[x,0.08,z],scale:[0.12,0.07,0.12],color:dark},'sphere');
      }
      add({position:[-2.43,1.0,0],scale:[0.12,0.34,0.92],color:blue});
      // Patient mannequin, lying on back, head at left
      add({position:[-1.83,1.22,0],scale:[0.31,0.31,0.31],color:skin},'sphere');
      add({position:[-1.22,1.1,0],scale:[0.68,0.28,0.47],color:scrubs},'sphere');
      add({position:[-0.45,1.08,0],scale:[0.78,0.24,0.43],color:scrubs},'sphere');
      add({position:[0.55,1.07,0.22],scale:[0.86,0.2,0.24],color:blue},'sphere');
      add({position:[0.55,1.07,-0.22],scale:[0.86,0.2,0.24],color:blue},'sphere');
      // Arms resting alongside the torso
      add({position:[-0.85,0.98,0.58],scale:[0.74,0.13,0.13],color:skin,rotation:[0,0,-0.05]},'sphere');
      add({position:[-0.85,0.98,-0.58],scale:[0.74,0.13,0.13],color:skin,rotation:[0,0,-0.05]},'sphere');
      // CPR demonstration: forearms approach the centre of the chest,
      // with two clearly visible stacked palms over the sternum.
      add({position:[-0.62,1.34,0.34],scale:[0.48,0.085,0.105],color:skin,rotation:[0,0.58,0]},'sphere');
      add({position:[-0.62,1.34,-0.34],scale:[0.48,0.085,0.105],color:skin,rotation:[0,-0.58,0]},'sphere');
      const cprHands: Mesh[] = [];
      const upperPalm: Mesh = {position:[-0.48,1.43,0.015],scale:[0.19,0.055,0.145],color:skin};
      const lowerPalm: Mesh = {position:[-0.48,1.37,0.015],scale:[0.17,0.045,0.13],color:[0.72,0.47,0.36]};
      cprHands.push(upperPalm, lowerPalm);
      add(upperPalm,'sphere');
      add(lowerPalm,'sphere');
      // Monitor and stand
      add({position:[2.9,1.72,-0.2],scale:[0.58,0.43,0.16],color:metal});
      add({position:[2.9,1.75,0.0],scale:[0.49,0.33,0.04],color:dark});
      add({position:[2.9,1.1,-0.2],scale:[0.08,0.48,0.08],color:metal});
      add({position:[2.9,0.62,-0.2],scale:[0.42,0.07,0.34],color:metal});
      // AED cart/device
      add({position:[-3.2,1.2,0.7],scale:[0.42,0.52,0.27],color:white});
      add({position:[-3.2,1.26,0.99],scale:[0.27,0.23,0.035],color:dark});
      add({position:[-3.2,0.83,0.7],scale:[0.12,0.12,0.12],color:amber},'sphere');
      add({position:[-3.2,0.54,0.7],scale:[0.55,0.08,0.38],color:metal});
      // Wall-mounted clinical panel
      add({position:[2.8,2.55,-3.35],scale:[0.9,0.48,0.1],color:blue});
      add({position:[2.8,2.55,-3.22],scale:[0.68,0.28,0.04],color:dark});

      const positionLoc=gl.getAttribLocation(program,'aPosition');
      const normalLoc=gl.getAttribLocation(program,'aNormal');
      const mvpLoc=gl.getUniformLocation(program,'uMvp');
      const modelLoc=gl.getUniformLocation(program,'uModel');
      const colorLoc=gl.getUniformLocation(program,'uColor');
      const draw=()=>{
        const width=canvas.clientWidth, height=canvas.clientHeight;
        const dpr=Math.min(window.devicePixelRatio||1,1.6);
        if(canvas.width!==Math.floor(width*dpr)||canvas.height!==Math.floor(height*dpr)){canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);}
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.clearColor(0.88,0.93,0.96,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        const target=[0,1.05,0];
        const eye=[target[0]+Math.sin(yaw)*Math.cos(pitch)*distance,target[1]+Math.sin(pitch)*distance,target[2]+Math.cos(yaw)*Math.cos(pitch)*distance];
        const vp=multiply(perspective(0.72,width/Math.max(height,1),0.1,60),lookAt(eye,target,[0,1,0]));
        for(const item of meshes){
          gl.bindBuffer(gl.ARRAY_BUFFER,item.p); gl.enableVertexAttribArray(positionLoc); gl.vertexAttribPointer(positionLoc,3,gl.FLOAT,false,0,0);
          gl.bindBuffer(gl.ARRAY_BUFFER,item.n); gl.enableVertexAttribArray(normalLoc); gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,0,0);
          const model=modelMatrix(item.mesh);
          gl.uniformMatrix4fv(modelLoc,false,new Float32Array(model));
          gl.uniformMatrix4fv(mvpLoc,false,new Float32Array(multiply(vp,model)));
          const isCprHand = cprHands.includes(item.mesh);
          const handColor = selectedRef.current === 'cpr' && isCprHand
            ? [0.96,0.63,0.22]
            : item.mesh.color;
          gl.uniform3fv(colorLoc,new Float32Array(handColor));
          gl.drawArrays(gl.TRIANGLES,0,item.count);
        }
      };
      const render=()=>{draw();};
      const pointerDown=(e:PointerEvent)=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
      const pointerMove=(e:PointerEvent)=>{if(!dragging)return;yaw-=(e.clientX-lastX)*0.008;pitch=Math.max(0.08,Math.min(1.12,pitch+(e.clientY-lastY)*0.006));lastX=e.clientX;lastY=e.clientY;render();};
      const pointerUp=()=>{dragging=false;};
      const wheel=(e:WheelEvent)=>{distance=Math.max(5.5,Math.min(13,distance+e.deltaY*0.008));render();};
      canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:true});
      const resize=()=>render();window.addEventListener('resize',resize);render();
      return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',wheel);meshes.forEach(m=>{gl.deleteBuffer(m.p);gl.deleteBuffer(m.n);});if(program)gl.deleteProgram(program);};
    } catch {
      setWebglAvailable(false);
      gl.clearColor(0.88,0.93,0.96,1);gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }, []);

  return (
    <div className="scene3d-wrap">
      {webglAvailable ? (
        <>
          <canvas ref={canvasRef} className="scene3d-canvas" aria-label="Объёмная интерактивная сцена симуляционного кабинета. Перетаскивайте для поворота камеры, используйте колесо мыши для масштаба." />
          <div className="scene3d-label">WEBGL · ОБЪЁМНАЯ СЦЕНА</div>
          <div className="scene3d-hotspots">
            <button type="button" className={selected === 'patient' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelect('patient')}>Пациент</button>
            <button type="button" className={selected === 'aed' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelect('aed')}>АНД</button>
            <button type="button" className={selected === 'cpr' ? 'scene3d-hotspot active' : 'scene3d-hotspot'} onClick={() => onSelect('cpr')}>СЛР</button>
          </div>
          <div className="scene3d-hint">Зажмите и перемещайте для поворота · колесо мыши — масштаб</div>
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
