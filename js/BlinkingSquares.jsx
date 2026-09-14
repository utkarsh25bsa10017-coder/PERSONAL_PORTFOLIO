/*
 * BlinkingSquares — equivalent of the React Bits Pro component (license-gated,
 * so this is a clean-room implementation matched to its behavior):
 * a full-bleed grid of small squares that blink in and out at random
 * intervals. Themed for this site (gold / maroon).
 */
(() => {
const { useEffect, useRef, useState } = React;

const BlinkingSquares = ({
  colors = ['#d4af37', '#a63a50'],
  cellSize = 46,
  squareSize = 12,
  maxOpacity = 0.8,
  density = 0.3,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const [cells, setCells] = useState([]);

  const build = () => {
    const el = rootRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const cols = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const next = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (Math.random() > density) continue;
        next.push({
          left: c * cellSize + (cellSize - squareSize) / 2,
          top: r * cellSize + (cellSize - squareSize) / 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: (Math.random() * 6).toFixed(2) + 's',
          dur: (2.5 + Math.random() * 4.5).toFixed(2) + 's',
          peak: Math.min(1, maxOpacity * (0.55 + Math.random() * 0.45)).toFixed(2)
        });
      }
    }
    setCells(next);
  };

  useEffect(() => {
    build();
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, [cellSize, squareSize, density]);

  return (
    <div ref={rootRef} className={`blinking-squares ${className}`.trim()} style={style} aria-hidden="true">
      {cells.map((s, i) => (
        <span
          key={i}
          className="blinking-square"
          style={{
            left: s.left + 'px',
            top: s.top + 'px',
            width: squareSize + 'px',
            height: squareSize + 'px',
            background: s.color,
            animationDelay: s.delay,
            animationDuration: s.dur,
            '--blink-peak': s.peak
          }}
        />
      ))}
    </div>
  );
};

window.BlinkingSquares = BlinkingSquares;
})();
