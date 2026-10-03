// Shared for Carlos's pages: sidebar, toast, icons.
(function () {
  const page = document.body.dataset.page;
  const alerts = document.body.dataset.alerts || '2';
  const items = [
    ['trust', 'carlos.html', 'shield-check', 'Trust Center'],
    ['alertas', 'carlos-secuencia.html', 'bell-ring', 'Alertas', alerts],
    ['audit', 'carlos-audit.html', 'file-search', 'Audit Explorer'],
    ['accesos', '', 'key-round', 'Accesos y permisos'],
    ['cumplimiento', '', 'clipboard-check', 'Cumplimiento'],
    ['informes', 'carlos-informe.html', 'file-text', 'Informes de auditoría'],
  ];
  document.getElementById('nav').innerHTML = `
    <div class="nav__brand"><img src="assets/logo-blue-horizontal.png" alt="Telefónica"><span class="nav__product">SSoT</span></div>
    <ul class="nav__list">${items.map(([k, href, icon, label, badge]) => `
      <li><a class="nav__link" ${href ? `href="${href}"` : 'href="#" data-soon'} ${k === page ? 'aria-current="page"' : ''}><i data-lucide="${icon}"></i>${label}${badge && badge !== '0' ? `<span class="nav__badge num" id="nav-badge">${badge}</span>` : ''}</a></li>`).join('')}
    </ul>
    <div class="nav__foot">
      <a class="nav__link" href="#" data-soon><i data-lucide="circle-help"></i>Ayuda</a>
      <div class="nav__me"><span class="avatar av-4" aria-hidden="true">CR</span><div><strong>Carlos Ruiz</strong><small>Governance & Compliance</small></div></div>
      <div class="role"><i data-lucide="repeat"></i>Ver como: <a href="index.html">María</a> · <a href="javier.html">Javier</a> · <a href="laura.html">Laura</a></div>
    </div>`;

  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status');
  toast.innerHTML = '<i data-lucide="info" style="width:16px;height:16px"></i><span></span>';
  document.body.appendChild(toast);
  let t;
  window.showToast = msg => { toast.querySelector('span').textContent = msg; toast.classList.add('is-on'); clearTimeout(t); t = setTimeout(() => toast.classList.remove('is-on'), 2600); };
  window.draw = () => window.lucide && lucide.createIcons();
  window.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-soon]');
    if (el) { e.preventDefault(); showToast(el.dataset.soon || 'Esta pantalla llegará en la siguiente fase del prototipo'); }
  });
  document.addEventListener('DOMContentLoaded', draw);
})();
