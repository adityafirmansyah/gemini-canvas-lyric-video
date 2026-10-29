/**
 * three-background.js
 * Modular Three.js WebGL engine for procedural 3D audio-reactive backgrounds
 * (Particle Waves, Ethereal Silk, Cyber Grid, Celestial Starfield).
 */

export class ThreeBackground {
  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Settings
    this.style = 'particle-waves'; // 'particle-waves', 'ethereal-silk', 'cyber-grid', 'starfield'
    this.speed = 1.0;
    this.waveHeight = 45;
    this.density = 1.0;
    this.color = '#64ffda';
    this.bgColor = '#080b14';
    this.audioReactive = true;

    this.time = 0;

    this.initThree();
  }

  initThree() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet');
      return;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 1, 3000);
    this.camera.position.set(0, 320, 620);
    this.camera.lookAt(0, 0, -100);

    this.buildMesh();
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.buildMesh();
  }

  hexToNumber(hexStr) {
    if (!hexStr) return 0x64ffda;
    const clean = hexStr.replace('#', '');
    return parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16) || 0x64ffda;
  }

  buildMesh() {
    if (!this.scene) return;

    // Clear previous objects
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      this.scene.remove(obj);
    }

    const primaryColor = this.hexToNumber(this.color);

    if (this.style === 'particle-waves' || this.style === 'ethereal-silk') {
      const countX = Math.round(75 * Math.sqrt(this.density));
      const countY = Math.round(75 * Math.sqrt(this.density));
      this.countX = countX;
      this.countY = countY;
      const numParticles = countX * countY;

      const positions = new Float32Array(numParticles * 3);
      const sep = 38;
      let i = 0;
      for (let ix = 0; ix < countX; ix++) {
        for (let iy = 0; iy < countY; iy++) {
          positions[i] = ix * sep - ((countX * sep) / 2);
          positions[i + 1] = 0;
          positions[i + 2] = iy * sep - ((countY * sep) / 2);
          i += 3;
        }
      }

      this.geometry = new THREE.BufferGeometry();
      this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      if (this.style === 'ethereal-silk') {
        // Wireframe mesh lines for silk flow
        const indices = [];
        for (let ix = 0; ix < countX - 1; ix++) {
          for (let iy = 0; iy < countY - 1; iy++) {
            const a = ix * countY + iy;
            const b = (ix + 1) * countY + iy;
            const c = ix * countY + (iy + 1);
            const d = (ix + 1) * countY + (iy + 1);
            indices.push(a, b, c);
            indices.push(b, d, c);
          }
        }
        this.geometry.setIndex(indices);
        this.material = new THREE.MeshBasicMaterial({
          color: primaryColor,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
      } else {
        // Glowing particle points
        this.material = new THREE.PointsMaterial({
          color: primaryColor,
          size: 4.5,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Points(this.geometry, this.material);
      }

      this.scene.add(this.mesh);
      this.camera.position.set(0, 320, 580);
      this.camera.lookAt(0, 20, -150);

    } else if (this.style === 'cyber-grid') {
      const size = 2400;
      const divisions = Math.round(50 * this.density);
      this.gridHelper = new THREE.GridHelper(size, divisions, primaryColor, primaryColor);
      this.gridHelper.position.y = -60;
      this.gridHelper.material.transparent = true;
      this.gridHelper.material.opacity = 0.65;
      this.scene.add(this.gridHelper);

      this.camera.position.set(0, 140, 550);
      this.camera.lookAt(0, -30, -400);

    } else if (this.style === 'starfield') {
      const starCount = Math.round(1800 * this.density);
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2500;
        positions[i + 1] = (Math.random() - 0.5) * 2500;
        positions[i + 2] = (Math.random() - 0.5) * 2500;
      }
      this.geometry = new THREE.BufferGeometry();
      this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.material = new THREE.PointsMaterial({
        color: primaryColor,
        size: 3.5,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      this.mesh = new THREE.Points(this.geometry, this.material);
      this.scene.add(this.mesh);

      this.camera.position.set(0, 0, 500);
      this.camera.lookAt(0, 0, 0);
    }
  }

  updateSettings(newSettings) {
    let rebuild = false;
    if (newSettings.style !== undefined && newSettings.style !== this.style) {
      this.style = newSettings.style;
      rebuild = true;
    }
    if (newSettings.density !== undefined && newSettings.density !== this.density) {
      this.density = newSettings.density;
      rebuild = true;
    }
    if (newSettings.color !== undefined && newSettings.color !== this.color) {
      this.color = newSettings.color;
      rebuild = true;
    }

    if (newSettings.speed !== undefined) this.speed = newSettings.speed;
    if (newSettings.waveHeight !== undefined) this.waveHeight = newSettings.waveHeight;
    if (newSettings.bgColor !== undefined) this.bgColor = newSettings.bgColor;
    if (newSettings.audioReactive !== undefined) this.audioReactive = newSettings.audioReactive;

    if (rebuild) this.buildMesh();
  }

  render(dt = 0.016, audioMetrics = { bass: 0, overall: 0 }) {
    if (!this.renderer || !this.scene) return;

    this.time += dt * this.speed;
    const t = this.time;
    const beatPulse = this.audioReactive ? (audioMetrics.bass || 0) : 0;
    const elevation = this.waveHeight * (1.0 + beatPulse * 0.7);

    // 1. Procedural 3D Wave updates
    if ((this.style === 'particle-waves' || this.style === 'ethereal-silk') && this.geometry) {
      const pos = this.geometry.attributes.position.array;
      const countX = this.countX;
      const countY = this.countY;
      let k = 0;

      for (let ix = 0; ix < countX; ix++) {
        for (let iy = 0; iy < countY; iy++) {
          const wave1 = Math.sin((ix * 0.28) + (t * 2.8)) * elevation * 0.55;
          const wave2 = Math.cos((iy * 0.36) + (t * 2.2)) * elevation * 0.55;
          const ripple = Math.sin(Math.sqrt(ix * ix + iy * iy) * 0.3 - t * 3.2) * (beatPulse * 28);
          pos[k + 1] = wave1 + wave2 + ripple;
          k += 3;
        }
      }
      this.geometry.attributes.position.needsUpdate = true;

      // Organic camera float parallax
      this.camera.position.x = Math.sin(t * 0.6) * 60;
      this.camera.position.y = 310 + Math.cos(t * 0.5) * 30 + beatPulse * 20;

    } else if (this.style === 'cyber-grid' && this.gridHelper) {
      this.gridHelper.position.z = (t * 220) % 48;
      this.camera.position.x = Math.sin(t * 0.8) * 80;

    } else if (this.style === 'starfield' && this.geometry) {
      const pos = this.geometry.attributes.position.array;
      const speed = (220 + beatPulse * 600) * dt * this.speed;
      for (let i = 2; i < pos.length; i += 3) {
        pos[i] += speed;
        if (pos[i] > 1000) pos[i] = -1500;
      }
      this.geometry.attributes.position.needsUpdate = true;
      this.mesh.rotation.z = t * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
