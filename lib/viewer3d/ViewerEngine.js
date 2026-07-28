import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Motor del visor 3D de CYMARQ.
 *
 * Independiente de React: la capa de interfaz sólo llama a métodos públicos.
 * Todo el encuadre (cámara, vistas, grilla, límites de zoom) se deduce del
 * bounding box del GLB, por lo que funciona con cualquier modelo sin
 * configuración manual.
 */

const VIEW_DIRECTIONS = {
  FR: [0, 0, 1],
  BK: [0, 0, -1],
  RT: [1, 0, 0],
  LT: [-1, 0, 0],
  TP: [0, 1, 0.0001],
  BT: [0, -1, 0.0001],
  ISO: [1, 0.72, 1],
};

const GRID_STEPS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100];

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default class ViewerEngine {
  constructor(container) {
    this.container = container;
    this.disposed = false;
    this.dirty = true;
    this.anim = null;
    this.mode = 'textured';
    this.axesVisible = true;
    this.gridVisible = true;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.autoClear = false;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.outline = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.camera.position.set(6, 5, 8);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.screenSpacePanning = true;
    this.controls.rotateSpeed = 0.75;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.8;
    this.controls.autoRotateSpeed = 0.9;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    // Cualquier interacción del usuario cancela una transición de cámara
    this.onControlsStart = () => {
      this.anim = null;
    };
    this.controls.addEventListener('start', this.onControlsStart);

    // Iluminación neutra de estudio (sin archivos externos)
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envMap = this.pmrem.fromScene(room, 0.04).texture;
    this.scene.environment = this.envMap;
    room.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.keyLight.position.set(4, 8, 6);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.HemisphereLight(0xffffff, 0x35383d, 1.1);
    this.scene.add(this.fillLight);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);

    this.wireOverlay = null;

    this._buildAxesGizmo();

    this.bounds = {
      center: new THREE.Vector3(),
      size: new THREE.Vector3(1, 1, 1),
      radius: 1,
    };

    this.clock = new THREE.Clock();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.onContextLost = (e) => {
      e.preventDefault();
      this.contextLost = true;
    };
    this.onContextRestored = () => {
      this.contextLost = false;
      this.requestRender();
    };
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);

    this._tick = this._tick.bind(this);
    this.raf = requestAnimationFrame(this._tick);

    if (process.env.NODE_ENV !== 'production') window.__cymarq3d = this;
  }

  /* ------------------------------------------------------------------ */
  /* Carga                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Carga un GLB ya descargado en memoria.
   * @param {ArrayBuffer} buffer
   * @returns {Promise<object>} estadísticas del modelo
   */
  async load(buffer) {
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(buffer, '');
    if (this.disposed) return null;

    this.model = gltf.scene;
    this.root.add(this.model);

    const stats = { meshes: 0, triangles: 0, vertices: 0 };
    const materials = new Set();

    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.userData.cymarqOriginalMaterial = obj.material;

      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach((m) => m && materials.add(m));

      const geom = obj.geometry;
      if (geom) {
        const pos = geom.getAttribute('position');
        if (pos) stats.vertices += pos.count;
        stats.triangles += geom.index ? geom.index.count / 3 : (pos ? pos.count / 3 : 0);
      }
      stats.meshes += 1;
    });

    // El exportador escribe metalness 0.5 en todos los materiales (artefacto de
    // KHR_materials_pbrSpecularGlossiness). Se corrige para que los acabados
    // arquitectónicos no se vean metálicos, conservando texturas y colores.
    materials.forEach((m) => {
      if (m.isMeshStandardMaterial) {
        if (!m.metalnessMap) m.metalness = 0;
        if (!m.roughnessMap) m.roughness = Math.min(1, Math.max(m.roughness, 0.65));
        m.envMapIntensity = 0.85;
      }
    });
    stats.materials = materials.size;
    this._materials = materials;

    this._recenterAndMeasure();
    stats.size = {
      x: this.bounds.size.x,
      y: this.bounds.size.y,
      z: this.bounds.size.z,
    };
    stats.triangles = Math.round(stats.triangles);

    this._buildGrid();
    this._placeLights();
    this.setView('ISO', false);
    this.requestRender();

    this.stats = stats;
    return stats;
  }

  _recenterAndMeasure() {
    this.root.position.set(0, 0, 0);
    this.root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Se recoloca el modelo: centrado en X/Z y apoyado en y = 0.
    // Así la grilla, el orbit y las vistas son genéricas para cualquier GLB.
    this.root.position.set(-center.x, -box.min.y, -center.z);
    this.root.updateMatrixWorld(true);

    this.bounds.size.copy(size);
    this.bounds.center.set(0, size.y / 2, 0);
    this.bounds.radius = Math.max(size.length() / 2, 0.001);

    const r = this.bounds.radius;
    this.camera.near = Math.max(r / 500, 0.001);
    this.camera.far = r * 200;
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(this.bounds.center);
    this.controls.minDistance = r * 0.05;
    this.controls.maxDistance = r * 15;
  }

  _placeLights() {
    const r = this.bounds.radius;
    this.keyLight.position
      .set(0.55, 1, 0.4)
      .normalize()
      .multiplyScalar(r * 3)
      .add(this.bounds.center);
  }

  /* ------------------------------------------------------------------ */
  /* Grilla                                                              */
  /* ------------------------------------------------------------------ */

  _buildGrid() {
    this._clearGroup(this.gridGroup);

    const footprint = Math.max(this.bounds.size.x, this.bounds.size.z, 0.001);
    const size = footprint * 3;
    const step =
      GRID_STEPS.find((s) => s >= footprint / 16) || GRID_STEPS[GRID_STEPS.length - 1];

    const divisions = Math.max(2, Math.round(size / step));
    // Malla fina (paso base) y malla gruesa cada 5 celdas; ejes centrales en dorado.
    const fine = new THREE.GridHelper(size, divisions, 0x9aa0a8, 0x9aa0a8);
    const coarse = new THREE.GridHelper(
      size,
      Math.max(2, Math.round(size / (step * 5))),
      0xd6a300,
      0xd3d7dd
    );

    [fine, coarse].forEach((grid, i) => {
      const mat = grid.material;
      mat.transparent = true;
      mat.opacity = i === 0 ? 0.22 : 0.42;
      mat.depthWrite = false;
      mat.toneMapped = false;
      this._applyGridFade(mat, size);
      grid.renderOrder = -1;
      this.gridGroup.add(grid);
    });

    // Justo por debajo del punto más bajo del modelo: no lo atraviesa.
    this.gridGroup.position.y = -this.bounds.radius * 0.0025;
    this.gridGroup.visible = this.gridVisible;
  }

  /**
   * Desvanecido radial de la grilla hacia los bordes (sensación de espacio CAD).
   *
   * La distancia se calcula por fragmento a partir de la posición interpolada:
   * hacerlo por vértice daría un valor erróneo, porque cada línea de la grilla
   * cruza la malla entera y sus dos extremos están lejos del centro.
   */
  _applyGridFade(material, size) {
    const start = (size * 0.16).toFixed(4);
    const end = (size * 0.48).toFixed(4);
    material.onBeforeCompile = (shader) => {
      shader.vertexShader =
        'varying vec3 vGridPos;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n\tvGridPos = position;'
        );
      shader.fragmentShader =
        'varying vec3 vGridPos;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>\n\tdiffuseColor.a *= 1.0 - smoothstep( ${start}, ${end}, length( vGridPos.xz ) );`
        );
    };
    material.customProgramCacheKey = () => `cymarq-grid-fade-${start}-${end}`;
    material.needsUpdate = true;
  }

  setGridVisible(visible) {
    this.gridVisible = visible;
    this.gridGroup.visible = visible;
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Gizmo de ejes                                                       */
  /* ------------------------------------------------------------------ */

  _buildAxesGizmo() {
    this.gizmoScene = new THREE.Scene();
    this.gizmoCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);

    const axes = [
      { dir: new THREE.Vector3(1, 0, 0), color: 0xe0574f, label: 'X' },
      { dir: new THREE.Vector3(0, 1, 0), color: 0x7fb84f, label: 'Y' },
      { dir: new THREE.Vector3(0, 0, 1), color: 0x5b8fd6, label: 'Z' },
    ];

    this.gizmoDisposables = [];

    axes.forEach(({ dir, color, label }) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(0.78),
      ]);
      const mat = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 10;
      this.gizmoScene.add(line);
      this.gizmoDisposables.push(geom, mat);

      const coneGeom = new THREE.ConeGeometry(0.075, 0.2, 12);
      const coneMat = new THREE.MeshBasicMaterial({ color, depthTest: false });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.copy(dir.clone().multiplyScalar(0.88));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      cone.renderOrder = 10;
      this.gizmoScene.add(cone);
      this.gizmoDisposables.push(coneGeom, coneMat);

      const sprite = this._makeLabelSprite(label, color);
      sprite.position.copy(dir.clone().multiplyScalar(1.18));
      this.gizmoScene.add(sprite);
      this.gizmoDisposables.push(sprite.material.map, sprite.material);
    });
  }

  _makeLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
    ctx.font = 'bold 44px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 34);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(0.42);
    sprite.renderOrder = 11;
    return sprite;
  }

  setAxesVisible(visible) {
    this.axesVisible = visible;
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Cámara y vistas                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Distancia mínima para que el modelo entre completo desde una dirección dada.
   * Se proyecta la caja envolvente sobre los ejes reales de la cámara (no sobre
   * la esfera envolvente), de modo que cada vista aprovecha todo el encuadre.
   */
  getFitDistance(direction, margin = 1.14) {
    const forward = direction.clone().normalize();
    const basis = new THREE.Matrix4().lookAt(
      forward,
      new THREE.Vector3(0, 0, 0),
      this.camera.up
    );
    const right = new THREE.Vector3().setFromMatrixColumn(basis, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(basis, 1);

    const s = this.bounds.size;
    const corner = new THREE.Vector3();
    let halfW = 0;
    let halfH = 0;
    let halfD = 0;
    [-0.5, 0.5].forEach((fx) => {
      [-0.5, 0.5].forEach((fy) => {
        [-0.5, 0.5].forEach((fz) => {
          corner.set(s.x * fx, s.y * fy, s.z * fz);
          halfW = Math.max(halfW, Math.abs(corner.dot(right)));
          halfH = Math.max(halfH, Math.abs(corner.dot(up)));
          halfD = Math.max(halfD, Math.abs(corner.dot(forward)));
        });
      });
    });

    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (this.camera.aspect || 1));
    const distance =
      margin * Math.max(halfH / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2));
    return halfD + distance;
  }

  /** Sitúa la cámara en una de las vistas automáticas (FR, BK, LT, RT, TP, BT, ISO). */
  setView(key, animate = true) {
    const raw = VIEW_DIRECTIONS[key] || VIEW_DIRECTIONS.ISO;
    const dir = new THREE.Vector3(raw[0], raw[1], raw[2]).normalize();
    this._frameFrom(dir, animate);
  }

  /** Reencuadra el modelo conservando el ángulo actual de la cámara. */
  fit(animate = true) {
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this._frameFrom(dir, animate);
  }

  _frameFrom(dir, animate) {
    const target = this.bounds.center.clone();
    const position = target.clone().addScaledVector(dir, this.getFitDistance(dir));
    this._moveCamera(position, target, animate);
  }

  reset() {
    this.setView('ISO', true);
  }

  _moveCamera(position, target, animate) {
    if (!animate) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      this.requestRender();
      return;
    }
    this.anim = {
      fromPos: this.camera.position.clone(),
      toPos: position,
      fromTarget: this.controls.target.clone(),
      toTarget: target,
      t: 0,
      duration: 0.85,
    };
    this.requestRender();
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Modos de visualización                                              */
  /* ------------------------------------------------------------------ */

  _whiteMaterial(side) {
    this._whiteCache = this._whiteCache || {};
    if (!this._whiteCache[side]) {
      this._whiteCache[side] = new THREE.MeshStandardMaterial({
        color: 0xeceae5,
        roughness: 0.92,
        metalness: 0,
        envMapIntensity: 0.7,
        side,
      });
    }
    return this._whiteCache[side];
  }

  _wireMaterial() {
    if (!this._wireCache) {
      this._wireCache = new THREE.MeshBasicMaterial({
        color: 0xd8dadd,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
    }
    return this._wireCache;
  }

  _xrayMaterial() {
    if (!this._xrayCache) {
      this._xrayCache = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0x9fc6e8) },
          uOpacity: { value: 0.5 },
        },
        vertexShader: `
          varying vec3 vNormalView;
          varying vec3 vViewDir;
          void main() {
            vec4 mv = modelViewMatrix * vec4( position, 1.0 );
            vNormalView = normalize( normalMatrix * normal );
            vViewDir = normalize( -mv.xyz );
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec3 vNormalView;
          varying vec3 vViewDir;
          void main() {
            float fresnel = 1.0 - abs( dot( normalize( vNormalView ), normalize( vViewDir ) ) );
            gl_FragColor = vec4( uColor, pow( fresnel, 1.7 ) * uOpacity );
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
    }
    return this._xrayCache;
  }

  /**
   * Crea (una sola vez) la malla de aristas para el modo "Sólido + malla".
   * Se construye repartida entre varios fotogramas: en modelos grandes hacerlo
   * de golpe congelaría la interfaz durante segundos.
   */
  _ensureWireOverlay() {
    if (this.wireOverlay || !this.model) return;
    if (this.stats && this.stats.triangles > 700000) return;

    const material = new THREE.LineBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.28,
    });
    this._wireOverlayMaterial = material;

    const group = new THREE.Group();
    group.visible = this.mode === 'solidwire';
    this.wireOverlay = group;
    this.scene.add(group);

    this.model.updateMatrixWorld(true);
    const meshes = [];
    this.model.traverse((obj) => {
      if (obj.isMesh && obj.geometry) meshes.push(obj);
    });

    let i = 0;
    const step = () => {
      if (this.disposed) return;
      const end = Math.min(meshes.length, i + 60);
      for (; i < end; i += 1) {
        const line = new THREE.LineSegments(
          new THREE.WireframeGeometry(meshes[i].geometry),
          material
        );
        line.applyMatrix4(meshes[i].matrixWorld);
        group.add(line);
      }
      this.requestRender();
      if (i < meshes.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /**
   * @param {'textured'|'white'|'wireframe'|'solidwire'|'xray'} mode
   */
  setMode(mode) {
    if (!this.model) return;
    this.mode = mode;

    if (mode === 'solidwire') this._ensureWireOverlay();
    if (this.wireOverlay) this.wireOverlay.visible = mode === 'solidwire';

    this.model.traverse((obj) => {
      if (!obj.isMesh) return;
      const original = obj.userData.cymarqOriginalMaterial;
      const first = Array.isArray(original) ? original[0] : original;
      const side = first ? first.side : THREE.FrontSide;

      switch (mode) {
        case 'white':
        case 'solidwire':
          obj.material = this._whiteMaterial(side);
          break;
        case 'wireframe':
          obj.material = this._wireMaterial();
          break;
        case 'xray':
          obj.material = this._xrayMaterial();
          break;
        default:
          // Los materiales originales nunca se destruyen: sólo se reasignan.
          obj.material = original;
      }
    });

    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Bucle de render                                                     */
  /* ------------------------------------------------------------------ */

  requestRender() {
    this.dirty = true;
  }

  resize() {
    if (this.disposed) return;
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  setPaused(paused) {
    this.paused = paused;
  }

  _tick() {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this._tick);
    if (this.paused || this.contextLost) return;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    let dirty = this.dirty;

    if (this.anim) {
      this.anim.t = Math.min(1, this.anim.t + delta / this.anim.duration);
      const k = easeInOutCubic(this.anim.t);
      this.camera.position.lerpVectors(this.anim.fromPos, this.anim.toPos, k);
      this.controls.target.lerpVectors(this.anim.fromTarget, this.anim.toTarget, k);
      if (this.anim.t >= 1) this.anim = null;
      dirty = true;
    }

    if (this.controls.update(delta)) dirty = true;

    if (dirty) {
      this._render();
      this.dirty = false;
    }
  }

  _render() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;

    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, w, h);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    if (!this.axesVisible) return;

    const s = Math.round(Math.max(64, Math.min(104, Math.min(w, h) * 0.16)));
    const pad = 16;
    this.renderer.setViewport(pad, pad, s, s);
    this.renderer.setScissor(pad, pad, s, s);
    this.renderer.setScissorTest(true);
    this.renderer.clearDepth();

    this.gizmoCamera.position
      .copy(this.camera.position)
      .sub(this.controls.target)
      .normalize()
      .multiplyScalar(3.4);
    this.gizmoCamera.up.copy(this.camera.up);
    this.gizmoCamera.lookAt(0, 0, 0);
    this.renderer.render(this.gizmoScene, this.gizmoCamera);
    this.renderer.setScissorTest(false);
  }

  /* ------------------------------------------------------------------ */
  /* Limpieza                                                            */
  /* ------------------------------------------------------------------ */

  _clearGroup(group) {
    for (let i = group.children.length - 1; i >= 0; i -= 1) {
      const child = group.children[i];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => m.dispose());
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.controls.removeEventListener('start', this.onControlsStart);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.onContextRestored
    );
    this.controls.dispose();

    if (this.model) {
      this.model.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
    }
    if (this._materials) {
      this._materials.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v && v.isTexture) v.dispose();
        });
        m.dispose();
      });
    }
    if (this.wireOverlay) this._clearGroup(this.wireOverlay);
    if (this._wireOverlayMaterial) this._wireOverlayMaterial.dispose();
    this._clearGroup(this.gridGroup);
    if (this._whiteCache) Object.values(this._whiteCache).forEach((m) => m.dispose());
    if (this._wireCache) this._wireCache.dispose();
    if (this._xrayCache) this._xrayCache.dispose();
    if (this.gizmoDisposables) this.gizmoDisposables.forEach((d) => d && d.dispose());
    if (this.envMap) this.envMap.dispose();
    if (this.pmrem) this.pmrem.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export { VIEW_DIRECTIONS };
