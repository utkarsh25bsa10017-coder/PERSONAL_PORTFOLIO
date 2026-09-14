/*
 * Landscape — equivalent of the React Bits Pro background component (license-gated,
 * clean-room implementation matched to its behavior):
 * a parallax scene of layered mountain ridges under a twinkling starry sky,
 * with drifting mist and a glowing moon. Themed for this site (gold / maroon).
 *
 * Rendered at low opacity by default so section content stays readable —
 * tune with the `opacity` prop (0-1 scale on the ridge layers).
 */
(() => {
const { useEffect, useRef, useState } = React;

// Hazy atmospheric perspective: far ridges are light gold haze, near ones darker
const LAYER_FILLS = [
  { color: '#c9a15a', op: 0.14 },
  { color: '#8a4a5e', op: 0.24 },
  { color: '#54223c', op: 0.34 },
  { color: '#2a0a14', op: 0.46 }
];

const Landscape = ({
  layers = 4,
  starCount = 70,
  opacity = 1,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || 1;
      setWidth(w);
      const next = [];
      for (let i = 0; i < starCount; i += 1) {
        next.push({
          left: (Math.random() * 100).toFixed(2) + '%',
          top: (Math.random() * 58).toFixed(2) + '%',
          size: (1 + Math.random() * 1.8).toFixed(2) + 'px',
          delay: (Math.random() * 5).toFixed(2) + 's',
          dur: (2 + Math.random() * 4).toFixed(2) + 's',
          gold: Math.random() > 0.4
        });
      }
      setStars(next);
    };
    measure();
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [starCount]);

  // Sine terms with integer frequency over one tile width -> seamless loop
  const ridgePath = (W, i) => {
    const N = 28;
    const base = 0.30 + i * 0.16;   // ridge line within the tile
    const amp = 0.20 - i * 0.035;   // nearer ridges are smoother
    const pts = [];
    for (let s = 0; s <= N; s += 1) {
      const t = (s / N) * Math.PI * 2;
      const y = base
        - amp * 0.55 * Math.sin(t * (1 + i) + i * 1.7)
        - amp * 0.30 * Math.sin(t * (3 + i * 2) + i * 0.9)
        - amp * 0.15 * Math.sin(t * (6 + i * 3) + i * 2.3);
      pts.push([(s / N) * W, y]);
    }
    const line = pts.map(([x, y]) => `${x.toFixed(1)} ${(y * 100).toFixed(2)}`).join(' L');
    return `M0 100 L${line} L${W} 100 Z`;
  };

  const W = Math.max(width, 600);
  const H = 100;

  return (
    <div ref={rootRef} className={`landscape ${className}`.trim()} style={style} aria-hidden="true">
      <div className="ls-sky"></div>

      <div className="ls-stars">
        {stars.map((s, i) => (
          <span
            key={i}
            className={'ls-star' + (s.gold ? ' ls-star-gold' : '')}
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.dur
            }}
          />
        ))}
      </div>

      <div className="ls-moon"></div>

      <div className="ls-mist ls-mist-a"></div>
      <div className="ls-mist ls-mist-b"></div>

      {Array.from({ length: layers }).map((_, i) => {
        const fill = LAYER_FILLS[i % LAYER_FILLS.length];
        return (
          <div key={i} className="ls-layer" style={{ height: (86 - i * 14) + '%' }}>
            <svg
              className="ls-ridge"
              viewBox={`0 0 ${W * 2} ${H}`}
              preserveAspectRatio="none"
              style={{ animationDuration: (110 - i * 22) + 's' }}
            >
              <path d={ridgePath(W, i)} fill={fill.color} fillOpacity={fill.op * opacity} />
              <path
                d={ridgePath(W, i)}
                fill={fill.color}
                fillOpacity={fill.op * opacity}
                transform={`translate(${W} 0)`}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

window.Landscape = Landscape;
})();
