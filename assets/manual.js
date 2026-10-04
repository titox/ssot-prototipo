// Manual recording mode: covers between personas while you click through the prototype yourself.
// Turn on with ?manual=1 on any page; it stays on while you navigate (this tab only). ?manual=0 turns it off.
//   Intro cover → click → persona cover → click → persona Home.
//   «Ver como» in the sidebar shows the chosen persona's cover first.
//   From any Carlos screen, «Ver como» opens the closing cover.
(function () {
  const p = new URLSearchParams(location.search).get('manual');
  let on = p === '1';
  try {
    if (p === '1') sessionStorage.setItem('ssot-manual', '1');
    if (p === '0') sessionStorage.removeItem('ssot-manual');
    on = on || (p !== '0' && sessionStorage.getItem('ssot-manual') === '1');
  } catch (e) {}
  if (!on) return;
  window.SSOT_MANUAL = true;

  const HOME = { maria: 'index.html', javier: 'javier.html', laura: 'laura.html', carlos: 'carlos.html' };
  const personaOf = href => {
    const f = (href.split('/').pop() || '').split('?')[0];
    return Object.keys(HOME).find(k => HOME[k] === f) || null;
  };
  window.SSOT_HOME = HOME;

  document.addEventListener('click', e => {
    const a = e.target.closest('.role a');
    if (!a) return;
    const to = personaOf(a.getAttribute('href') || '');
    if (!to) return;
    e.preventDefault();
    const onCarlos = /\/carlos[^/]*\.html$/.test(location.pathname);
    location.href = onCarlos ? 'demo.html?fin=1' : 'demo.html?p=' + to;
  }, true);
})();
