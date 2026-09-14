/*
 * Island bootstrap — mounts React Bits components onto placeholders in index.html:
 *   - [data-foldtext]    -> <FoldText />   (section headings)
 *   - [data-scrollfloat] -> <ScrollFloat /> (content blocks: about / qualification / hobbies)
 * Props are passed as JSON in the data attribute.
 */
(() => {
const { createRoot } = ReactDOM;

const parseProps = (el, attr) => {
  try {
    return JSON.parse(el.dataset[attr] || '{}');
  } catch (err) {
    console.error('Invalid JSON in data attribute', err);
    return {};
  }
};

if (window.FoldText) {
  document.querySelectorAll('[data-foldtext]').forEach((el) => {
    const props = parseProps(el, 'foldtext');
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    createRoot(el).render(<FoldText {...props} text={text} />);
  });
}

if (window.ScrollFloat) {
  document.querySelectorAll('[data-scrollfloat]').forEach((el) => {
    const props = parseProps(el, 'scrollfloat');
    const html = el.innerHTML;
    createRoot(el).render(<ScrollFloat {...props} html={html} />);
  });
}

if (window.RippleDistortion) {
  document.querySelectorAll('[data-rippledistortion]').forEach((el) => {
    const props = parseProps(el, 'rippledistortion');
    if (window.innerWidth < 768) props.quality = 'low'; // lighter render on phones
    createRoot(el).render(<RippleDistortion {...props} />);
  });
}

if (window.BlinkingSquares) {
  document.querySelectorAll('[data-blinkingsquares]').forEach((el) => {
    const props = parseProps(el, 'blinkingsquares');
    createRoot(el).render(<BlinkingSquares {...props} />);
  });
}

if (window.LightDroplets) {
  document.querySelectorAll('[data-lightdroplets]').forEach((el) => {
    const props = parseProps(el, 'lightdroplets');
    createRoot(el).render(<LightDroplets {...props} />);
  });
}

if (window.Landscape) {
  document.querySelectorAll('[data-landscape]').forEach((el) => {
    const props = parseProps(el, 'landscape');
    createRoot(el).render(<Landscape {...props} />);
  });
}

if (window.WireframeBall) {
  document.querySelectorAll('[data-wireframeball]').forEach((el) => {
    const props = parseProps(el, 'wireframeball');
    createRoot(el).render(<WireframeBall {...props} />);
  });
}

if (window.GhostCursor) {
  const mountGhostCursors = () => {
    document.querySelectorAll('[data-ghostcursor]').forEach((el) => {
      const props = parseProps(el, 'ghostcursor');
      createRoot(el).render(<GhostCursor {...props} />);
    });
  };
  // ghost-cursor-lib.js is an ES module — it may finish loading after this script
  if (window.GhostCursorLib) mountGhostCursors();
  else {
    window.addEventListener('ghostcursor-lib-ready', mountGhostCursors, { once: true });
    setTimeout(() => {
      if (!window.GhostCursorLib) {
        console.warn('[GhostCursor] three.js module graph did not load. ' +
          'Serve the site over HTTP(S) (not file://) and check the console for module errors.');
      }
    }, 5000);
  }
}
})();
