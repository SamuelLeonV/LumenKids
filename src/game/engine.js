// src/game/engine.js
// Vanilla Three.js voxel game, ported from legacy/aventura-biblica.html into a
// bundled module. See .git/sdd/task-4-brief.md.
//
// Changes from the legacy inline <script>:
//   1. `import * as THREE from 'three'` + `import { STORIES }` (no CDN global).
//   2. WebGL feature-detect IIFE removed (Task 5's wrapper detects).
//   3. Everything wrapped in `createGame({ canvas, character, stories, onStar, onWin })`.
//      - Renderer is built on the passed `canvas`.
//      - Module-level STORIES const replaced by the `stories` parameter.
//      - `?char=` query read replaced by the `character` argument.
//      - onStar(story.id) on a correct answer; onWin() on reaching all stars.
//   4. RAF ids + window/document listeners + renderer tracked; dispose() tears them down.
//   5. Simulation math (chunks, voxel, NPC, gravity, delta-time loop) is unchanged.

import * as THREE from 'three';
import { STORIES } from '../data/content.js';

export function createGame({ canvas, character, stories = STORIES, onStar = () => {}, onWin = () => {} }) {

  // ---- teardown bookkeeping (added for dispose) ----
  let rafId = null;                       // id of the latest scheduled animation frame
  const tracked = [];                     // [{ target, type, fn, opts }] for window/document listeners
  function on(target, type, fn, opts) {   // tracked addEventListener for window/document
    target.addEventListener(type, fn, opts);
    tracked.push({ target, type, fn, opts });
  }

  /* =====================================================================
     AVENTURA BÍBLICA — juego educativo de voxels con Three.js
     ===================================================================== */

  // ---------- Parámetros ----------
  const IS_TOUCH = (navigator.maxTouchPoints>0) || ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
  const CHUNK=16, HEIGHT=48, SEA=18, RENDER_DIST = IS_TOUCH?3:4;   // menos chunks en móvil
  const GRAVITY=26, JUMP_V=8.4, WALK=4.6, SPRINT=7.2, REACH=6;

  // ---------- Bloques ----------
  const B={ AIR:0,GRASS:1,DIRT:2,STONE:3,LOG:4,LEAVES:5,SAND:6,PLANKS:7,COBBLE:8,GLASS:9,WATER:10,SNOW:11,GOLD:12 };
  const transparentBlocks=new Set([B.GLASS,B.WATER]);
  const nonSolid=new Set([B.AIR,B.WATER]);

  const tileNames=['grass_top','grass_side','dirt','stone','log_side','log_top','leaves','sand','planks','cobble','glass','water','snow','gold'];
  const tileIndex={}; tileNames.forEach((n,i)=>tileIndex[n]=i);
  const NUM_TILES=tileNames.length;

  const blockTiles={
    [B.GRASS]:{top:'grass_top',bottom:'dirt',side:'grass_side'},
    [B.DIRT]:{top:'dirt',bottom:'dirt',side:'dirt'},
    [B.STONE]:{top:'stone',bottom:'stone',side:'stone'},
    [B.LOG]:{top:'log_top',bottom:'log_top',side:'log_side'},
    [B.LEAVES]:{top:'leaves',bottom:'leaves',side:'leaves'},
    [B.SAND]:{top:'sand',bottom:'sand',side:'sand'},
    [B.PLANKS]:{top:'planks',bottom:'planks',side:'planks'},
    [B.COBBLE]:{top:'cobble',bottom:'cobble',side:'cobble'},
    [B.GLASS]:{top:'glass',bottom:'glass',side:'glass'},
    [B.WATER]:{top:'water',bottom:'water',side:'water'},
    [B.SNOW]:{top:'snow',bottom:'snow',side:'snow'},
    [B.GOLD]:{top:'gold',bottom:'gold',side:'gold'},
  };
  function tileForFace(block,f){ const t=blockTiles[block]; return f===3?t.top:f===2?t.bottom:t.side; }

  const FACES=[
    {dir:[-1,0,0],corners:[{p:[0,1,0],uv:[0,1]},{p:[0,0,0],uv:[0,0]},{p:[0,1,1],uv:[1,1]},{p:[0,0,1],uv:[1,0]}]},
    {dir:[ 1,0,0],corners:[{p:[1,1,1],uv:[0,1]},{p:[1,0,1],uv:[0,0]},{p:[1,1,0],uv:[1,1]},{p:[1,0,0],uv:[1,0]}]},
    {dir:[0,-1,0],corners:[{p:[1,0,1],uv:[1,0]},{p:[0,0,1],uv:[0,0]},{p:[1,0,0],uv:[1,1]},{p:[0,0,0],uv:[0,1]}]},
    {dir:[0, 1,0],corners:[{p:[0,1,1],uv:[1,1]},{p:[1,1,1],uv:[0,1]},{p:[0,1,0],uv:[1,0]},{p:[1,1,0],uv:[0,0]}]},
    {dir:[0,0,-1],corners:[{p:[1,0,0],uv:[0,0]},{p:[0,0,0],uv:[1,0]},{p:[1,1,0],uv:[0,1]},{p:[0,1,0],uv:[1,1]}]},
    {dir:[0,0, 1],corners:[{p:[0,0,1],uv:[0,0]},{p:[1,0,1],uv:[1,0]},{p:[0,1,1],uv:[0,1]},{p:[1,1,1],uv:[1,1]}]},
  ];
  const faceBright=[0.72,0.78,0.55,1.0,0.68,0.86];

  // =====================================================================
  //  ATLAS DE TEXTURAS
  // =====================================================================
  const TILE=16;
  let atlasCanvas;
  function buildAtlas(){
    const c=document.createElement('canvas'); c.width=TILE*NUM_TILES; c.height=TILE;
    const ctx=c.getContext('2d'); atlasCanvas=c;
    const set=(ox,x,y,r,g,b,a=1)=>{ ctx.fillStyle=`rgba(${r|0},${g|0},${b|0},${a})`; ctx.fillRect(ox+x,y,1,1); };
    const rnd=v=>(Math.random()-0.5)*v;
    const fill=(name,base,varc,extra)=>{ const ox=tileIndex[name]*TILE;
      for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const n=rnd(varc); set(ox,x,y,base[0]+n,base[1]+n,base[2]+n); if(extra)extra(ox,x,y,set); } };

    fill('dirt',[122,82,48],26);
    fill('stone',[128,128,130],26);
    fill('sand',[219,206,150],20);
    fill('snow',[238,242,248],8);
    fill('grass_top',[92,150,64],26);
    fill('leaves',[60,116,44],38,(ox,x,y,set)=>{ if(Math.random()<0.12)set(ox,x,y,40,86,30); });
    fill('planks',[176,128,64],16,(ox,x,y,set)=>{ if(y%4===3)set(ox,x,y,120,84,40); });
    fill('gold',[232,196,64],16,(ox,x,y,set)=>{ if(Math.random()<0.12)set(ox,x,y,255,238,150); });
    fill('cobble',[120,120,122],8,(ox,x,y,set)=>{ const cx=(x+1)%5,cy=(y+1)%5; if(cx===0||cy===0)set(ox,x,y,80,80,82); else if(Math.random()<0.15)set(ox,x,y,150,150,152); });
    (()=>{ const ox=tileIndex['grass_side']*TILE; for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const n=rnd(24);
      if(y<3)set(ox,x,y,92+n,150+n,64+n); else if(y<5&&Math.random()<0.5)set(ox,x,y,92+n,150+n,64+n); else set(ox,x,y,122+n,82+n,48+n); } })();
    (()=>{ const ox=tileIndex['log_side']*TILE; for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const s=(x%4===0)?-22:rnd(16); set(ox,x,y,110+s,80+s,42+s); } })();
    (()=>{ const ox=tileIndex['log_top']*TILE,c0=7.5; for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const d=Math.hypot(x-c0,y-c0),r=(Math.sin(d*1.6)*0.5+0.5)*40; set(ox,x,y,150-r+rnd(8),110-r+rnd(8),60-r+rnd(8)); } })();
    (()=>{ const ox=tileIndex['glass']*TILE; for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const b=(x===0||y===0||x===TILE-1||y===TILE-1);
      if(b)set(ox,x,y,210,235,245,.95); else if(Math.random()<0.06)set(ox,x,y,235,250,255,.6); else set(ox,x,y,200,225,240,.12); } })();
    (()=>{ const ox=tileIndex['water']*TILE; for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ const n=rnd(22); set(ox,x,y,52+n,110+n,176+n,1); } })();

    const tex=new THREE.CanvasTexture(c);
    tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter; tex.generateMipmaps=false;
    return tex;
  }

  // =====================================================================
  //  RUIDO + BIOMAS
  // =====================================================================
  function makeNoise(seed){
    let s=seed>>>0; const rand=()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    const p=new Uint8Array(512), perm=Array.from({length:256},(_,i)=>i);
    for(let i=255;i>0;i--){ const j=(rand()*(i+1))|0; [perm[i],perm[j]]=[perm[j],perm[i]]; }
    for(let i=0;i<512;i++)p[i]=perm[i&255];
    const grad=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    const F2=0.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;
    return function(xin,yin){
      const s2=(xin+yin)*F2,i=Math.floor(xin+s2),j=Math.floor(yin+s2),t=(i+j)*G2;
      const x0=xin-(i-t),y0=yin-(j-t); let i1,j1; if(x0>y0){i1=1;j1=0;}else{i1=0;j1=1;}
      const x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255;
      const g0=grad[p[ii+p[jj]]&7],g1=grad[p[ii+i1+p[jj+j1]]&7],g2=grad[p[ii+1+p[jj+1]]&7];
      const n=(gx,gy,xx,yy)=>{ let tt=0.5-xx*xx-yy*yy; if(tt<0)return 0; tt*=tt; return tt*tt*(gx*xx+gy*yy); };
      return 70*(n(g0[0],g0[1],x0,y0)+n(g1[0],g1[1],x1,y1)+n(g2[0],g2[1],x2,y2));
    };
  }
  const SEED=2024;
  const noise=makeNoise(SEED), biomeNoise=makeNoise(SEED+99);

  function fbm(x,z){ let amp=1,freq=1/74,sum=0,norm=0; for(let o=0;o<4;o++){ sum+=noise(x*freq,z*freq)*amp; norm+=amp; amp*=0.5; freq*=2; } return sum/norm; }
  function heightAt(x,z){ return Math.floor(22+fbm(x,z)*12); }

  // 0 jardín, 1 bosque, 2 desierto, 3 nieve
  function biomeAt(x,z){
    const b=biomeNoise(x/230,z/230);
    if(b<-0.35) return 2;
    if(b>0.45)  return 3;
    if(b>0.12)  return 1;
    return 0;
  }
  function surfaceOf(biome){ return biome===2?B.SAND : biome===3?B.SNOW : B.GRASS; }
  function treeChanceOf(biome){ return biome===1?0.05 : biome===0?0.02 : biome===3?0.012 : 0.0; }

  function columnBlock(y,h,surf){
    if(y===0) return B.STONE;
    if(y>h)   return y<=SEA?B.WATER:B.AIR;
    if(y===h) return (h<=SEA+1)?B.SAND:surf;
    if(y>h-4) return surf===B.SAND?B.SAND:B.DIRT;
    return B.STONE;
  }
  function terrainBlock(x,y,z){ if(y<0||y>=HEIGHT)return B.AIR; return columnBlock(y,heightAt(x,z),surfaceOf(biomeAt(x,z))); }
  function hash2(x,z){ let n=(x*374761393+z*668265263)|0; n=Math.imul(n^(n>>>13),1274126177); n=n^(n>>>16); return ((n>>>0)/4294967296); }

  // =====================================================================
  //  CHUNKS
  // =====================================================================
  const chunks=new Map();
  const idxOf=(lx,y,lz)=>((y*CHUNK)+lz)*CHUNK+lx;

  function generateChunk(cx,cz){
    const data=new Uint8Array(CHUNK*CHUNK*HEIGHT);
    for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++){
      const wx=cx*CHUNK+lx,wz=cz*CHUNK+lz,h=heightAt(wx,wz),surf=surfaceOf(biomeAt(wx,wz));
      for(let y=0;y<HEIGHT;y++)data[idxOf(lx,y,lz)]=columnBlock(y,h,surf);
    }
    for(let lx=2;lx<CHUNK-2;lx++)for(let lz=2;lz<CHUNK-2;lz++){
      const wx=cx*CHUNK+lx,wz=cz*CHUNK+lz,h=heightAt(wx,wz),biome=biomeAt(wx,wz);
      if(h<=SEA+1||h>=HEIGHT-7)continue;
      if(hash2(wx,wz)>treeChanceOf(biome))continue;
      const th=4+((hash2(wx+7,wz-3)*2)|0);
      for(let t=1;t<=th;t++)data[idxOf(lx,h+t,lz)]=B.LOG;
      const top=h+th;
      for(let dy=-2;dy<=1;dy++){ const r=dy===1?1:2;
        for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
          if(dx===0&&dz===0&&dy<1)continue;
          if(Math.abs(dx)===r&&Math.abs(dz)===r&&Math.random()<0.5)continue;
          const ly=top+dy,llx=lx+dx,llz=lz+dz;
          if(ly<0||ly>=HEIGHT||llx<0||llx>=CHUNK||llz<0||llz>=CHUNK)continue;
          if(data[idxOf(llx,ly,llz)]===B.AIR)data[idxOf(llx,ly,llz)]=B.LEAVES;
        }
      }
    }
    return {cx,cz,ox:cx*CHUNK,oz:cz*CHUNK,data,mesh:null,transMesh:null};
  }
  const getChunk=(cx,cz)=>chunks.get(cx+','+cz);
  function getBlock(x,y,z){
    if(y<0||y>=HEIGHT)return B.AIR;
    const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK),ch=getChunk(cx,cz);
    if(ch)return ch.data[idxOf(x-cx*CHUNK,y,z-cz*CHUNK)];
    return terrainBlock(x,y,z);
  }
  function faceVisible(self,nb){ if(nb===B.AIR)return true; if(transparentBlocks.has(nb)&&nb!==self)return true; return false; }

  // =====================================================================
  //  THREE.JS
  // =====================================================================
  const SKY=0xaee3ff;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(SKY);
  scene.fog=new THREE.Fog(SKY,(RENDER_DIST-1.5)*CHUNK,(RENDER_DIST+0.5)*CHUNK);
  const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000); camera.rotation.order='YXZ';
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_TOUCH}); renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH?1.5:2));
  renderer.setSize(innerWidth,innerHeight); renderer.setClearColor(SKY);
  scene.add(new THREE.AmbientLight(0xffffff,1.0));

  const atlasTex=buildAtlas();
  const matOpaque=new THREE.MeshLambertMaterial({map:atlasTex,vertexColors:true});
  const matTrans =new THREE.MeshLambertMaterial({map:atlasTex,vertexColors:true,transparent:true,opacity:0.78,depthWrite:false,side:THREE.DoubleSide});

  const highlight=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002,1.002,1.002)),
    new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0.4})); highlight.visible=false; scene.add(highlight);

  // ---------- mallas ----------
  const PAD=0.5/(NUM_TILES*TILE);
  function pushFace(buf,wx,y,wz,f,tileName,bright){
    const ti=tileIndex[tileName],u0=ti/NUM_TILES+PAD,u1=(ti+1)/NUM_TILES-PAD,v0=PAD,v1=1-PAD;
    const base=buf.pos.length/3,face=FACES[f],d=face.dir;
    for(const c of face.corners){
      buf.pos.push(wx+c.p[0],y+c.p[1],wz+c.p[2]); buf.norm.push(d[0],d[1],d[2]);
      buf.uv.push(u0+c.uv[0]*(u1-u0),v0+c.uv[1]*(v1-v0)); buf.col.push(bright,bright,bright);
    }
    buf.idx.push(base,base+1,base+2,base+2,base+1,base+3);
  }
  function buildChunkMesh(ch){
    const op={pos:[],norm:[],uv:[],col:[],idx:[]},tr={pos:[],norm:[],uv:[],col:[],idx:[]};
    for(let lx=0;lx<CHUNK;lx++)for(let lz=0;lz<CHUNK;lz++)for(let y=0;y<HEIGHT;y++){
      const block=ch.data[idxOf(lx,y,lz)]; if(block===B.AIR)continue;
      const wx=ch.ox+lx,wz=ch.oz+lz,buf=transparentBlocks.has(block)?tr:op;
      for(let f=0;f<6;f++){ const d=FACES[f].dir; if(!faceVisible(block,getBlock(wx+d[0],y+d[1],wz+d[2])))continue;
        pushFace(buf,wx,y,wz,f,tileForFace(block,f),faceBright[f]); }
    }
    finalize(ch,'mesh',op,matOpaque); finalize(ch,'transMesh',tr,matTrans);
  }
  function finalize(ch,key,buf,mat){
    if(ch[key]){ scene.remove(ch[key]); ch[key].geometry.dispose(); ch[key]=null; }
    if(buf.pos.length===0)return;
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(buf.pos,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(buf.norm,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(buf.uv,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(buf.col,3));
    g.setIndex(buf.idx);
    const m=new THREE.Mesh(g,mat); ch[key]=m; scene.add(m);
  }
  function setBlock(x,y,z,val){
    if(y<0||y>=HEIGHT)return;
    const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK),ch=getChunk(cx,cz); if(!ch)return;
    const lx=x-cx*CHUNK,lz=z-cz*CHUNK; ch.data[idxOf(lx,y,lz)]=val; buildChunkMesh(ch);
    if(lx===0)rb(cx-1,cz); if(lx===CHUNK-1)rb(cx+1,cz); if(lz===0)rb(cx,cz-1); if(lz===CHUNK-1)rb(cx,cz+1);
  }
  function rb(cx,cz){ const ch=getChunk(cx,cz); if(ch)buildChunkMesh(ch); }

  // ---------- gestión de chunks ----------
  const buildQueue=[];
  function updateChunks(){
    const pcx=Math.floor(player.x/CHUNK),pcz=Math.floor(player.z/CHUNK),needed=new Set();
    for(let dx=-RENDER_DIST;dx<=RENDER_DIST;dx++)for(let dz=-RENDER_DIST;dz<=RENDER_DIST;dz++){
      if(dx*dx+dz*dz>RENDER_DIST*RENDER_DIST+1)continue;
      const cx=pcx+dx,cz=pcz+dz,key=cx+','+cz; needed.add(key);
      if(!chunks.has(key)&&!buildQueue.some(q=>q.key===key))buildQueue.push({key,cx,cz,d:dx*dx+dz*dz});
    }
    for(const [key,ch] of chunks)if(!needed.has(key)){
      if(ch.mesh){scene.remove(ch.mesh);ch.mesh.geometry.dispose();}
      if(ch.transMesh){scene.remove(ch.transMesh);ch.transMesh.geometry.dispose();}
      chunks.delete(key);
    }
    buildQueue.sort((a,b)=>a.d-b.d);
  }
  function processQueue(max){ let n=0;
    while(buildQueue.length&&n<max){ const j=buildQueue.shift(); if(chunks.has(j.key))continue;
      const ch=generateChunk(j.cx,j.cz); chunks.set(j.key,ch); buildChunkMesh(ch);
      rb(j.cx-1,j.cz);rb(j.cx+1,j.cz);rb(j.cx,j.cz-1);rb(j.cx,j.cz+1); n++; }
  }
  function groundY(x,z){ for(let y=HEIGHT-1;y>=0;y--){ const b=getBlock(Math.floor(x),y,Math.floor(z)); if(b!==B.AIR&&b!==B.WATER)return y+1; } return SEA+1; }

  // =====================================================================
  //  PERSONAJES BÍBLICOS (NPCs)
  // =====================================================================
  // STORIES llega como parámetro `stories` (fuente única en src/data/content.js).

  const npcs=[];
  function makeBox(w,h,d,color){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color})); }
  // extremidad con pivote arriba (cadera/hombro) para animar el caminar
  function makeLimb(w,h,d,color,px,py,pz){
    const pivot=new THREE.Group(); pivot.position.set(px,py,pz);
    const m=makeBox(w,h,d,color); m.position.y=-h/2; pivot.add(m); return pivot;
  }
  function makeLabel(text,emoji){
    const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const x=cv.getContext('2d');
    x.fillStyle='rgba(255,255,255,.92)'; roundRect(x,4,4,248,56,16); x.fill();
    x.fillStyle='#a85b00'; x.font='bold 30px sans-serif'; x.textBaseline='middle';
    x.fillText(emoji+' '+text, 16, 34);
    const t=new THREE.CanvasTexture(cv);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(3.2,0.8,1); return s;
  }
  function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

  // ---- caracterización: props y compañeros propios de cada personaje ----
  function attachCharacter(def,g,p){
    const add=(w,h,d,c,x,y,z,rz)=>{ const m=makeBox(w,h,d,c); m.position.set(x,y,z); if(rz)m.rotation.z=rz; g.add(m); return m; };
    const beard=(c)=>{ const b=makeBox(0.30,0.30,0.12,c); b.position.set(0,1.45,0.16); g.add(b); };
    const hold=(arm,mesh)=>{ mesh.position.y+=-0.45; arm.add(mesh); return mesh; };  // colgar de la mano
    // ---- "skin": peinado / tocado / faja propios de cada uno ----
    const hair=(c)=>{ add(0.46,0.16,0.46,c,0,1.84,0); add(0.46,0.30,0.14,c,0,1.66,-0.21); };           // copete + nuca
    const cloth=(c,band)=>{ add(0.50,0.14,0.50,c,0,1.86,0);                                            // tocado tipo manto
        add(0.50,0.46,0.16,c,0,1.52,-0.22);
        for(const sx of [-0.25,0.25]) add(0.12,0.46,0.40,c,sx,1.52,0);                                 // caídas laterales
        add(0.52,0.07,0.52,band||0x8a5a33,0,1.79,0); };                                                // cinta
    const cap=(c)=>{ add(0.48,0.24,0.48,c,0,1.88,0); };                                                // gorro
    const sash=(c)=>{ add(0.56,0.13,0.33,c,0,0.98,0,0.2); };                                           // faja cruzada
    switch(def.name){
      case 'Adán y Eva':{                         // Edén: pelo castaño + faldita de hojas + manzana
        hair(0x5a3a23);
        add(0.56,0.22,0.36,0x3d9b3a,0,0.80,0);
        add(0.22,0.10,0.22,0x4caf50,0,1.96,0);    // hojita sobre el pelo
        hold(p.armR, makeBox(0.18,0.18,0.18,0xe23b3b)); break;
      }
      case 'Noé':{                                // anciano: manto + barba blanca + bastón + arca
        cloth(0xcdba93,0x9c6b3a); beard(0xeae3d2);
        hold(p.armR, makeBox(0.06,1.2,0.06,0x6b4527));
        const ark=new THREE.Group();
        ark.add(makeBox(1.5,0.55,0.8,0x7a4a28));
        const cab=makeBox(0.8,0.45,0.55,0x9c6b3a); cab.position.y=0.5; ark.add(cab);
        const roof=makeBox(0.95,0.18,0.7,0xb04632); roof.position.y=0.8; ark.add(roof);
        ark.position.set(-1.7,1.0,0); g.add(ark);
        p.npc.companions.push({mesh:ark,base:1.0,amp:0.12,phase:0}); break;
      }
      case 'Moisés':{                             // manto + faja dorada + barba blanca + cayado + tablas
        cloth(0xeaeaea,0xc9a24a); sash(0xc9a24a); beard(0xf2f2f2);
        hold(p.armR, makeBox(0.07,1.55,0.07,0x5e3a20));
        const tab=makeBox(0.38,0.46,0.08,0xc2c2c8);
        const tab2=makeBox(0.30,0.10,0.09,0x9a9aa0); tab2.position.y=0.10; tab.add(tab2);
        hold(p.armL, tab); break;
      }
      case 'David':{                              // pastor joven: pelo + faja + corona + honda
        hair(0x7a4a28); sash(0x4a7fc0);
        add(0.48,0.12,0.48,0xffd23f,0,2.00,0);    // corona sobre el pelo
        const sling=makeBox(0.05,0.55,0.05,0x5a3a1c); sling.rotation.z=0.4; hold(p.armR, sling);
        const stone=makeBox(0.13,0.13,0.13,0x8a8a8e); stone.position.set(0.12,-0.78,0); p.armR.add(stone); break;
      }
      case 'Jonás':{                              // pelo y barba oscuros + faja + gran pez
        hair(0x241f1c); beard(0x241f1c); sash(0x1f5a4d);
        const fish=new THREE.Group();
        fish.add(makeBox(1.25,0.75,0.75,0x3a78b0));
        const tail=makeBox(0.45,0.62,0.12,0x2e6090); tail.position.x=-0.82; fish.add(tail);
        const eye=makeBox(0.10,0.10,0.06,0xffffff); eye.position.set(0.52,0.18,0.38); fish.add(eye);
        const fin=makeBox(0.30,0.20,0.50,0x2e6090); fin.position.set(0.05,0.45,0); fish.add(fin);
        fish.position.set(-1.6,1.05,0); g.add(fish);
        p.npc.companions.push({mesh:fish,base:1.05,amp:0.20,phase:1}); break;
      }
      case 'Daniel':{                             // gorro púrpura + faja + león manso
        hair(0x3a2a1c); cap(0x5e3a86); sash(0xc9a24a);
        const lion=new THREE.Group();
        lion.add(makeBox(1.05,0.6,0.55,0xd9a441));
        const mane=makeBox(0.55,0.72,0.62,0x9c6b1f); mane.position.x=0.5; lion.add(mane);
        const lh=makeBox(0.50,0.50,0.50,0xe3b860); lh.position.set(0.62,0.12,0); lion.add(lh);
        for(const sx of [0.35,-0.35]){ const leg=makeBox(0.18,0.4,0.18,0xc79235); leg.position.set(sx,-0.42,0.18); lion.add(leg); }
        lion.position.set(-1.5,0.45,0.2); g.add(lion);
        p.npc.companions.push({mesh:lion,base:0.45,amp:0.05,phase:0.5}); break;
      }
      case 'El Niño Jesús':{                      // niño: pelo + más pequeño + aureola + estrella
        hair(0x6b4628); g.scale.set(0.8,0.8,0.8);
        const halo=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.045,8,20), new THREE.MeshBasicMaterial({color:0xffe066}));
        halo.rotation.x=Math.PI/2; halo.position.set(0,2.10,0); g.add(halo); p.npc.halo=halo;
        hold(p.armR, makeBox(0.18,0.18,0.05,0xffe066)); break;
      }
    }
  }

  const NPC_SPEED=1.5, NPC_RADIUS=7;
  function npcWalkable(x,z){                       // tierra firme: nada de agua ni copas de árbol
    const gx=Math.floor(x),gz=Math.floor(z),gy=groundY(gx,gz),surf=getBlock(gx,gy-1,gz);
    return gy>SEA && surf!==B.WATER && surf!==B.LEAVES && surf!==B.LOG;
  }

  function buildNpc(def,wx,wz){
    const gy=groundY(wx,wz);
    // plataforma dorada = "casa" del personaje (su punto de partida)
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++) setBlock(Math.floor(wx)+dx,gy-1,Math.floor(wz)+dz,B.GOLD);

    const g=new THREE.Group();
    const robe=def.robe,skin=def.skin;
    const legL=makeLimb(0.22,0.7,0.22,robe,-0.14,0.70,0); g.add(legL);
    const legR=makeLimb(0.22,0.7,0.22,robe, 0.14,0.70,0); g.add(legR);
    const body=makeBox(0.5,0.7,0.3,robe); body.position.set(0,1.05,0); g.add(body);
    const armL=makeLimb(0.16,0.62,0.16,robe,-0.36,1.39,0); g.add(armL);
    const armR=makeLimb(0.16,0.62,0.16,robe, 0.36,1.39,0); g.add(armR);
    const head=makeBox(0.42,0.42,0.42,skin); head.position.set(0,1.62,0); g.add(head);
    // ojitos + sonrisa
    const dark=new THREE.MeshBasicMaterial({color:0x222222});
    for(const ex of [-0.1,0.1]){ const e=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.02),dark); e.position.set(ex,1.66,0.21); g.add(e); }
    const mouth=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.03,0.02),dark); mouth.position.set(0,1.55,0.21); g.add(mouth);
    const blush=new THREE.MeshBasicMaterial({color:0xe48a7a});  // mejillas
    for(const ex of [-0.16,0.16]){ const ch=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.02),blush); ch.position.set(ex,1.585,0.21); g.add(ch); }

    const npc={def,x:wx,z:wz,home:{x:wx,z:wz},baseY:gy,group:g,label:null,beacon:null,solved:false,
      legL,legR,armL,armR,head, heading:Math.random()*6.28, walkPhase:Math.random()*6.28,
      tx:wx,tz:wz, wait:Math.random()*2, moving:false, companions:[], halo:null};

    attachCharacter(def,g,{armR,armL,head,npc});
    g.position.set(wx,gy,wz); g.rotation.y=npc.heading; scene.add(g);

    const label=makeLabel(def.name,def.emoji); label.position.set(wx,gy+2.5,wz); scene.add(label);
    const beacon=new THREE.Mesh(new THREE.BoxGeometry(0.5,40,0.5),
      new THREE.MeshBasicMaterial({color:def.beacon,transparent:true,opacity:0.22,depthWrite:false}));
    beacon.position.set(wx,gy+20,wz); scene.add(beacon);
    npc.label=label; npc.beacon=beacon;
    npcs.push(npc);
  }
  function spawnNpcs(){
    const R=22;
    stories.forEach((def,i)=>{
      const a=(i/stories.length)*Math.PI*2;
      buildNpc(def, Math.round(Math.cos(a)*R)+0.5, Math.round(Math.sin(a)*R)+0.5);
    });
  }

  // =====================================================================
  //  SONIDO (sintetizado, sin archivos)
  // =====================================================================
  let audioCtx=null;
  function ensureAudio(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
  function beep(freq,dur,type='sine',vol=0.15){
    if(!audioCtx)return; const o=audioCtx.createOscillator(),gn=audioCtx.createGain();
    o.type=type; o.frequency.value=freq; gn.gain.value=vol; o.connect(gn); gn.connect(audioCtx.destination);
    const t=audioCtx.currentTime; gn.gain.setValueAtTime(vol,t); gn.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.start(t); o.stop(t+dur);
  }
  function playCorrect(){ beep(523,0.12,'triangle'); setTimeout(()=>beep(659,0.12,'triangle'),110); setTimeout(()=>beep(784,0.2,'triangle'),220); }
  function playWrong(){ beep(220,0.18,'sine',0.12); }

  // =====================================================================
  //  JUGADOR
  // =====================================================================
  const player={x:0.5,y:40,z:0.5,vx:0,vy:0,vz:0,onGround:false,inWater:false};
  const touch={ moveX:0, moveZ:0, mag:0, jump:false };   // estado del control táctil
  const HW=0.3,PH=1.8,EYE=1.62; let yaw=0,pitch=0;
  function isSolid(x,y,z){ return !nonSolid.has(getBlock(Math.floor(x),Math.floor(y),Math.floor(z))); }
  function collides(px,py,pz){
    const x0=Math.floor(px-HW),x1=Math.floor(px+HW),y0=Math.floor(py),y1=Math.floor(py+PH-0.001),z0=Math.floor(pz-HW),z1=Math.floor(pz+HW);
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(isSolid(x,y,z))return true; return false;
  }
  function feetInWater(){ return getBlock(Math.floor(player.x),Math.floor(player.y+0.2),Math.floor(player.z))===B.WATER; }

  const keys=new Set();
  on(window,'keydown',e=>{ keys.add(e.code); if(e.code==='Space')e.preventDefault();
    if(e.code==='KeyE'&&nearNpc&&!dialogOpen&&document.pointerLockElement)openDialog(nearNpc); });
  on(window,'keyup',e=>keys.delete(e.code));

  function updatePlayer(dt){
    if(dialogOpen){ camera.position.set(player.x,player.y+EYE,player.z); camera.rotation.set(pitch,yaw,0); return; }
    player.inWater=feetInWater();
    const fwd={x:-Math.sin(yaw),z:-Math.cos(yaw)},rgt={x:Math.cos(yaw),z:-Math.sin(yaw)};
    let ix=0,iz=0;
    if(keys.has('KeyW')){ix+=fwd.x;iz+=fwd.z;} if(keys.has('KeyS')){ix-=fwd.x;iz-=fwd.z;}
    if(keys.has('KeyD')){ix+=rgt.x;iz+=rgt.z;} if(keys.has('KeyA')){ix-=rgt.x;iz-=rgt.z;}
    if(touch.mag>0.05){ ix+=rgt.x*touch.moveX+fwd.x*touch.moveZ; iz+=rgt.z*touch.moveX+fwd.z*touch.moveZ; }   // palanca táctil
    const len=Math.hypot(ix,iz); if(len>0){ix/=len;iz/=len;}
    let speed=((keys.has('ShiftLeft')||keys.has('ShiftRight'))||touch.mag>0.9)?SPRINT:WALK; if(player.inWater)speed*=0.6;
    player.vx=ix*speed; player.vz=iz*speed;
    const wantJump=keys.has('Space')||touch.jump;
    if(player.inWater){ player.vy-=GRAVITY*0.25*dt; player.vy=Math.max(player.vy,-2.5); if(wantJump)player.vy=3.2; }
    else { player.vy-=GRAVITY*dt; if(wantJump&&player.onGround){ player.vy=JUMP_V; player.onGround=false; } }
    touch.jump=false;   // el salto táctil es un impulso de un toque
    player.onGround=false;
    let nx=player.x+player.vx*dt; if(!collides(nx,player.y,player.z))player.x=nx; else player.vx=0;
    let nz=player.z+player.vz*dt; if(!collides(player.x,player.y,nz))player.z=nz; else player.vz=0;
    let ny=player.y+player.vy*dt; if(!collides(player.x,ny,player.z))player.y=ny; else { if(player.vy<0)player.onGround=true; player.vy=0; }
    if(player.y<-20){ player.y=46; player.vy=0; }
    camera.position.set(player.x,player.y+EYE,player.z); camera.rotation.set(pitch,yaw,0);
  }

  function raycastVoxel(){
    const o=camera.position,dir=new THREE.Vector3(); camera.getWorldDirection(dir);
    let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);
    const sX=Math.sign(dir.x),sY=Math.sign(dir.y),sZ=Math.sign(dir.z);
    const dX=sX!==0?Math.abs(1/dir.x):Infinity,dY=sY!==0?Math.abs(1/dir.y):Infinity,dZ=sZ!==0?Math.abs(1/dir.z):Infinity;
    const fr=v=>v-Math.floor(v);
    let mX=sX>0?(1-fr(o.x))*dX:fr(o.x)*dX; if(sX===0)mX=Infinity;
    let mY=sY>0?(1-fr(o.y))*dY:fr(o.y)*dY; if(sY===0)mY=Infinity;
    let mZ=sZ>0?(1-fr(o.z))*dZ:fr(o.z)*dZ; if(sZ===0)mZ=Infinity;
    let face=[0,0,0],t=0;
    while(t<=REACH){ const b=getBlock(x,y,z); if(b!==B.AIR&&b!==B.WATER)return{x,y,z,nx:face[0],ny:face[1],nz:face[2]};
      if(mX<mY&&mX<mZ){x+=sX;t=mX;mX+=dX;face=[-sX,0,0];} else if(mY<mZ){y+=sY;t=mY;mY+=dY;face=[0,-sY,0];} else {z+=sZ;t=mZ;mZ+=dZ;face=[0,0,-sZ];} }
    return null;
  }

  // =====================================================================
  //  HOTBAR
  // =====================================================================
  const hotbarBlocks=[B.GRASS,B.DIRT,B.STONE,B.LOG,B.PLANKS,B.LEAVES,B.SAND,B.SNOW,B.GLASS];
  let selected=0; const hotbarEl=document.getElementById('hotbar');
  function blockPreview(block){ const cv=document.createElement('canvas'); cv.width=cv.height=16; const c=cv.getContext('2d'); c.imageSmoothingEnabled=false;
    const ti=tileIndex[blockTiles[block].side]; c.drawImage(atlasCanvas,ti*TILE,0,TILE,TILE,0,0,16,16); return cv; }
  function buildHotbar(){ hotbarEl.innerHTML=''; hotbarBlocks.forEach((b,i)=>{ const s=document.createElement('div'); s.className='slot'+(i===selected?' active':'');
    const n=document.createElement('span'); n.className='num'; n.textContent=i+1; s.appendChild(n); s.appendChild(blockPreview(b));
    s.addEventListener('pointerdown',()=>selectSlot(i)); hotbarEl.appendChild(s); }); }
  function selectSlot(i){ selected=(i+hotbarBlocks.length)%hotbarBlocks.length; buildHotbar(); }
  on(window,'keydown',e=>{ if(e.code.startsWith('Digit')){ const n=+e.code.slice(5); if(n>=1&&n<=hotbarBlocks.length)selectSlot(n-1); } });
  on(window,'wheel',e=>{ if(document.pointerLockElement)selectSlot(selected+(e.deltaY>0?1:-1)); },{passive:true});

  // =====================================================================
  //  DIÁLOGO / APRENDIZAJE
  // =====================================================================
  const overlay=document.getElementById('overlay'), playBtn=document.getElementById('playBtn');
  const dialog=document.getElementById('dialog'), winScreen=document.getElementById('win');
  const canvasEl=renderer.domElement;
  let dialogOpen=false, nearNpc=null, currentNpc=null, stars=0, talkBtnEl=null;
  const starsEl=document.getElementById('stars'), promptEl=document.getElementById('prompt');

  function updateStars(){ starsEl.textContent='⭐ '+stars+' / '+stories.length; }

  playBtn.addEventListener('click',()=>{ ensureAudio(); if(IS_TOUCH)overlay.style.display='none'; else canvasEl.requestPointerLock(); });
  canvasEl.addEventListener('click',()=>{ if(IS_TOUCH)return; if(!document.pointerLockElement&&!dialogOpen)canvasEl.requestPointerLock(); });
  on(document,'pointerlockchange',()=>{
    if(document.pointerLockElement){ overlay.style.display='none'; }
    else if(!dialogOpen && winScreen.style.display!=='flex'){ overlay.style.display='flex'; }
  });
  on(document,'mousemove',e=>{ if(document.pointerLockElement!==canvasEl)return;
    yaw-=e.movementX*0.0024; pitch-=e.movementY*0.0024; const l=Math.PI/2-0.01; pitch=Math.max(-l,Math.min(l,pitch)); });
  canvasEl.addEventListener('contextmenu',e=>e.preventDefault());
  function doBreak(){ if(dialogOpen)return; const hit=raycastVoxel(); if(hit)setBlock(hit.x,hit.y,hit.z,B.AIR); }
  function doPlace(){ if(dialogOpen)return; const hit=raycastVoxel(); if(!hit)return;
    const px=hit.x+hit.nx,py=hit.y+hit.ny,pz=hit.z+hit.nz;
    const iX=px+0.999>player.x-HW&&px<player.x+HW, iZ=pz+0.999>player.z-HW&&pz<player.z+HW, iY=py+0.999>player.y&&py<player.y+PH;
    if(iX&&iY&&iZ)return; const cur=getBlock(px,py,pz); if(cur===B.AIR||cur===B.WATER)setBlock(px,py,pz,hotbarBlocks[selected]); }
  canvasEl.addEventListener('mousedown',e=>{
    if(document.pointerLockElement!==canvasEl||dialogOpen)return;
    if(e.button===0)doBreak(); else if(e.button===2)doPlace();
  });

  const demoji=document.getElementById('demoji'),dname=document.getElementById('dname'),dstory=document.getElementById('dstory'),
        dq=document.getElementById('dq'),dopts=document.getElementById('dopts'),dfeedback=document.getElementById('dfeedback'),
        dcontinue=document.getElementById('dcontinue');

  function openDialog(npc){
    currentNpc=npc; dialogOpen=true; document.exitPointerLock(); dialog.style.display='flex'; promptEl.style.display='none';
    const d=npc.def; demoji.textContent=d.emoji; dname.textContent=d.name; dstory.textContent=d.story;
    dfeedback.textContent=''; dcontinue.classList.add('hidden'); dopts.innerHTML='';
    if(npc.solved){
      dq.textContent='¡Ya ganaste esta estrella! ⭐ ¿Recuerdas? '+d.q;
      dq.style.color='#2e8b1e'; dcontinue.classList.remove('hidden'); return;
    }
    dq.style.color='#1c3a6e'; dq.textContent=d.q;
    d.opts.forEach((opt,i)=>{ const b=document.createElement('button'); b.className='opt'; b.textContent=opt;
      b.onclick=()=>answer(npc,i,b); dopts.appendChild(b); });
  }
  function answer(npc,i,btn){
    const d=npc.def, buttons=[...dopts.querySelectorAll('.opt')];
    if(i===d.answer){
      btn.classList.add('correct'); buttons.forEach(b=>b.disabled=true);
      if(!npc.solved){ npc.solved=true; stars++; updateStars();
        // notifica al wrapper React qué historia se respondió correctamente
        onStar(npc.def.id);
        // marca la luz como dorada al completar
        npc.beacon.material.color.set(0xffd23f); }
      dfeedback.textContent='✅ ¡Correcto! Ganaste una estrella ⭐'; dfeedback.style.color='#2e8b1e';
      playCorrect(); dcontinue.classList.remove('hidden');
    } else {
      btn.classList.add('wrong'); btn.disabled=true;
      dfeedback.textContent='🤔 ¡Casi! Inténtalo otra vez.'; dfeedback.style.color='#c0392b'; playWrong();
    }
  }
  function closeDialog(){
    dialog.style.display='none'; dialogOpen=false; currentNpc=null;
    if(stars>=stories.length){ winScreen.style.display='flex'; onWin(); }
    else if(!IS_TOUCH) canvasEl.requestPointerLock();
  }
  dcontinue.addEventListener('click',closeDialog);
  document.getElementById('winBtn').addEventListener('click',()=>{ winScreen.style.display='none'; if(!IS_TOUCH)canvasEl.requestPointerLock(); });

  // =====================================================================
  //  BUCLE
  // =====================================================================
  const infoEl=document.getElementById('info');
  let last=performance.now(),fpsT=0,frames=0,fps=0,started=false,clock=0;

  function updateNpcs(dt){
    clock+=dt;
    let best=null,bd=3.4*3.4;
    for(const npc of npcs){
      const talking = dialogOpen && currentNpc===npc;
      let moving=false, desired=npc.heading;

      if(talking){
        desired=Math.atan2(player.x-npc.x, player.z-npc.z);          // se gira hacia el jugador
      } else {
        npc.wait-=dt;
        let dx=npc.tx-npc.x, dz=npc.tz-npc.z, dist=Math.hypot(dx,dz);
        if(npc.wait<=0 && dist<0.5){                                 // elige un nuevo destino cerca de casa
          for(let t=0;t<10;t++){
            const ang=Math.random()*6.28, r=2+Math.random()*NPC_RADIUS;
            const nx=npc.home.x+Math.cos(ang)*r, nz=npc.home.z+Math.sin(ang)*r;
            if(npcWalkable(nx,nz)){ npc.tx=nx; npc.tz=nz; break; }
          }
          npc.wait=1.2+Math.random()*3.5;                           // descansa antes de volver a caminar
          dx=npc.tx-npc.x; dz=npc.tz-npc.z; dist=Math.hypot(dx,dz);
        }
        if(dist>0.5){
          const step=Math.min(dist, NPC_SPEED*dt);
          npc.x+=dx/dist*step; npc.z+=dz/dist*step;
          desired=Math.atan2(dx,dz); moving=true;
        }
      }

      // giro suave hacia la dirección deseada
      let dh=desired-npc.heading; while(dh>Math.PI)dh-=6.283; while(dh<-Math.PI)dh+=6.283;
      npc.heading+=dh*Math.min(1,dt*6); npc.group.rotation.y=npc.heading;

      // pegado al suelo + leve balanceo
      const gy=groundY(npc.x,npc.z);
      const bob=Math.sin(clock*(moving?9:2.2)+npc.walkPhase)*(moving?0.05:0.025);
      npc.group.position.set(npc.x, gy+bob, npc.z);

      // ciclo de pasos: piernas y brazos opuestos
      npc.walkPhase+=dt*(moving?9:1.6);
      const amp=moving?0.6:0.07, s=Math.sin(npc.walkPhase);
      npc.legL.rotation.x= s*amp; npc.legR.rotation.x=-s*amp;
      npc.armL.rotation.x=-s*amp*0.8; npc.armR.rotation.x= s*amp*0.8; npc.armR.rotation.z=0;
      if(talking){ npc.armR.rotation.x=-1.3+Math.sin(clock*6)*0.35; npc.armR.rotation.z=0.25; }  // saluda

      // compañeros (arca/pez/león/estrella) flotan; aureola gira
      for(const c of npc.companions){ c.phase+=dt*2; c.mesh.position.y=c.base+Math.sin(c.phase)*c.amp; }
      if(npc.halo) npc.halo.rotation.z+=dt;

      // la etiqueta y el faro de luz siguen al personaje
      npc.label.position.set(npc.x, gy+2.5, npc.z);
      npc.beacon.position.set(npc.x, gy+20, npc.z);

      const ddx=npc.x-player.x, ddz=npc.z-player.z, d2=ddx*ddx+ddz*ddz;
      if(d2<bd){ bd=d2; best=npc; }
    }
    nearNpc=best;
    const canTalk=best&&!dialogOpen;
    if(canTalk){ promptEl.style.display='block'; promptEl.innerHTML=(IS_TOUCH?'Toca 💬':'Pulsa <b>E</b>')+' para hablar con '+best.def.name+(best.solved?' ⭐':''); }
    else promptEl.style.display='none';
    if(talkBtnEl) talkBtnEl.classList.toggle('hidden', !(canTalk&&IS_TOUCH));
  }

  function loop(now){
    rafId=requestAnimationFrame(loop);
    let dt=(now-last)/1000; last=now; if(dt>0.05)dt=0.05;
    processQueue(2);
    if(started){
      updatePlayer(dt); updateChunks(); updateNpcs(dt);
      if(!dialogOpen){ const hit=raycastVoxel(); if(hit){ highlight.visible=true; highlight.position.set(hit.x+0.5,hit.y+0.5,hit.z+0.5); } else highlight.visible=false; }
      else highlight.visible=false;
    }
    renderer.render(scene,camera);
    frames++; fpsT+=dt; if(fpsT>=0.5){ fps=Math.round(frames/fpsT); frames=0; fpsT=0; }
    infoEl.textContent=`Aventura Bíblica\nFPS: ${fps}\nXYZ: ${player.x.toFixed(0)} ${player.y.toFixed(0)} ${player.z.toFixed(0)}`;
  }

  // ---------- arranque ----------
  buildHotbar(); updateStars();
  // saludo según el personaje elegido en el login (pasado como argumento `character`)
  (()=>{ const c=character;
    const names={sheep:'Ovejita',disciple:'Discípulo',child:'Niño Cristiano'};
    if(c&&names[c]){ const sub=document.querySelector('#overlay .sub');
      if(sub) sub.textContent='¡Hola, '+names[c]+'! Explora el mundo abierto y aprende historias de la Biblia.'; }
  })();
  // =====================================================================
  //  CONTROLES TÁCTILES (móvil)
  // =====================================================================
  (function setupTouch(){
    const touchUI=document.getElementById('touch');
    // mirar arrastrando un dedo sobre el lienzo (no necesita pointer lock)
    let lookId=null,lastX=0,lastY=0;
    canvasEl.addEventListener('touchstart',e=>{
      if(dialogOpen)return;
      for(const t of e.changedTouches){ if(lookId===null){ lookId=t.identifier; lastX=t.clientX; lastY=t.clientY; } }
    },{passive:true});
    canvasEl.addEventListener('touchmove',e=>{
      if(lookId===null)return;
      for(const t of e.changedTouches){ if(t.identifier===lookId){
        yaw-=(t.clientX-lastX)*0.005; pitch-=(t.clientY-lastY)*0.005;
        const l=Math.PI/2-0.01; pitch=Math.max(-l,Math.min(l,pitch));
        lastX=t.clientX; lastY=t.clientY;
      } }
    },{passive:true});
    const endLook=e=>{ for(const t of e.changedTouches) if(t.identifier===lookId) lookId=null; };
    canvasEl.addEventListener('touchend',endLook); canvasEl.addEventListener('touchcancel',endLook);

    // palanca virtual (joystick)
    const joy=document.getElementById('joy'), knob=document.getElementById('knob');
    let joyId=null, cx=0, cy=0, R=54;
    const setJoy=(x,y)=>{ let dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy); if(d>R){ dx=dx/d*R; dy=dy/d*R; d=R; }
      knob.style.transform=`translate(${dx}px,${dy}px)`; touch.moveX=dx/R; touch.moveZ=-dy/R; touch.mag=d/R; };
    const resetJoy=()=>{ knob.style.transform='translate(0,0)'; touch.moveX=touch.moveZ=touch.mag=0; };
    joy.addEventListener('touchstart',e=>{ e.preventDefault(); ensureAudio(); const t=e.changedTouches[0]; joyId=t.identifier;
      const r=joy.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; R=r.width/2; setJoy(t.clientX,t.clientY); },{passive:false});
    joy.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches) if(t.identifier===joyId) setJoy(t.clientX,t.clientY); },{passive:false});
    const endJoy=e=>{ for(const t of e.changedTouches) if(t.identifier===joyId){ joyId=null; resetJoy(); } };
    joy.addEventListener('touchend',endJoy); joy.addEventListener('touchcancel',endJoy);

    // botones de acción (toque y también clic para depurar en escritorio)
    const bind=(id,fn)=>{ const el=document.getElementById(id); if(!el)return null;
      el.addEventListener('touchstart',e=>{ e.preventDefault(); ensureAudio(); fn(); },{passive:false});
      el.addEventListener('click',e=>{ if(IS_TOUCH)return; e.preventDefault(); fn(); }); return el; };
    bind('btnBreak',doBreak); bind('btnPlace',doPlace); bind('btnJump',()=>{ touch.jump=true; });
    talkBtnEl=bind('btnTalk',()=>{ if(nearNpc&&!dialogOpen)openDialog(nearNpc); });

    if(IS_TOUCH){
      document.body.classList.add('touch');
      if(touchUI)touchUI.classList.remove('hidden');
      document.querySelector('.ctlDesktop')?.classList.add('hidden');
      document.querySelector('.ctlTouch')?.classList.remove('hidden');
    }
  })();

  player.y=heightAt(0,0)+3;
  updateChunks(); processQueue(90);   // precarga el área de aparición
  spawnNpcs();
  started=true;
  rafId=requestAnimationFrame(loop);

  on(window,'resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

  // =====================================================================
  //  TEARDOWN
  // =====================================================================
  return {
    dispose() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      for (const { target, type, fn, opts } of tracked) target.removeEventListener(type, fn, opts);
      tracked.length = 0;
      renderer.dispose();
    },
  };
}
