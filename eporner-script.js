const perPage = 20;
const relatedCount = 6;
const baseApi = 'https://www.eporner.com/api/v2/video/search/';
const proxies = [
  'https://api.codetabs.com/v1/proxy?quest=',  // yang ini masih paling stabil
  'https://corsfix.com/?',                     // free & cepat untuk dev
  'https://corsproxy.io/?',                    // masih jalan, no limit ketat
  'https://api.cors.lol/?url=',                // cadangan
  'https://proxy.cors.sh/'                     // reliable (kadang butuh key gratis, tapi bisa tanpa dulu)
];
let proxyIndex = 0;
let currentPage = 1;
let currentQuery = '';
let totalPages = 1;

function getProxiedUrl(url) {
  //return proxies[proxyIndex] + encodeURIComponent(url);
  return url;
}

function fetchVideos(page = 1, query = '') {
  const params = new URLSearchParams({
    query: query || 'all',
    per_page: perPage,
    page: page,
    thumbsize: 'medium',
    order: 'latest',
    format: 'json'
  });
  let url = getProxiedUrl(baseApi + '?' + params);

  fetch(url)
    .then(r => { if (!r.ok) throw ''; return r.json(); })
    .then(data => {
      const grid = document.getElementById('video-grid');
      grid.innerHTML = '';
      document.getElementById('video-detail').style.display = 'none';
      grid.style.display = 'grid';

      if (data.videos && data.videos.length > 0) {
        data.videos.forEach(video => {
          createCard(video, grid);
        });
        totalPages = data.total_pages || 1;
        currentPage = page;
        renderPagination();
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;">Tidak ada video ditemukan.</div>';
      }
    })
    .catch(() => {
      proxyIndex++;
      if (proxyIndex < proxies.length) fetchVideos(page, query);
      else { alert('Gagal load. Coba refresh.'); proxyIndex = 0; }
    });
}

function createCard(v, c) {
  const e = `https://www.eporner.com/embed/${v.id}/`;
  const t = v.title || 'No Title';
  const d = v.length_min || '??:??';
  const w = v.views ? v.views.toLocaleString() : '0';

  const card = document.createElement('div');
  card.className = 'video-card';
  card.innerHTML = `
    <div class='player-wrapper'>
      <iframe src='${e}' frameborder='0' allowfullscreen='allowfullscreen' scrolling='no'></iframe>
    </div>
    <div class='info'><h3>${t}</h3><p>⏱ ${d} • 👀 ${w} views</p></div>
  `;
  card.onclick = () => showDetail(v.id, t, d, w, e, v.keywords || '');
  c.appendChild(card);
}

function showDetail(id, t, d, w, e, k = '') {
  document.getElementById('video-grid').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';
  document.getElementById('video-detail').style.display = 'block';
  document.getElementById('main-iframe').src = e;
  document.getElementById('main-title').textContent = t;
  document.getElementById('main-meta').textContent = `⏱ ${d} • 👀 ${w} views`;
  window.scrollTo({top: 0, behavior: 'smooth'});
  loadRelated(k, t, id);
}

function loadRelated(k, t, id) {
  const g = document.getElementById('related-grid');
  g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;">Loading video serupa...</div>';

  const bad = ['hd','sex','porn','video','full','hot','sexy','fuck','fucking','hardcore','4k','1080p'];
  let words = k ? k.split(',').map(x=>x.trim()).filter(x=>x&&!bad.includes(x.toLowerCase())).slice(0,4) : [];
  if (words.length < 2) words = t.split(' ').filter(x=>x.length>3&&!bad.includes(x.toLowerCase())).slice(0,4);
  const q = words.join(' ') || t.split(' ').slice(0,3).join(' ');

  const p = new URLSearchParams({query:q,per_page:relatedCount+10,page:1,thumbsize:'medium',order:'latest',format:'json'});
  fetch(getProxiedUrl(baseApi+'?'+p))
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      g.innerHTML = ''; let added = 0;
      data.videos.forEach(v => {
        if (v.id !== id && added < relatedCount && words.some(w => v.title.toLowerCase().includes(w.toLowerCase()))) {
          createCard(v, g); added++;
        }
      });
      if (added < relatedCount) data.videos.forEach(v => { if (v.id !== id && added < relatedCount) { createCard(v, g); added++; } });
      if (added === 0) g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;">Tidak ada video serupa.</div>';
    })
    .catch(() => { proxyIndex++; if (proxyIndex < proxies.length) loadRelated(k, t, id); else proxyIndex = 0; });
}

function backToGrid() {
  document.getElementById('video-detail').style.display = 'none';
  document.getElementById('video-grid').style.display = 'grid';
  fetchVideos(currentPage, currentQuery);
}

function renderPagination() {
  const p = document.getElementById('pagination'); p.innerHTML = '';
  const prev = document.createElement('a'); prev.textContent = '←'; prev.className = currentPage === 1 ? 'disabled' : ''; prev.onclick = () => { if (currentPage > 1) goToPage(currentPage - 1); }; p.appendChild(prev);
  const show = 4; let start = Math.max(1, currentPage - Math.floor(show/2)); let end = Math.min(totalPages, start + show - 1);
  if (end - start + 1 < show) start = Math.max(1, end - show + 1);
  for (let i = start; i <= end; i++) {
    const n = document.createElement(i === currentPage ? 'span' : 'a'); n.textContent = i;
    if (i === currentPage) n.className = 'current'; else n.onclick = () => goToPage(i);
    p.appendChild(n);
  }
  const next = document.createElement('a'); next.textContent = '→'; next.className = currentPage >= totalPages ? 'disabled' : ''; next.onclick = () => { if (currentPage < totalPages) goToPage(currentPage + 1); }; p.appendChild(next);
}

function goToPage(page) { currentPage = page; fetchVideos(page, currentQuery); window.scrollTo({top:0,behavior:'smooth'}); }

function loadCategory(cat) { currentQuery = cat; currentPage = 1; fetchVideos(1, cat); toggleMenu(); }

function performSearch() { const i = document.getElementById('search-input'); const q = i.value.trim(); if (q) { loadCategory(q); i.value = ''; } }

document.getElementById('search-input').addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });

function toggleMenu() { document.getElementById('nav-menu').classList.toggle('active'); }

window.onload = () => fetchVideos(1, '');
