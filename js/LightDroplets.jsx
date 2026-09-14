/*
 * LightDroplets — equivalent of the React Bits Pro "Light Droplets" component
 * (license-gated, so this is a clean-room implementation matched to its
 * described behavior): falling light streaks with rotation and glow effects.
 *
 * Canvas 2D — streaks fall, slowly rotate, flicker, and glow via additive
 * compositing. Themed for this site (gold / warm white / rose on maroon).
 */
(() => {
const { useEffect, useRef } = React;

const LightDroplets = ({
  count = 24,                                             // streaks at reference width
  colors = ['#d4af37', '#f0d060', '#ffe9c4', '#e8b49a', '#a63a50'],
  speed = 70,                                             // base fall speed (px/s)
  length = [70, 170],                                     // streak length range (px)
  thickness = [1, 2.4],                                   // streak width range (px)
  tilt = 24,                                              // max static tilt from vertical (deg)
  spin = 10,                                              // max rotation speed (deg/s)
  glow = 16,                                              // glow radius (px)
  maxOpacity = 0.8,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    let visible = true;
    let last = performance.now();
    let streaks = [];

    const rand = (a, b) => a + Math.random() * (b - a);

    const makeStreak = (spawnAnywhere) => {
      const len = rand(length[0], length[1]);
      return {
        x: rand(-40, w + 40),
        y: spawnAnywhere ? rand(-h * 0.2, h) : rand(-len - 80, -40),
        len,
        thick: rand(thickness[0], thickness[1]),
        angle: rand(-tilt, tilt) * (Math.PI / 180),
        spin: rand(-spin, spin) * (Math.PI / 180),
        vy: speed * rand(0.6, 1.7),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: maxOpacity * rand(0.45, 1),
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.5, 1.6),
      };
    };

    const drawStreak = (s, t) => {
      const flicker = 0.72 + 0.28 * Math.sin(t * s.pulseSpeed + s.pulse);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = s.alpha * flicker;
      const grad = ctx.createLinearGradient(0, -s.len / 2, 0, s.len / 2);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.35, s.color);
      grad.addColorStop(0.5, '#fff8e0'); // hot core
      grad.addColorStop(0.65, s.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.thick;
      ctx.lineCap = 'round';
      ctx.shadowColor = s.color;
      ctx.shadowBlur = glow;
      ctx.beginPath();
      ctx.moveTo(0, -s.len / 2);
      ctx.lineTo(0, s.len / 2);
      ctx.stroke();
      ctx.restore();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fewer streaks on narrow screens
      const target = Math.max(8, Math.round(count * Math.min(1.4, Math.max(0.45, w / 1100))));
      streaks = Array.from({ length: target }, () => makeStreak(true));
      if (reduced) {
        ctx.clearRect(0, 0, w, h);
        streaks.forEach((s) => drawStreak(s, 1));
      }
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !document.hidden) {
        ctx.clearRect(0, 0, w, h);
        const t = now / 1000;
        for (const s of streaks) {
          s.y += s.vy * dt;
          s.angle += s.spin * dt;
          if (s.y - s.len / 2 > h + 60) Object.assign(s, makeStreak(false));
          drawStreak(s, t);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    resize();

    if (!reduced) {
      raf = requestAnimationFrame((now) => { last = now; frame(now); });
    }

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    let timer;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(resize, 150); };
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(onResize);
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', onResize);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      clearTimeout(timer);
    };
  }, [count, speed, glow, tilt, spin, maxOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`light-droplets ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
};

window.LightDroplets = LightDroplets;
})();
