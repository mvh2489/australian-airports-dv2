/* Page entry point. The separate .vg.json files remain readable and editable. */
(() => {
  'use strict';
  const charts = [
    ['airport-map', '01-airport-map'], ['airport-ranking', '02-airport-ranking'],
    ['national-trend', '03-national-trend'], ['recovery-heatmap', '04-recovery-heatmap'],
    ['recovery-dumbbell', '05-recovery-dumbbell'], ['state-choropleth', '06-state-choropleth'],
    ['state-waterfall', '07-state-waterfall'], ['route-flow-map', '08-route-flow-map'],
    ['route-matrix', '09-route-matrix'], ['aircraft-scatter', '10-aircraft-scatter'],
    ['seat-utilisation', '11-seat-utilisation'], ['airport-treemap', '12-airport-treemap'],
    ['airport-bump', '13-airport-bump']
  ];
  const cache = new Map();
  async function loadJSON(url) {
    if (window.__AIRPORT_BUNDLE__ && Object.hasOwn(window.__AIRPORT_BUNDLE__, url)) {
      return structuredClone(window.__AIRPORT_BUNDLE__[url]);
    }
    if (!cache.has(url)) {
      cache.set(url, fetch(url).then(response => {
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
        return response.json();
      }));
    }
    return structuredClone(await cache.get(url));
  }
  async function hydrate(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      await Promise.all(node.map(hydrate));
      return;
    }
    if (node.data && !Array.isArray(node.data) && node.data.url) {
      const data = await loadJSON(node.data.url);
      const property = node.data.format?.property;
      node.data.values = property ? data[property] : data;
      delete node.data.url;
      delete node.data.format;
    }
    // Vega uses a list of named data sources rather than one data object.
    if (node.$schema?.includes('/vega/v5.json') && Array.isArray(node.data)) {
      await Promise.all(node.data.filter(item => item.url).map(async item => {
        item.values = await loadJSON(item.url);
        delete item.url;
      }));
    }
    await Promise.all(Object.values(node).filter(value => value && typeof value === 'object').map(hydrate));
  }
  function dimensions(container, name) {
    const width = Math.max(230, Math.floor(container.clientWidth));
    const isMap = /airport-map|flow-map|choropleth/.test(name);
    return {width, height:isMap ? Math.max(320, Math.min(550, Math.round(width * 0.70))) : null};
  }
  async function draw([id, name]) {
    const container = document.getElementById(id);
    container.innerHTML = '<p class="vis-loading">Loading the chart…</p>';
    try {
      if (typeof vegaEmbed !== 'function') throw new Error('The local Vega libraries did not load. Check that vendor/ was uploaded.');
      const spec = await loadJSON(`js/${name}.vg.json`);
      await hydrate(spec);
      const {width, height} = dimensions(container, name);
      spec.width = width;
      if (height) spec.height = height;
      container.innerHTML = '';
      const result = await vegaEmbed(container, spec, {actions:false, renderer:'svg', tooltip:true});
      let lastWidth = width;
      const observer = new ResizeObserver(() => {
        const next = dimensions(container, name);
        if (Math.abs(lastWidth - next.width) < 2) return;
        lastWidth = next.width;
        result.view.width(next.width);
        if (next.height) result.view.height(next.height);
        result.view.resize().runAsync().catch(console.error);
      });
      observer.observe(container);
    } catch (error) {
      console.error(`Chart ${name} failed:`, error);
      container.textContent = '';
      const message = document.createElement('div');
      message.className = 'chart-error';
      message.textContent = 'This chart could not load.';
      const detail = document.createElement('small');
      detail.textContent = `${error.message} If opening index.html directly, use the standalone preview or a local web server. On GitHub Pages, check that data/, js/ and vendor/ are present.`;
      message.appendChild(detail);
      container.appendChild(message);
    }
  }
  window.__AIRPORT_READY__ = Promise.all(charts.map(draw));
  // Chapter links remain ordinary anchors; no story section is hidden or swapped.
  const chapterLinks = [...document.querySelectorAll('.chapter-nav a')];
  const chapters = [...document.querySelectorAll('section.chapter')];
  function activateChapter(id) {
    chapterLinks.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  chapterLinks.forEach(link => link.addEventListener('click', () => activateChapter(link.hash.slice(1))));
  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top);
      if (visible.length) activateChapter(visible[0].target.id);
    }, {rootMargin:'-15% 0px -55% 0px', threshold:0});
    chapters.forEach(chapter => chapterObserver.observe(chapter));
  }
  activateChapter(location.hash.slice(1) || 'network');
})();
