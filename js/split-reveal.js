/* Split reveal — masked word rise for arbitrary elements.
 * Usage: <p data-split data-split-delay="0.85">Text with <span class="hl">highlight</span></p>
 * Every word gets wrapped in an overflow mask and rises with a stagger.
 * Buttons: add class "sr-btn" (seen as single self-rising units via [data-split-btn]).
 */
(() => {
  const WORD_STEP = 0.035;

  document.querySelectorAll('[data-split]').forEach((el) => {
    let t = parseFloat(el.dataset.splitDelay || 0);
    const frag = document.createDocumentFragment();

    el.childNodes.forEach((node) => {
      const cls = node.nodeType === 1 ? node.className : '';
      const text = node.textContent;
      text.split(/\s+/).forEach((word, idx, arr) => {
        if (!word) return;
        const mask = document.createElement('span');
        mask.className = 'sr-w-mask' + (idx === arr.length - 1 ? ' sr-w-last' : '');
        const w = document.createElement('span');
        w.className = 'sr-word ' + cls;
        w.style.animationDelay = t.toFixed(3) + 's';
        w.textContent = word;
        mask.appendChild(w);
        frag.appendChild(mask);
        if (idx < arr.length - 1) frag.appendChild(document.createTextNode(' '));
        t += WORD_STEP;
      });
    });

    el.textContent = '';
    el.appendChild(frag);
  });

  document.querySelectorAll('[data-split-btn]').forEach((el) => {
    const t = parseFloat(el.dataset.splitDelay || 0);
    el.querySelectorAll('.sr-btn').forEach((btn, idx, arr) => {
      const mask = document.createElement('span');
      mask.className = 'sr-w-mask sr-btn-wrap';
      btn.classList.add('sr-word');
      btn.style.animationDelay = (t + idx * WORD_STEP * 2).toFixed(3) + 's';
      btn.parentNode.insertBefore(mask, btn);
      mask.appendChild(btn);
      if (idx < arr.length - 1) mask.insertAdjacentText('afterend', ' ');
    });
  });
})();
