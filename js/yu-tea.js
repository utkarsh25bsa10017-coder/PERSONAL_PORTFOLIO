/* YU_TEA — portfolio AI chatbot
 * Loads knowledge.json, answers visitor questions about Utkarsh.
 * Uses any OpenAI-compatible chat API (OpenRouter by default, free models).
 * Visitor's key is stored only in their browser's localStorage.
 */
(() => {
  const PROVIDER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  // Optional local override: js/yu-tea-config.js (gitignored) defines window.YUTEA_API_KEY / YUTEA_MODEL.
  const MODEL = window.YUTEA_MODEL || 'minimax/minimax-m3.1-flash:free';
  const AVATAR = 'assets/yu-tea.png';
  const DEFAULT_API_KEY = window.YUTEA_API_KEY || '';
  let knowledge = null;

  const widget = document.createElement('div');
  widget.innerHTML = `
    <button class="yutea-fab" aria-label="Chat with YU_TEA">
      <img src="${AVATAR}" alt="" />
    </button>
    <span class="yutea-hint" aria-hidden="true"><span class="yutea-hint-text"></span><span class="yutea-hint-cursor">▊</span></span>
    <div class="yutea-window" role="dialog" aria-label="YU_TEA chat">
      <div class="yutea-head">
        <div class="avatar"><img src="${AVATAR}" alt=""/><span class="pulse"></span></div>
        <div>
          <h3>YU_TEA</h3>
          <p>Knows Everything About Utkarsh</p>
        </div>
        <span class="yutea-status"><span class="dot"></span><span class="label">online</span></span>
        <button class="yutea-close" aria-label="Close chat">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="yutea-body"></div>
      <div class="yutea-foot">
        <input type="text" placeholder="Ask me about Utkarsh..." aria-label="Message" />
        <button aria-label="Send">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9-7-9-7v3H4v8h8v3z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const fab = widget.querySelector('.yutea-fab');
  const win = widget.querySelector('.yutea-window');
  const body = widget.querySelector('.yutea-body');
  const input = widget.querySelector('.yutea-foot input');
  const sendBtn = widget.querySelector('.yutea-foot button');
  const statusDot = widget.querySelector('.yutea-status .dot');
  const statusLabel = widget.querySelector('.yutea-status .label');
  const closeBtn = widget.querySelector('.yutea-close');

  const hKeys = () => 'yt_' + location.host.replace(/\W+/g, '_');
  const getKey = () => localStorage.getItem(hKeys()) || DEFAULT_API_KEY;

  const addMsg = (cls, text) => {
    const el = document.createElement('div');
    el.className = 'yutea-msg ' + cls;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  };

  const setBusy = (busy) => {
    statusDot.classList.toggle('busy', busy);
    statusLabel.textContent = busy ? 'thinking' : 'online';
    sendBtn.disabled = busy;
    input.disabled = busy;
  };

  /* --- interactive thinking interface --- */
  function buildThinking() {
    const el = document.createElement('div');
    el.className = 'yutea-thinking';
    el.innerHTML = `
      <div class="steps">
        <span class="step"><span class="spinner"></span>Parsing question</span>
        <span class="step"><span class="spinner"></span>Searching my knowledge</span>
        <span class="step"><span class="spinner"></span>Formulating answer</span>
      </div>
      <div class="dots"><span></span><span></span><span></span></div>
    `;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;

    const steps = [...el.querySelectorAll('.step')];
    let i = 0;
    const tick = () => {
      steps.forEach((s, idx) => {
        s.classList.toggle('active', idx === i);
        s.classList.toggle('done', idx < i);
        s.querySelector('.spinner').style.display = idx <= i ? '' : 'none';
      });
      i = (i + 1) % Math.max(steps.length, 1);
    };
    tick();
    const timer = setInterval(tick, 1200);
    return { el, finish() { clearInterval(timer); } };
  }

  /* --- offline fallback: keyword search over knowledge.json --- */
  function offlineAnswer(q) {
    if (!knowledge) return "I couldn't load my knowledge base. Try refreshing the page!";
    const hay = JSON.stringify(knowledge).toLowerCase();
    const words = q.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const hits = words.filter(w => hay.includes(w));
    if (hits.length) {
      return "Here's what I know, from my knowledge base:\n\n" +
        JSON.stringify(knowledge, null, 1).slice(0, 600) + "\n\n…(connect an AI key via the ⚙ icon for real conversation)";
    }
    return "That's not in my knowledge base yet! Utkarsh can update my knowledge.json file to teach me that. Meanwhile, try asking about his skills, projects, running, or aerospace work.";
  }

  /* --- LLM call --- */
  async function ask(question) {
    const history = [
      {
        role: 'system',
        content: 'You are YU_TEA, an AI avatar on Utkarsh\'s portfolio who knows everything about him. ' +
          'Answer ONLY using the knowledge below. Be friendly, concise (3-5 sentences max), and stay in character. ' +
          'If the answer is not in the knowledge, say you don\'t have that information.\n\nKNOWLEDGE BASE:\n' +
          JSON.stringify(knowledge, null, 1),
      },
    ];
    body.querySelectorAll('.yutea-msg').forEach(m => {
      history.push({ role: m.classList.contains('user') ? 'user' : 'assistant', content: m.textContent });
    });

    const apiKey = getKey();

    // Prefer the Vercel serverless proxy (key stays server-side).
    let res = null;
    try {
      res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ messages: history }),
      });
      if (res.status === 404) res = null; // not deployed on this host (GitHub Pages) -> offline mode
      else if (!res.ok) {
        const txt = await res.text();
        throw new Error('API error ' + res.status + ': ' + txt.slice(0, 200));
      }
    } catch (netErr) {
      // Network failure on /api (e.g. GitHub Pages) -> fall through to offline mode
      res = null;
    }

    if (!res) {
      await new Promise(r => setTimeout(r, 1600));
      return offlineAnswer(question);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  async function handleSubmit() {
    const q = input.value.trim();
    if (!q || sendBtn.disabled) return;
    input.value = '';
    addMsg('user', q);
    const think = buildThinking();
    setBusy(true);
    try {
      const answer = await ask(q);
      think.finish();
      think.el.remove();
      addMsg('bot', answer);
    } catch (err) {
      think.finish();
      think.el.remove();
      addMsg('bot', 'Something glitched in my circuits: ' + err.message);
    }
    setBusy(false);
    input.focus();
  }

  sendBtn.addEventListener('click', handleSubmit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });

  /* --- typing hint text --- */
  const hintText = widget.querySelector('.yutea-hint-text');
  const FULL = 'Ask YUTEA anything about Utkarsh';
  let typing = true, ci = 0;
  function typeLoop() {
    if (!hintText) return;
    hintText.textContent = FULL.slice(0, ci);
    if (typing) {
      if (ci < FULL.length) { ci++; setTimeout(typeLoop, 70); }
      else { typing = false; setTimeout(typeLoop, 3500); }
    } else {
      if (ci > 0) { ci--; setTimeout(typeLoop, 24); }
      else { typing = true; setTimeout(typeLoop, 600); }
    }
  }
  typeLoop();

  const toggle = () => {
    win.classList.toggle('open');
    widget.querySelector('.yutea-hint').classList.toggle('fade', win.classList.contains('open'));
    if (win.classList.contains('open')) input.focus();
  };
  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  /* dismiss when clicking outside the window */
  document.addEventListener('pointerdown', (e) => {
    if (win.classList.contains('open') && !win.contains(e.target) && !fab.contains(e.target)) {
      win.classList.remove('open');
      hint.classList.add('fade');
    }
  });

  /* --- fade away into a blur outside hero/contact sections --- */
  const hint = widget.querySelector('.yutea-hint');
  const els = [fab, hint];
  const state = { hero: false, contact: false };
  const applyVisibility = () => {
    const visible = state.hero || state.contact;
    els.forEach((el) => el.classList.toggle('yutea-blur', !visible));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.target.id === 'hero') state.hero = e.isIntersecting;
      if (e.target.id === 'contact') state.contact = e.isIntersecting;
    });
    applyVisibility();
  }, { rootMargin: '60px 0px' });

  const heroEl = document.getElementById('hero');
  const contactEl = document.getElementById('contact');
  if (heroEl) io.observe(heroEl);
  if (contactEl) io.observe(contactEl);

  addMsg('bot', 'Hi! I\'m YU_TEA ☕ — I know everything about Utkarsh: his studies, projects, drones, and running records. What do you want to know?');
  setBusy(false);

  fetch('knowledge.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(j => { knowledge = j; })
    .catch(err => console.error('[YU_TEA] knowledge.json failed to load:', err));
})();
