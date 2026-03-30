/* ============================================================
   DATA-MANAGER.JS -- Shared data layer for Tinaht
   Admin uses localStorage for editing; public pages fetch
   data/content.json so every browser sees the same content.
   ============================================================ */
(function () {
  'use strict';

  var KEYS = {
    blogs: 'tinaht_blogs',
    testimonials: 'tinaht_testimonials',
    team: 'tinaht_team',
    portfolio: 'tinaht_portfolio'
  };

  var CATEGORIES = {
    'ai-automation': 'AI & Automation',
    'hosting-devops': 'Hosting & DevOps',
    'cybersecurity': 'Cybersecurity',
    'web-performance': 'Web Performance',
    'industry-news': 'Industry News',
    'networking': 'Networking'
  };

  // ── Published data cache (populated by fetchPublished) ────
  var _published = null;   // will hold { blogs, testimonials, team }

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ── localStorage helpers (used by admin) ──────────────────

  function getAll(type) {
    var key = KEYS[type];
    if (!key) return null;
    var raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function save(type, items) {
    var key = KEYS[type];
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(items));
  }

  function add(type, item) {
    var items = getAll(type) || [];
    if (!item.id) item.id = generateId();
    items.push(item);
    save(type, items);
    return item;
  }

  function update(type, id, updatedItem) {
    var items = getAll(type) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        updatedItem.id = id;
        items[i] = updatedItem;
        break;
      }
    }
    save(type, items);
  }

  function remove(type, id) {
    var items = getAll(type) || [];
    items = items.filter(function (item) { return item.id !== id; });
    save(type, items);
  }

  function getById(type, id) {
    var items = getAll(type) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function exportAll() {
    return JSON.stringify({
      blogs: getAll('blogs') || [],
      testimonials: getAll('testimonials') || [],
      team: getAll('team') || [],
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  function importAll(jsonString) {
    var data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }
    if (data.blogs && Array.isArray(data.blogs)) {
      save('blogs', data.blogs);
    }
    if (data.testimonials && Array.isArray(data.testimonials)) {
      save('testimonials', data.testimonials);
    }
    if (data.team && Array.isArray(data.team)) {
      save('team', data.team);
    }
  }

  function clearAll() {
    Object.values(KEYS).forEach(function (key) {
      localStorage.removeItem(key);
    });
  }

  // ── Published-data fetcher (used by public pages) ─────────
  // Fetches data/content.json once, caches in memory.
  // Returns a Promise that resolves with { blogs, testimonials, team }.

  function fetchPublished() {
    if (_published) {
      return Promise.resolve(_published);
    }

    // Determine the correct relative path based on page location
    var basePath = '';
    if (window.location.pathname.indexOf('/blog') !== -1 ||
        window.location.pathname.indexOf('/about') !== -1 ||
        window.location.pathname.indexOf('/admin') !== -1 ||
        window.location.pathname.indexOf('/contact') !== -1) {
      basePath = '../';
    }

    var url = basePath + 'data/content.json?v=' + Date.now();

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to fetch content.json');
        return res.json();
      })
      .then(function (data) {
        _published = data;
        return data;
      })
      .catch(function () {
        // If fetch fails, return null — pages keep hardcoded HTML
        return null;
      });
  }

  // Helper: get a specific content type from published data (sync, after fetch)
  function getPublished(type) {
    if (!_published) return null;
    return _published[type] || null;
  }

  // ── Projects payload (data/projects.json) ─────────────────
  function buildProjectsPayload() {
    return JSON.stringify(getAll('portfolio') || [], null, 2);
  }

  function fetchPublishedProjects() {
    var basePath = '';
    if (window.location.pathname.indexOf('/admin') !== -1) basePath = '../';
    var url = basePath + 'data/projects.json?v=' + Date.now();
    return fetch(url)
      .then(function (res) { if (!res.ok) throw new Error('Failed to fetch projects.json'); return res.json(); })
      .catch(function () { return null; });
  }

  // ── Blog body storage (per-post, not in content.json) ────
  var BLOG_BODY_PREFIX = 'tinaht_blog_body_';

  function getBlogBody(id) {
    return localStorage.getItem(BLOG_BODY_PREFIX + id) || '';
  }

  function saveBlogBody(id, html) {
    if (html) {
      localStorage.setItem(BLOG_BODY_PREFIX + id, html);
    } else {
      localStorage.removeItem(BLOG_BODY_PREFIX + id);
    }
  }

  function removeBlogBody(id) {
    localStorage.removeItem(BLOG_BODY_PREFIX + id);
  }

  // ── Build JSON for publishing to GitHub ───────────────────
  function buildPublishPayload() {
    // Strip bodyHtml from blog posts — body is pushed as separate HTML files
    var blogs = (getAll('blogs') || []).map(function(b) {
      var clean = Object.assign({}, b);
      delete clean.bodyHtml;
      return clean;
    });
    return JSON.stringify({
      blogs: blogs,
      testimonials: getAll('testimonials') || [],
      team: getAll('team') || [],
      publishedAt: new Date().toISOString()
    }, null, 2);
  }

  window.TinahtData = {
    CATEGORIES: CATEGORIES,
    getAll: getAll,
    save: save,
    add: add,
    update: update,
    remove: remove,
    getById: getById,
    exportAll: exportAll,
    importAll: importAll,
    clearAll: clearAll,
    fetchPublished: fetchPublished,
    getPublished: getPublished,
    buildPublishPayload: buildPublishPayload,
    getBlogBody: getBlogBody,
    saveBlogBody: saveBlogBody,
    removeBlogBody: removeBlogBody,
    buildProjectsPayload: buildProjectsPayload,
    fetchPublishedProjects: fetchPublishedProjects
  };
})();
