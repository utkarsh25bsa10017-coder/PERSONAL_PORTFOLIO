/*
 * WireframeBall — equivalent of the React Bits Pro background component (license-gated,
 * clean-room implementation matched to its behavior):
 * a slowly rotating wireframe sphere rendered with the vendored OGL bundle (window.OGL),
 * with subtle mouse parallax. Themed for this site (gold), translucent by default.
 */
(() => {
const { useEffect, useRef } = React;
const { Renderer, Camera, Geometry, Mesh, Program, Sphere } = window.OGL;

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255 }
    : { r: 0.83, g: 0.69, b: 0.22 };
};

const vertex = `
precision highp float;
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
void main() {
  gl_FragColor = vec4(uColor, uOpacity);
}
`;

const WireframeBall = ({
  color = '#d4af37',
  opacity = 0.3,
  speed = 0.25,
  widthSegments = 28,
  heightSegments = 18,
  scale = 1.25,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !window.OGL) return;

    let raf;
    let destroyed = false;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    const { gl, canvas } = renderer;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.appendChild(canvas);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, 3.4);

    // Build an explicit line list from the sphere's triangle edges
    const sphere = new Sphere(gl, { radius: 1, widthSegments, heightSegments });
    const pos = sphere.attributes.position.value;
    const index = sphere.attributes.index ? sphere.attributes.index.value : null;
    const count = pos.length / 3;
    const lines = [];
    if (index) {
      for (let i = 0; i < index.length; i += 3) {
        const a = index[i], b = index[i + 1], c = index[i + 2];
        lines.push(a, b, b, c, c, a);
      }
    } else {
      for (let i = 0; i < count; i += 3) {
        lines.push(i, i + 1, i + 1, i + 2, i + 2, i);
      }
    }
    const lineData = new Float32Array(lines.length * 3);
    for (let i = 0; i < lines.length; i += 1) {
      const v = lines[i];
      lineData[i * 3] = pos[v * 3];
      lineData[i * 3 + 1] = pos[v * 3 + 1];
      lineData[i * 3 + 2] = pos[v * 3 + 2];
    }

    const geometry = new Geometry(gl, { position: { size: 3, data: lineData } });
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uColor: { value: hexToRgb(color) },
        uOpacity: { value: opacity }
      }
    });
    const mesh = new Mesh(gl, { geometry, program, mode: gl.LINES });
    mesh.scale.set(scale);

    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    };
    resize();
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(resize, 200);
    };
    window.addEventListener('resize', onResize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let last = performance.now();
    let rot = 0;
    const loop = (now) => {
      if (destroyed) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      rot += dt * speed;
      mesh.rotation.y = rot + mouse.x * 0.5;
      mesh.rotation.x = Math.sin(rot * 0.7) * 0.3 + mouse.y * 0.35;
      renderer.render({ scene: mesh, camera });
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      renderer.render({ scene: mesh, camera }); // single static frame
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      canvas.remove();
    };
  }, [color, opacity, speed, widthSegments, heightSegments, scale]);

  return (
    <div
      ref={rootRef}
      className={`wireframe-ball ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
};

window.WireframeBall = WireframeBall;
})();
