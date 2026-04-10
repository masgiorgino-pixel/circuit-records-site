(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'home',
    'releases.html': 'releases',
    'release-circuit-01.html': 'releases',
    'artists.html': 'artists',
    'artist-sbume.html': 'artists',
    'shop.html': 'shop',
    'links.html': 'links'
  };
  const active = map[path] || 'home';
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.nav === active) a.classList.add('active');
  });
})();
