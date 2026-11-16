// Modo comentario: stakeholders click any element and leave a comment as a GitHub Issue.
// The issue opens pre-filled with the screen, its state and the element clicked; the reviewer only presses «Create».
// C toggles the mode (as in Figma). Each comment leaves a numbered mark where it was made, visible in comment mode.
// Marks live in this browser only (localStorage): the repo is private, so the page cannot read other people's issues.
// Needs access to the (private) repo below. Hidden in recording mode (?manual=1), inside the runner, or with ?comentarios=0.
(function () {
  const REPO = 'titox/telefonica-ssot-prototype';
  const LABEL = 'comentario';
  const LOGIN = 'https://github.com/login';
  // After signing in, GitHub sends the reviewer straight to the pre-filled issue
  const loginTo = url => `${LOGIN}?return_to=${encodeURIComponent(url.replace('https://github.com', ''))}`;

  const q = new URLSearchParams(location.search);
  if (q.get('comentarios') === '0' || window.top !== window) return;

  // Which persona and screen this is, from the file name
  const SCREENS = {
    'index.html': ['María', 'Inicio'], 'briefing.html': ['María', 'Briefing ejecutivo'],
    'javier.html': ['Javier', 'Inicio'], 'javier-plantilla.html': ['Javier', 'Plantilla'],
    'javier-tono.html': ['Javier', 'Tono'], 'javier-training.html': ['Javier', 'Training'],
    'laura.html': ['Laura', 'Inicio'], 'laura-revision.html': ['Laura', 'Revisión'],
    'carlos.html': ['Carlos', 'Trust Center'], 'carlos-secuencia.html': ['Carlos', 'Secuencia'],
    'carlos-alerta.html': ['Carlos', 'Alerta'], 'carlos-audit.html': ['Carlos', 'Audit Explorer'],
    'carlos-informe.html': ['Carlos', 'Informe semanal'],
  };
  const file = location.pathname.split('/').pop() || 'index.html';
  const [persona, screen] = SCREENS[file] || ['General', document.title];
  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Prototype state (e.g. ?done=1), without the demo switches
  const state = [...q].filter(([k]) => !['anon', 'manual', 'comentarios', 'cb'].includes(k)).map(([k, v]) => `${k}=${v}`).join('&');

  // Marks: one list per screen + state, in this browser only
  const KEY = `ssot-comentarios:${file}?${state}`;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };

  const css = `
  .cm-ui { font-family: var(--font); font-size: 15px; line-height: 1.5; color: var(--grey-9); }
  .cm-ui kbd { font: inherit; font-size: 13px; font-weight: 600; min-width: 22px; padding: 0 6px; text-align: center; border-radius: 4px; }
  .cm-fab { position: fixed; right: var(--s-6); bottom: var(--s-6); z-index: 9000; display: inline-flex; align-items: center; gap: var(--s-2);
    height: 48px; padding: 0 var(--s-3) 0 var(--s-5); border: 0; border-radius: var(--r-pill); background: var(--grey-9); color: var(--grey-0);
    font-weight: 600; box-shadow: var(--shadow-2); transition: background .15s var(--ease-out), transform .15s var(--ease-out); }
  .cm-fab:hover { background: var(--grey-8); }
  .cm-fab:active { transform: scale(.97); }
  .cm-fab kbd { border: 1px solid var(--grey-6); color: var(--grey-3); }
  .cm-on .cm-fab { background: var(--blue); }
  .cm-on .cm-fab:hover { background: var(--blue-press); }
  .cm-on .cm-fab kbd { border-color: rgba(255, 255, 255, .5); color: var(--grey-0); }
  .cm-bar { position: fixed; bottom: var(--s-6); left: 50%; transform: translate(-50%, 8px); opacity: 0; pointer-events: none; z-index: 9000;
    display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) var(--s-2) var(--s-2) var(--s-4); border-radius: var(--r-pill);
    background: var(--grey-9); color: var(--grey-0); box-shadow: var(--shadow-2); transition: opacity .2s var(--ease-out), transform .2s var(--ease-out); }
  .cm-on .cm-bar { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
  .cm-bar kbd { border: 1px solid var(--grey-6); }
  .cm-bar button { height: 36px; padding: 0 var(--s-4); border: 1px solid var(--grey-6); border-radius: var(--r-pill); background: transparent; color: var(--grey-0); font-weight: 600; }
  .cm-bar button:hover { background: var(--grey-8); }
  .cm-on, .cm-on * { cursor: crosshair !important; }
  .cm-on .cm-ui, .cm-on .cm-ui * { cursor: auto !important; }
  .cm-on .cm-ui button, .cm-on .cm-ui button *, .cm-on .cm-ui a { cursor: pointer !important; }
  .cm-hl { position: fixed; z-index: 8998; pointer-events: none; border: 2px dashed var(--blue); border-radius: var(--r-ctrl);
    background: rgba(0, 102, 255, .06); display: none; transition: all .08s var(--ease-out); }

  /* Marks: Figma-style pins, tip on the exact point clicked */
  .cm-pins { display: none; }
  .cm-on .cm-pins { display: block; }
  .cm-pin { position: fixed; z-index: 8999; width: 32px; height: 32px; margin: -32px 0 0 0; padding: 0; display: grid; place-items: center;
    border: 2px solid var(--grey-0); border-radius: 50% 50% 50% 0; background: var(--blue); color: var(--grey-0);
    font-size: 13px; font-weight: 700; box-shadow: var(--shadow-2); animation: cm-pop .2s var(--ease-out);
    transition: transform .15s var(--ease-out), background .15s var(--ease-out); transform-origin: bottom left; }
  .cm-pin::before { content: ""; position: absolute; inset: -6px; }
  .cm-pin:hover, .cm-pin[aria-expanded="true"] { transform: scale(1.12); background: var(--blue-press); }
  .cm-pin.is-draft { background: var(--grey-9); }
  @keyframes cm-pop { from { opacity: 0; transform: scale(.6); } }

  .cm-card { position: fixed; z-index: 9001; width: 360px; padding: var(--s-5); background: var(--grey-0); border: 1px solid var(--grey-2);
    border-radius: var(--r-card); box-shadow: var(--shadow-2); display: none; animation: cm-in .2s var(--ease-out); }
  @keyframes cm-in { from { opacity: 0; transform: translateY(4px); } }
  .cm-card h2 { margin: 0 0 var(--s-1); font-size: 16px; font-weight: 600; }
  .cm-ctx { margin: 0 0 var(--s-4); color: var(--grey-6); font-size: 14px; }
  .cm-ctx strong { color: var(--grey-9); font-weight: 600; }
  .cm-card label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
  .cm-card textarea { width: 100%; min-height: 96px; padding: var(--s-3); border: 1px solid var(--grey-3); border-radius: var(--r-ctrl); resize: vertical; }
  .cm-card textarea:focus { outline: 2px solid var(--blue); outline-offset: 0; border-color: var(--blue); }
  .cm-hint { margin: var(--s-2) 0 var(--s-4); color: var(--grey-6); font-size: 14px; }
  .cm-quote { margin: 0 0 var(--s-4); white-space: pre-wrap; }
  .cm-actions { display: flex; justify-content: flex-end; gap: var(--s-2); }
  .cm-actions button, .cm-actions a { height: 40px; padding: 0 var(--s-4); border-radius: var(--r-ctrl); font-weight: 600; display: inline-flex; align-items: center; gap: var(--s-2); }
  .cm-ghost { border: 1px solid var(--grey-2); background: var(--grey-0); }
  .cm-ghost:hover { background: var(--grey-1); }
  .cm-primary { border: 0; background: var(--blue); color: var(--grey-0) !important; }
  .cm-primary:hover { background: var(--blue-press); }
  .cm-primary:disabled { background: var(--grey-2); color: var(--grey-6) !important; cursor: not-allowed !important; }
  .cm-login { right: var(--s-6); bottom: 88px; }
  .cm-login p { margin: 0 0 var(--s-4); }
  .cm-login .cm-actions { flex-direction: column-reverse; }
  .cm-login .cm-actions > * { width: 100%; justify-content: center; }
  .cm-hint a { color: var(--blue); font-weight: 600; text-decoration: underline; }
  .cm-toast { position: fixed; left: 50%; bottom: 88px; transform: translate(-50%, 8px); opacity: 0; z-index: 9001; max-width: 520px;
    display: flex; align-items: flex-start; gap: var(--s-3); padding: var(--s-3) var(--s-4); border-radius: var(--r-card);
    background: var(--grey-9); color: var(--grey-0); box-shadow: var(--shadow-2); transition: opacity .2s var(--ease-out), transform .2s var(--ease-out); pointer-events: none; }
  .cm-toast.is-on { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
  .cm-toast a, .cm-toast button { color: var(--grey-0); text-decoration: underline; font-weight: 600; background: none; border: 0; padding: 0; }
  @media (prefers-reduced-motion: reduce) { .cm-ui, .cm-ui *, .cm-hl { transition: none !important; animation: none !important; } }`;

  const ICON = n => window.lucide ? `<i data-lucide="${n}" aria-hidden="true"></i>` : '';
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };

  // A stable address for an element, so a mark stays on it when the layout moves
  const pathOf = el => {
    const parts = [];
    for (; el && el !== document.body; el = el.parentElement) {
      let i = 1; for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) i++;
      parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${i})`);
    }
    return 'body > ' + parts.join(' > ');
  };

  function init() {
    if (window.SSOT_MANUAL) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    const ui = document.createElement('div');
    ui.className = 'cm-ui';
    ui.innerHTML = `
      <button class="cm-fab" type="button" aria-pressed="false" aria-keyshortcuts="C">${ICON('message-square-plus')}<span>Comentar</span><kbd>C</kbd></button>
      <div class="cm-bar" role="status"><span>Modo comentario · Haz clic en lo que quieras comentar · <kbd>Esc</kbd> o <kbd>C</kbd> para salir</span><button type="button" class="cm-exit">Salir</button></div>
      <div class="cm-hl" aria-hidden="true"></div>
      <div class="cm-pins"></div>
      <form class="cm-card cm-pop" role="dialog" aria-modal="true" aria-labelledby="cm-title" novalidate>
        <h2 id="cm-title">Nuevo comentario</h2>
        <p class="cm-ctx"></p>
        <label for="cm-text">Tu comentario</label>
        <textarea id="cm-text" placeholder="Qué cambiarías y por qué"></textarea>
        <p class="cm-hint">Se abre GitHub con todo relleno. Solo tienes que pulsar «Create». Necesitas haber <a href="${LOGIN}" target="_blank" rel="noopener">iniciado sesión en GitHub</a>.</p>
        <div class="cm-actions">
          <button type="button" class="cm-ghost cm-cancel">Cancelar</button>
          <button type="submit" class="cm-primary cm-send" disabled>${ICON('external-link')}Abrir en GitHub</button>
        </div>
      </form>
      <div class="cm-card cm-note" role="dialog" aria-labelledby="cm-note-title">
        <h2 id="cm-note-title"></h2>
        <p class="cm-ctx"></p>
        <p class="cm-quote"></p>
        <div class="cm-actions">
          <button type="button" class="cm-ghost cm-remove">Quitar marca</button>
          <a class="cm-primary cm-gh" target="_blank" rel="noopener">${ICON('external-link')}Ver en GitHub</a>
        </div>
      </div>
      <div class="cm-card cm-login" role="dialog" aria-labelledby="cm-login-title">
        <h2 id="cm-login-title">Antes de comentar</h2>
        <p>Para comentar necesitas iniciar sesión en GitHub con tu cuenta. Si no lo haces, GitHub mostrará «Page not found» al enviar.</p>
        <div class="cm-actions">
          <button type="button" class="cm-ghost cm-login-ok">Ya he iniciado sesión</button>
          <a class="cm-primary cm-login-go" href="${LOGIN}" target="_blank" rel="noopener">${ICON('log-in')}Iniciar sesión en GitHub</a>
        </div>
      </div>
      <div class="cm-toast" role="status" aria-live="polite"></div>`;
    document.body.appendChild(ui);
    icons();

    const $ = s => ui.querySelector(s);
    const fab = $('.cm-fab'), hl = $('.cm-hl'), pins = $('.cm-pins'), pop = $('.cm-pop'), note = $('.cm-note'),
      ta = $('#cm-text'), send = $('.cm-send'), toast = $('.cm-toast');
    let on = false, picked = null, openId = null, toastT, draft = null;

    // The element a reviewer means: the nearest meaningful thing, not a stray <span>
    const MEANINGFUL = 'button, a, input, textarea, select, [role="button"], [role="tab"], h1, h2, h3, h4, li, tr, th, td, label, p, figure, section, article, aside, [class*="card"]';
    const targetOf = el => el.closest(MEANINGFUL) || el;
    const describe = el => {
      const tag = el.tagName.toLowerCase();
      const kind = { button: 'botón', a: 'enlace', input: 'campo', textarea: 'campo de texto', select: 'selector', h1: 'título', h2: 'título', h3: 'título', h4: 'título',
        li: 'elemento de lista', tr: 'fila', th: 'cabecera', td: 'celda', label: 'etiqueta', p: 'texto', section: 'sección', article: 'tarjeta', aside: 'panel', figure: 'gráfico' }[tag] || 'bloque';
      let txt = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.innerText || '';
      txt = txt.replace(/\s+/g, ' ').trim();
      if (txt.length > 80) txt = txt.slice(0, 77) + '…';
      return txt ? `${kind} «${txt}»` : kind;
    };
    // Cards open beside the mark (tip at x, y), never on top of it: right if it fits, otherwise left
    const place = (card, x, y) => {
      card.style.display = 'block';
      const w = 360, h = card.offsetHeight, m = 16;
      const left = x + 40 + w + m <= innerWidth ? x + 40 : Math.max(x - w - 8, m);
      card.style.left = left + 'px';
      card.style.top = Math.min(Math.max(y - 32, m), innerHeight - h - 88) + 'px';   // 88: clear of the button and bar at the bottom
    };
    const showToast = (html, ms) => {
      clearTimeout(toastT); toast.innerHTML = html; icons(); toast.classList.add('is-on');
      toastT = setTimeout(() => toast.classList.remove('is-on'), ms);
    };

    // ---- Marks ----
    const pointOf = m => {
      const el = document.querySelector(m.path);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;                     // element hidden in this view
      return { x: r.left + m.fx * r.width, y: r.top + m.fy * r.height };
    };
    const render = () => {
      const list = load();
      const all = draft ? [...list, draft] : list;
      pins.innerHTML = all.map(m => `<button type="button" class="cm-pin${m === draft ? ' is-draft' : ''}" data-id="${m.id}"
        aria-label="Comentario ${m.n}${m === draft ? ' (sin enviar)' : ''}" aria-expanded="${openId === m.id}">${m.n}</button>`).join('');
      position();
    };
    const position = () => {
      if (!on) return;
      const all = draft ? [...load(), draft] : load();
      pins.querySelectorAll('.cm-pin').forEach(b => {
        const m = all.find(x => x.id === b.dataset.id), p = m && pointOf(m);
        b.style.display = p ? 'grid' : 'none';
        if (p) { b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; }
      });
    };
    let raf; const reflow = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(position); };
    addEventListener('scroll', reflow, true); addEventListener('resize', reflow);

    const ghLink = m => `https://github.com/${REPO}/issues?` + new URLSearchParams({ q: `is:issue in:title "${m.title}"` });
    const openNote = (m, b) => {
      const r = b.getBoundingClientRect();          // measure before render() replaces the pin
      closePop(); openId = m.id; render();
      note.querySelector('h2').textContent = `Comentario ${m.n}`;
      note.querySelector('.cm-ctx').innerHTML = `<strong>${esc(new Date(m.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</strong><br>${esc(m.what)}`;
      note.querySelector('.cm-quote').textContent = m.text;
      note.querySelector('.cm-gh').href = ghLink(m);
      place(note, r.left, r.bottom);
    };
    const closeNote = () => { note.style.display = 'none'; if (openId) { openId = null; render(); } };

    pins.addEventListener('click', e => {
      const b = e.target.closest('.cm-pin'); if (!b) return;
      const m = load().find(x => x.id === b.dataset.id); if (!m) return;
      openId === m.id ? closeNote() : openNote(m, b);
    });
    $('.cm-remove').addEventListener('click', () => {
      const list = load(), i = list.findIndex(x => x.id === openId); if (i < 0) return;
      const [gone] = list.splice(i, 1); save(list); closeNote();
      showToast(`${ICON('trash-2')}<span>Marca ${gone.n} quitada. El comentario sigue en GitHub. <button type="button" class="cm-undo">Deshacer</button></span>`, 6000);
      toast.querySelector('.cm-undo').addEventListener('click', () => {
        const l = load(); l.splice(i, 0, gone); save(l); render(); toast.classList.remove('is-on');
      });
    });

    // ---- Mode ----
    // Sign-in reminder: shown the first time comment mode is turned on in this browser
    const login = $('.cm-login'), SEEN = 'ssot-comentarios:login-visto';
    const seen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch (e) { return false; } };
    const closeLogin = () => { login.style.display = 'none'; try { localStorage.setItem(SEEN, '1'); } catch (e) {} };
    $('.cm-login-ok').addEventListener('click', closeLogin);
    $('.cm-login-go').addEventListener('click', closeLogin);

    const setMode = v => {
      on = v; document.documentElement.classList.toggle('cm-on', v);
      fab.setAttribute('aria-pressed', String(v));
      fab.querySelector('span').textContent = v ? 'Salir de comentarios' : 'Comentar';
      if (v) { render(); if (!seen()) login.style.display = 'block'; }
      else { hl.style.display = 'none'; closePop(); closeNote(); login.style.display = 'none'; }
    };
    const closePop = () => { pop.style.display = 'none'; ta.value = ''; send.disabled = true; picked = null; if (draft) { draft = null; render(); } };
    const box = el => { const r = el.getBoundingClientRect(); Object.assign(hl.style, { display: 'block', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' }); };

    fab.addEventListener('click', () => setMode(!on));
    $('.cm-exit').addEventListener('click', () => setMode(false));
    $('.cm-cancel').addEventListener('click', closePop);
    ta.addEventListener('input', () => { send.disabled = !ta.value.trim(); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !send.disabled) pop.requestSubmit(); });

    document.addEventListener('mousemove', e => {
      if (!on || pop.style.display === 'block' || ui.contains(e.target)) { if (on && ui.contains(e.target)) hl.style.display = 'none'; return; }
      box(targetOf(e.target));
    });
    // Capture phase: in comment mode a click never reaches the prototype (no navigation, no state change)
    document.addEventListener('click', e => {
      if (!on || ui.contains(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      closeNote();
      const el = targetOf(e.target), r = el.getBoundingClientRect();
      const list = load();
      picked = { el, what: describe(el), x: Math.round(e.clientX), y: Math.round(e.clientY + scrollY) };
      draft = { id: 'd' + Date.now(), n: list.reduce((a, m) => Math.max(a, m.n), 0) + 1, path: pathOf(el),
        fx: r.width ? (e.clientX - r.left) / r.width : 0, fy: r.height ? (e.clientY - r.top) / r.height : 0 };
      render(); box(el);
      pop.querySelector('.cm-ctx').innerHTML = `<strong>${esc(persona)} · ${esc(screen)}</strong>${state ? ` (${esc(state)})` : ''}<br>${esc(picked.what)}`;
      place(pop, e.clientX, e.clientY);
      ta.focus();
    }, true);

    // Keyboard: C toggles (as in Figma) unless typing; Esc closes the open card first, then the mode
    const typing = t => t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
    document.addEventListener('keydown', e => {
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) { e.preventDefault(); setMode(!on); return; }
      if (e.key !== 'Escape' || !on) return;
      if (pop.style.display === 'block') closePop(); else if (note.style.display === 'block') closeNote(); else setMode(false);
    });

    pop.addEventListener('submit', e => {
      e.preventDefault();
      const text = ta.value.trim(); if (!text || !picked || !draft) return;
      const short = text.length > 60 ? text.slice(0, 57) + '…' : text;
      const title = `[${persona} · ${screen}] ${short}`;
      const where = /^https?:/.test(location.protocol) ? `**Enlace:** ${location.origin}${location.pathname}${state ? '?' + state : ''}` : '';
      const body = [
        `**Pantalla:** ${persona} · ${screen} (\`${file}\`)`,
        `**Estado:** ${state ? '`?' + state + '`' : 'inicial'}`,
        `**Elemento:** ${picked.what}`, where, '', '**Comentario:**', text, '', '---',
        `<sub>Enviado desde Modo comentario · marca ${draft.n} · clic en ${picked.x}, ${picked.y} px · ventana ${innerWidth}×${innerHeight}</sub>`,
      ].filter((l, i) => l !== '' || i > 3).join('\n');
      const url = `https://github.com/${REPO}/issues/new?` + new URLSearchParams({ title, body, labels: `${LABEL},${slug(persona)}` });

      // Keep the mark: the draft becomes a saved comment
      const list = load(); list.push({ ...draft, id: 'c' + Date.now(), text, title, what: picked.what, at: Date.now() }); save(list);
      draft = null;
      // No 'noopener' feature: with it, window.open always returns null and we couldn't tell a blocked tab
      const w = window.open(url, '_blank'); if (w) w.opener = null;
      closePop(); hl.style.display = 'none'; render();
      showToast(w === null
        ? `${ICON('triangle-alert')}<span>El navegador ha bloqueado la pestaña nueva. <a href="${url}" target="_blank" rel="noopener">Abre GitHub aquí</a> para enviar tu comentario.</span>`
        : `${ICON('circle-check')}<span>GitHub se ha abierto en otra pestaña. Pulsa «Create» allí para enviar tu comentario. ¿Ves «Page not found»? <a href="${loginTo(url)}" target="_blank" rel="noopener">Inicia sesión en GitHub</a> y volverás a tu comentario.</span>`, w === null ? 12000 : 10000);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
