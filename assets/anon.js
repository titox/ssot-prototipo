// Anonymous mode for demos: removes the client's logo and name from every page.
// Turn on with ?anon=1 on any page; it stays on while you navigate (this tab only). ?anon=0 turns it off.
// Loaded in <head> so text is rewritten as the page is parsed, before it is painted.
(function () {
  const p = new URLSearchParams(location.search).get('anon');
  let on = p === '1';
  try {
    if (p === '1') sessionStorage.setItem('ssot-anon', '1');
    if (p === '0') sessionStorage.removeItem('ssot-anon');
    on = on || (p !== '0' && sessionStorage.getItem('ssot-anon') === '1');
  } catch (e) {}
  if (!on) return;
  window.SSOT_ANON = true;

  const st = document.createElement('style');
  st.textContent = 'img[src*="logo-"] { display: none !important; } .nav__product { padding-left: 0 !important; border-left: 0 !important; font-size: 16px !important; }';
  document.head.appendChild(st);

  const RULES = [
    [/Telef[oó]nica, S\.A\.\s*·\s*/g, ''],
    [/Distrito Telef[oó]nica/g, 'sede central'],
    [/la marca Telef[oó]nica/g, 'nuestra marca'],
    [/(Resultados T[0-9](?: [0-9]{4})?) · Telef[oó]nica/g, '$1 · Grupo'],
    [/Movistar mantiene/g, 'Nuestra marca comercial mantiene'],
  ];
  // A text that is only a brand name (e.g. a metadata menu option)
  const WHOLE = { 'Telefónica': 'Marca corporativa', 'Movistar': 'Marca comercial', 'O2': 'Marca Europa', 'Vivo': 'Marca Brasil' };
  const fix = t => {
    const k = t.trim();
    if (WHOLE[k]) return t.replace(k, WHOLE[k]);
    if (!/Telef[oó]nica|Movistar|\bO2\b|\bVivo\b/.test(t)) return t;
    for (const [re, to] of RULES) t = t.replace(re, to);
    // Any other mention: "la compañía", capitalised at the start of a sentence
    return t.replace(/Telef[oó]nica/g, (m, at, all) => (/(^|[.!?«"\n])\s*$/.test(all.slice(0, at)) ? 'La compañía' : 'la compañía'));
  };
  // Never touch code: rewriting <script> text before it runs would change the page's data
  const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  const fixNode = n => {
    if (!n.parentNode || SKIP[n.parentNode.nodeName]) return;
    const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
  };
  const walk = root => {
    if (root.nodeType === 3) return fixNode(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) fixNode(n);
  };
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'characterData') fixNode(m.target);
    else m.addedNodes.forEach(a => (a.nodeType === 1 || a.nodeType === 3) && walk(a));
  })).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', () => walk(document.body));
})();
