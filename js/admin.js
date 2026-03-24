/* ============================================================
   ADMIN.JS -- Admin Panel Logic with GitHub Publish
   ============================================================ */
(function () {
  'use strict';

  // Admin password
  var ADMIN_PASS = 'WfV8fMMeVRcQyzZNHvxo';

  // GitHub config
  var GH_OWNER = 'dnoel82';
  var GH_REPO  = 'tinaht';
  var GH_FILE  = 'data/content.json';
  var GH_BRANCH = 'main';

  var currentTab = 'blogs';
  var editingId = null;
  var deleteId = null;

  // DOM references
  var gate = document.getElementById('admin-gate');
  var gateForm = document.getElementById('gate-form');
  var gatePassword = document.getElementById('gate-password');
  var gateError = document.getElementById('gate-error');
  var adminBody = document.getElementById('admin-body');
  var logoutBtn = document.getElementById('logout-btn');
  var addBtn = document.getElementById('add-btn');
  var seedBtn = document.getElementById('seed-btn');
  var exportBtn = document.getElementById('export-btn');
  var importBtn = document.getElementById('import-btn');
  var importFile = document.getElementById('import-file');
  var clearBtn = document.getElementById('clear-btn');
  var syncBtn = document.getElementById('sync-btn');
  var contentGrid = document.getElementById('admin-content');
  var modal = document.getElementById('admin-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalForm = document.getElementById('modal-form');
  var confirmDialog = document.getElementById('admin-confirm');
  var confirmMessage = document.getElementById('confirm-message');
  var confirmCancel = document.getElementById('confirm-cancel');
  var confirmDelete = document.getElementById('confirm-delete');
  var tabButtons = document.querySelectorAll('.admin-tabs .filter-btn');

  // Publish DOM
  var publishBtn = document.getElementById('publish-btn');
  var publishStatus = document.getElementById('publish-status');
  var githubSetupBtn = document.getElementById('github-setup-btn');
  var githubSetupModal = document.getElementById('github-setup-modal');
  var githubSetupForm = document.getElementById('github-setup-form');

  // ── Utilities ──────────────────────────────────────────────

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast--' + (type || 'success');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function checkPassword(password) {
    return password === ADMIN_PASS;
  }

  function slugify(str) {
    return (str || '').toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/[\s]+/g, '-').replace(/-+/g, '-');
  }

  function generateBlogHTML(post, bodyHtml) {
    var slug = post.slug || slugify(post.title);
    var canonicalUrl = 'https://tinaht.com/blog/' + slug;
    var dateFormatted = formatDate(post.date);
    var categoryLabel = TinahtData.CATEGORIES[post.category] || post.category || '';
    var imageHtml = post.imageUrl
      ? '<img src="' + post.imageUrl + '" alt="' + escapeHTML(post.title) + '" style="width:100%;border-radius:12px;margin-bottom:40px;" loading="eager">'
      : '';
    var breadcrumbTitle = post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title;
    var L = [];
    L.push('<!DOCTYPE html>');
    L.push('<html lang="en">');
    L.push('<head>');
    L.push('  <meta charset="UTF-8">');
    L.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    L.push('  <title>' + escapeHTML(post.title) + ' | Tinaht Blog</title>');
    L.push('  <meta name="description" content="' + escapeHTML(post.description) + '">');
    L.push('  <link rel="icon" type="image/png" href="../../assets/images/logos/favicon-source.png">');
    L.push('  <link rel="preconnect" href="https://fonts.googleapis.com">');
    L.push('  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
    L.push('  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Libre+Franklin:wght@400;500;700&family=Montserrat:wght@500;600;800&family=Roboto+Condensed:wght@400;500&display=swap" rel="stylesheet">');
    L.push('  <link rel="stylesheet" href="../../css/global.css">');
    L.push('  <link rel="stylesheet" href="../../css/components.css">');
    L.push('  <link rel="stylesheet" href="../../css/portfolio.css">');
    L.push('  <link rel="stylesheet" href="../../css/pages.css">');
    L.push('  <meta property="og:title" content="' + escapeHTML(post.title) + '">');
    L.push('  <meta property="og:description" content="' + escapeHTML(post.description) + '">');
    L.push('  <meta property="og:type" content="article">');
    L.push('  <meta property="og:url" content="' + canonicalUrl + '">');
    if (post.imageUrl) L.push('  <meta property="og:image" content="' + escapeHTML(post.imageUrl) + '">');
    L.push('  <meta name="twitter:card" content="summary_large_image">');
    L.push('  <meta name="twitter:title" content="' + escapeHTML(post.title) + '">');
    L.push('  <meta name="twitter:description" content="' + escapeHTML(post.description) + '">');
    L.push('  <script type="application/ld+json">');
    L.push('  {');
    L.push('    "@context": "https://schema.org",');
    L.push('    "@type": "BlogPosting",');
    L.push('    "headline": ' + JSON.stringify(post.title) + ',');
    L.push('    "description": ' + JSON.stringify(post.description) + ',');
    if (post.imageUrl) L.push('    "image": ' + JSON.stringify(post.imageUrl) + ',');
    L.push('    "author": {"@type":"Person","name":' + JSON.stringify(post.author || 'Djonny Noel') + ',"url":"https://tinaht.com/about"},');
    L.push('    "publisher": {"@type":"Organization","name":"Tinaht","logo":{"@type":"ImageObject","url":"https://tinaht.com/assets/images/logos/logo-wordmark.png"}},');
    L.push('    "datePublished": ' + JSON.stringify(post.date || '') + ',');
    L.push('    "dateModified": ' + JSON.stringify(post.date || '') + ',');
    L.push('    "mainEntityOfPage": {"@type":"WebPage","@id":' + JSON.stringify(canonicalUrl) + '},');
    L.push('    "articleSection": ' + JSON.stringify(categoryLabel));
    L.push('  }');
    L.push('  <\/script>');
    L.push('  <script type="application/ld+json">');
    L.push('  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[');
    L.push('    {"@type":"ListItem","position":1,"name":"Home","item":"https://tinaht.com/"},');
    L.push('    {"@type":"ListItem","position":2,"name":"Blog","item":"https://tinaht.com/blog"},');
    L.push('    {"@type":"ListItem","position":3,"name":' + JSON.stringify(post.title) + ',"item":' + JSON.stringify(canonicalUrl) + '}');
    L.push('  ]}');
    L.push('  <\/script>');
    L.push('</head>');
    L.push('<body>');
    L.push('  <a href="#main-content" class="sr-only">Skip to main content</a>');
    L.push('  <header class="site-header" role="banner">');
    L.push('    <div class="container">');
    L.push('      <a href="../../" class="site-logo" aria-label="Tinaht home"><span class="site-logo__text">Tinaht</span></a>');
    L.push('      <nav class="nav-list-desktop" aria-label="Primary navigation">');
    L.push('        <ul class="nav-list">');
    L.push('          <li><a href="../../">Home</a></li>');
    L.push('          <li><a href="../../portfolio">Portfolio</a></li>');
    L.push('          <li><a href="../../services">Services</a></li>');
    L.push('          <li><a href="../../about">About</a></li>');
    L.push('          <li><a href="../../blog" class="active">Blog</a></li>');
    L.push('          <li><a href="../../contact" class="btn btn-primary btn-sm">Contact</a></li>');
    L.push('        </ul>');
    L.push('      </nav>');
    L.push('      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>');
    L.push('    </div>');
    L.push('  </header>');
    L.push('  <div class="drawer-overlay" aria-hidden="true"></div>');
    L.push('  <nav class="mobile-drawer" aria-label="Mobile navigation">');
    L.push('    <ul class="nav-list">');
    L.push('      <li><a href="../../">Home</a></li>');
    L.push('      <li><a href="../../portfolio">Portfolio</a></li>');
    L.push('      <li><a href="../../services">Services</a></li>');
    L.push('      <li><a href="../../about">About</a></li>');
    L.push('      <li><a href="../../blog">Blog</a></li>');
    L.push('      <li><a href="../../contact">Contact</a></li>');
    L.push('    </ul>');
    L.push('  </nav>');
    L.push('  <main id="main-content">');
    L.push('    <section class="page-hero page-hero--article">');
    L.push('      <div class="container">');
    L.push('        <nav class="breadcrumb" aria-label="Breadcrumb">');
    L.push('          <a href="../../">Home</a>');
    L.push('          <span aria-hidden="true">/</span>');
    L.push('          <a href="../../blog">Blog</a>');
    L.push('          <span aria-hidden="true">/</span>');
    L.push('          <span>' + escapeHTML(breadcrumbTitle) + '</span>');
    L.push('        </nav>');
    L.push('        <span class="card__tag" style="margin-bottom:16px;display:inline-block;">' + escapeHTML(categoryLabel) + '</span>');
    L.push('        <h1>' + escapeHTML(post.title) + '</h1>');
    L.push('        <div class="blog-featured__meta" style="margin-top:16px;">');
    L.push('          <span>' + escapeHTML(post.author || 'Djonny Noel') + '</span>');
    L.push('          <span>&bull;</span>');
    L.push('          <span>' + dateFormatted + '</span>');
    if (post.readTime) {
      L.push('          <span>&bull;</span>');
      L.push('          <span>' + escapeHTML(post.readTime) + '</span>');
    }
    L.push('        </div>');
    L.push('      </div>');
    L.push('    </section>');
    L.push('    <section class="section">');
    L.push('      <div class="container">');
    L.push('        <div class="article-layout">');
    L.push('          <article class="article-body">');
    if (imageHtml) L.push('            ' + imageHtml);
    L.push('            ' + (bodyHtml || '<p>' + escapeHTML(post.description) + '</p>'));
    L.push('          </article>');
    L.push('          <aside class="article-sidebar">');
    L.push('            <div style="background:var(--color-gray-900);border-radius:12px;padding:24px;margin-bottom:24px;">');
    L.push('              <h4 style="margin-bottom:16px;">About Tinaht</h4>');
    L.push('              <p style="color:var(--color-gray-400);font-size:14px;line-height:1.6;">We build scalable technology solutions \u2014 AI automation, managed hosting, and network infrastructure \u2014 for startups and growing businesses.</p>');
    L.push('              <a href="../../contact" class="btn btn-primary" style="margin-top:16px;width:100%;text-align:center;display:block;">Work With Us</a>');
    L.push('            </div>');
    L.push('            <div style="background:var(--color-gray-900);border-radius:12px;padding:24px;">');
    L.push('              <h4 style="margin-bottom:12px;">More Articles</h4>');
    L.push('              <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">');
    L.push('                <li><a href="../../blog" style="color:var(--color-gray-400);font-size:14px;">View all blog posts &rarr;</a></li>');
    L.push('              </ul>');
    L.push('            </div>');
    L.push('          </aside>');
    L.push('        </div>');
    L.push('      </div>');
    L.push('    </section>');
    L.push('  </main>');
    L.push('  <footer class="site-footer" role="contentinfo">');
    L.push('    <div class="container">');
    L.push('      <div class="footer-grid">');
    L.push('        <div class="footer-brand">');
    L.push('          <a href="../../" class="site-logo"><span class="site-logo__text">Tinaht</span></a>');
    L.push('          <p>Scalable, secure technology solutions for startups and businesses that demand more.</p>');
    L.push('          <div class="footer-social">');
    L.push('            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>');
    L.push('            <a href="#" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>');
    L.push('          </div>');
    L.push('        </div>');
    L.push('        <div><h4 class="footer-heading">Services</h4><ul class="footer-links"><li><a href="../../services/ai-automation">AI Automation</a></li><li><a href="../../services/managed-hosting">Managed Hosting</a></li><li><a href="../../services/network-consulting">Network Consulting</a></li><li><a href="../../services#cybersecurity">Cybersecurity</a></li><li><a href="../../services#speed-optimization">Speed Optimization</a></li></ul></div>');
    L.push('        <div><h4 class="footer-heading">Company</h4><ul class="footer-links"><li><a href="../../about">About</a></li><li><a href="../../portfolio">Portfolio</a></li><li><a href="../../blog">Blog</a></li><li><a href="../../contact">Contact</a></li></ul></div>');
    L.push('        <div><h4 class="footer-heading">Legal</h4><ul class="footer-links"><li><a href="../../privacy">Privacy Policy</a></li><li><a href="../../terms">Terms of Service</a></li><li><a href="../../refund-policy">Refund Policy</a></li></ul></div>');
    L.push('      </div>');
    L.push('      <div class="footer-bottom"><p>&copy; 2026 Tinaht. All rights reserved.</p><ul class="footer-bottom-links"><li><a href="../../privacy">Privacy</a></li><li><a href="../../terms">Terms</a></li></ul></div>');
    L.push('    </div>');
    L.push('  </footer>');
    L.push('  <script src="../../js/main.js" defer><\/script>');
    L.push('</body>');
    L.push('</html>');
    return L.join('\n');
  }

  function syncFromLive() {
    if (syncBtn) syncBtn.disabled = true;
    TinahtData.fetchPublished().then(function (data) {
      if (syncBtn) syncBtn.disabled = false;
      if (!data || !data.blogs) {
        showToast('Could not fetch live content', 'error');
        return;
      }
      var existing = TinahtData.getAll('blogs') || [];
      var existingMap = {};
      existing.forEach(function (b) { existingMap[b.id] = b; });
      var newPosts = [];
      var patched = 0;
      data.blogs.forEach(function (livePost) {
        if (!existingMap[livePost.id]) {
          existing.push(livePost);
          newPosts.push(livePost);
        } else {
          var local = existingMap[livePost.id];
          var changed = false;
          Object.keys(livePost).forEach(function (key) {
            if (!(key in local)) { local[key] = livePost[key]; changed = true; }
          });
          if (changed) patched++;
        }
      });
      if (newPosts.length === 0 && patched === 0) {
        showToast('Already up to date \u2014 no new posts on live site', 'success');
        return;
      }
      TinahtData.save('blogs', existing);
      var msg = [];
      if (newPosts.length > 0) msg.push(newPosts.length + ' new post(s)');
      if (patched > 0) msg.push(patched + ' post(s) updated');
      showToast('Synced: ' + msg.join(', '), 'success');
      renderList();
    });
  }

  function pushBlogPages(token) {
    var blogs = TinahtData.getAll('blogs') || [];
    var postsWithPages = blogs.filter(function (b) {
      return b.slug && TinahtData.getBlogBody(b.id);
    });
    if (postsWithPages.length === 0) return Promise.resolve(0);

    var pushedCount = 0;
    var chain = Promise.resolve();
    postsWithPages.forEach(function (post) {
      chain = chain.then(function () {
        var bodyHtml = TinahtData.getBlogBody(post.id);
        var htmlContent = generateBlogHTML(post, bodyHtml);
        var filePath = 'blog/' + post.slug + '/index.html';
        var apiUrl = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + filePath;
        return fetch(apiUrl + '?ref=' + GH_BRANCH + '&t=' + Date.now(), {
          headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
        })
        .then(function (res) {
          return res.status === 404 ? { sha: null } : res.json();
        })
        .then(function (fileData) {
          var body = {
            message: 'Publish blog post: ' + post.slug,
            content: btoa(unescape(encodeURIComponent(htmlContent))),
            branch: GH_BRANCH
          };
          if (fileData.sha) body.sha = fileData.sha;
          return fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + token,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
        })
        .then(function (res) {
          if (!res.ok) return res.json().then(function (err) { throw new Error(err.message || 'Failed to push ' + filePath); });
          pushedCount++;
          return res.json();
        });
      });
    });
    return chain.then(function () { return pushedCount; });
  }

  // ── GitHub Token Management ──────────────────────────────

  function getGitHubToken() {
    return localStorage.getItem('tinaht_gh_token') || '';
  }

  function setGitHubToken(token) {
    localStorage.setItem('tinaht_gh_token', token);
  }

  // ── Authentication ─────────────────────────────────────────

  function checkAuth() {
    if (sessionStorage.getItem('tinaht_admin_auth') === 'true') {
      showAdmin();
    }
  }

  function showAdmin() {
    gate.classList.add('is-hidden');
    adminBody.classList.add('is-visible');
    updatePublishStatus();

    // Always merge from live on load — adds missing posts and patches new fields onto existing ones
    TinahtData.fetchPublished().then(function (data) {
      if (data && data.blogs && data.blogs.length > 0) {
        var existing = TinahtData.getAll('blogs') || [];
        var existingMap = {};
        existing.forEach(function (b) { existingMap[b.id] = b; });
        var newPosts = [];
        var patched = 0;
        data.blogs.forEach(function (livePost) {
          if (!existingMap[livePost.id]) {
            existing.push(livePost);
            newPosts.push(livePost);
          } else {
            // Copy any new fields from live (e.g. url, slug) without overwriting local edits
            var local = existingMap[livePost.id];
            var changed = false;
            Object.keys(livePost).forEach(function (key) {
              if (!(key in local)) { local[key] = livePost[key]; changed = true; }
            });
            if (changed) patched++;
          }
        });
        if (newPosts.length > 0 || patched > 0) {
          TinahtData.save('blogs', existing);
          if (newPosts.length > 0) showToast(newPosts.length + ' new post(s) synced from live site', 'success');
        }
        if (!(TinahtData.getAll('testimonials') || []).length && data.testimonials) {
          TinahtData.save('testimonials', data.testimonials);
        }
        if (!(TinahtData.getAll('team') || []).length && data.team) {
          TinahtData.save('team', data.team);
        }
      }
      // Sync portfolio from projects.json if empty
      if (!(TinahtData.getAll('portfolio') || []).length) {
        TinahtData.fetchPublishedProjects().then(function (projects) {
          if (projects && projects.length > 0) {
            TinahtData.save('portfolio', projects);
          }
          renderList();
        });
      } else {
        renderList();
      }
    });
  }

  function logout() {
    sessionStorage.removeItem('tinaht_admin_auth');
    gate.classList.remove('is-hidden');
    adminBody.classList.remove('is-visible');
    gatePassword.value = '';
    gateError.classList.remove('is-visible');
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (checkPassword(gatePassword.value)) {
      sessionStorage.setItem('tinaht_admin_auth', 'true');
      showAdmin();
    } else {
      gateError.classList.add('is-visible');
      gatePassword.value = '';
      gatePassword.focus();
    }
  });

  logoutBtn.addEventListener('click', logout);

  // ── Tab Switching ──────────────────────────────────────────

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      currentTab = btn.getAttribute('data-tab');
      renderList();
    });
  });

  // ── Rendering ──────────────────────────────────────────────

  function renderList() {
    var items = TinahtData.getAll(currentTab) || [];
    if (items.length === 0) {
      var labels = { blogs: 'blog post', portfolio: 'portfolio project', testimonials: 'testimonial', team: 'team member' };
      contentGrid.innerHTML =
        '<div class="admin-empty">' +
        '<div class="admin-empty__icon">+</div>' +
        '<h3>No ' + labels[currentTab] + 's yet</h3>' +
        '<p>Click "Add New" to create your first ' + labels[currentTab] + ', or "Seed Defaults" to load sample data.</p>' +
        '</div>';
      return;
    }

    var html = '';
    if (currentTab === 'blogs') {
      items.forEach(function (item) {
        var hasBody = !!(item.slug && TinahtData.getBlogBody(item.id));
        var hasPage = !!(item.url || item.slug);
        html +=
          '<div class="admin-item">' +
          (item.imageUrl ? '<img src="' + escapeHTML(item.imageUrl) + '" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:12px;">' : '') +
          '<div class="admin-item__header">' +
          '<span class="admin-item__tag">' + escapeHTML(TinahtData.CATEGORIES[item.category] || item.category) + '</span>' +
          (item.featured ? '<span class="admin-item__featured">Featured</span>' : '') +
          (hasBody ? '<span class="admin-item__featured" style="background:var(--color-primary);">Has Page</span>' : (hasPage ? '<span class="admin-item__featured" style="background:var(--color-gray-600);">Has URL</span>' : '')) +
          '</div>' +
          '<h4 class="admin-item__title">' + escapeHTML(item.title) + '</h4>' +
          '<p class="admin-item__text">' + escapeHTML(truncate(item.description, 100)) + '</p>' +
          '<p class="admin-item__meta">' + escapeHTML(item.author) + ' &bull; ' + formatDate(item.date) + (item.readTime ? ' &bull; ' + escapeHTML(item.readTime) : '') + '</p>' +
          (item.url ? '<p class="admin-item__meta" style="margin-top:4px;"><a href="' + escapeHTML(item.url) + '" target="_blank" style="color:var(--color-primary);font-size:13px;">&#128279; ' + escapeHTML(item.url) + '</a></p>' : '') +
          '<div class="admin-item__actions">' +
          '<button class="btn btn-secondary" data-edit="' + item.id + '">Edit</button>' +
          '<button class="btn btn-danger btn-secondary" data-delete="' + item.id + '">Delete</button>' +
          '</div>' +
          '</div>';
      });
    } else if (currentTab === 'testimonials') {
      items.forEach(function (item) {
        html +=
          '<div class="admin-item">' +
          '<div class="admin-item__avatar">' + escapeHTML(item.avatarInitials || '') + '</div>' +
          '<h4 class="admin-item__title">' + escapeHTML(item.authorName) + '</h4>' +
          '<p class="admin-item__text">"' + escapeHTML(truncate(item.quote, 120)) + '"</p>' +
          '<p class="admin-item__meta">' + escapeHTML(item.role) + ', ' + escapeHTML(item.company) + '</p>' +
          '<div class="admin-item__actions">' +
          '<button class="btn btn-secondary" data-edit="' + item.id + '">Edit</button>' +
          '<button class="btn btn-danger btn-secondary" data-delete="' + item.id + '">Delete</button>' +
          '</div>' +
          '</div>';
      });
    } else if (currentTab === 'portfolio') {
      items.forEach(function (item) {
        html +=
          '<div class="admin-item">' +
          '<div class="admin-item__header">' +
          '<span class="admin-item__tag">' + escapeHTML(item.category || '') + '</span>' +
          '</div>' +
          (item.thumbnailUrl ? '<img src="' + escapeHTML(item.thumbnailUrl) + '" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:12px;">' : '') +
          '<h4 class="admin-item__title">' + escapeHTML(item.title) + '</h4>' +
          '<p class="admin-item__text">' + escapeHTML(truncate(item.shortDescription, 100)) + '</p>' +
          '<p class="admin-item__meta">' + escapeHTML(item.clientName || '') + (item.completionDate ? ' &bull; ' + formatDate(item.completionDate) : '') + '</p>' +
          '<div class="admin-item__actions">' +
          '<button class="btn btn-secondary" data-edit="' + escapeHTML(item.slug) + '">Edit</button>' +
          '<button class="btn btn-danger btn-secondary" data-delete="' + escapeHTML(item.slug) + '">Delete</button>' +
          '</div>' +
          '</div>';
      });
    } else if (currentTab === 'team') {
      items.forEach(function (item) {
        html +=
          '<div class="admin-item">' +
          '<div class="admin-item__avatar">' + escapeHTML(item.avatarInitials || '') + '</div>' +
          '<h4 class="admin-item__title">' + escapeHTML(item.name) + '</h4>' +
          '<p class="admin-item__text">' + escapeHTML(truncate(item.bio, 120)) + '</p>' +
          '<p class="admin-item__meta">' + escapeHTML(item.role) + '</p>' +
          '<div class="admin-item__actions">' +
          '<button class="btn btn-secondary" data-edit="' + item.id + '">Edit</button>' +
          '<button class="btn btn-danger btn-secondary" data-delete="' + item.id + '">Delete</button>' +
          '</div>' +
          '</div>';
      });
    }

    contentGrid.innerHTML = html;

    contentGrid.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-edit');
        if (currentTab === 'portfolio') {
          var items = TinahtData.getAll('portfolio') || [];
          openModal(items.find(function (p) { return p.slug === id; }) || null);
        } else {
          openModal(TinahtData.getById(currentTab, id));
        }
      });
    });
    contentGrid.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteId = btn.getAttribute('data-delete');
        var item;
        if (currentTab === 'portfolio') {
          var items = TinahtData.getAll('portfolio') || [];
          item = items.find(function (p) { return p.slug === deleteId; });
        } else {
          item = TinahtData.getById(currentTab, deleteId);
        }
        var name = item ? (item.title || item.authorName || item.name || 'this item') : 'this item';
        confirmMessage.textContent = 'Are you sure you want to delete "' + name + '"? This cannot be undone.';
        confirmDialog.classList.add('is-open');
      });
    });
  }

  // ── Modal Form ─────────────────────────────────────────────

  function openModal(item) {
    editingId = item ? (currentTab === 'portfolio' ? item.slug : item.id) : null;
    modalTitle.textContent = (item ? 'Edit' : 'Add') + ' ' +
      { blogs: 'Blog Post', portfolio: 'Portfolio Project', testimonials: 'Testimonial', team: 'Team Member' }[currentTab];

    var html = '';

    if (currentTab === 'blogs') {
      html =
        '<div class="form-group">' +
        '<label for="f-title">Title *</label>' +
        '<input type="text" id="f-title" class="form-input" required value="' + escapeHTML(item ? item.title : '') + '">' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-category">Category</label>' +
        '<select id="f-category" class="form-input">' +
        Object.keys(TinahtData.CATEGORIES).map(function (key) {
          return '<option value="' + key + '"' + (item && item.category === key ? ' selected' : '') + '>' + TinahtData.CATEGORIES[key] + '</option>';
        }).join('') +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-date">Date</label>' +
        '<input type="date" id="f-date" class="form-input" value="' + (item ? item.date : new Date().toISOString().split('T')[0]) + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-imageUrl">Image URL</label>' +
        '<input type="text" id="f-imageUrl" class="form-input" placeholder="https://images.unsplash.com/..." value="' + escapeHTML(item ? item.imageUrl : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-description">Description *</label>' +
        '<textarea id="f-description" class="form-input" required>' + escapeHTML(item ? item.description : '') + '</textarea>' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-author">Author</label>' +
        '<input type="text" id="f-author" class="form-input" value="' + escapeHTML(item ? item.author : 'Djonny Noel') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-readTime">Read Time</label>' +
        '<input type="text" id="f-readTime" class="form-input" placeholder="8 min read" value="' + escapeHTML(item ? item.readTime : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-url">Post URL <span style="font-weight:400;color:var(--color-gray-500)">(auto-filled from slug)</span></label>' +
        '<input type="text" id="f-url" class="form-input" placeholder="/blog/my-post" value="' + escapeHTML(item ? (item.url || '') : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-slug">Page Slug <span style="font-weight:400;color:var(--color-gray-500)">(creates /blog/<em>slug</em>/index.html when published)</span></label>' +
        '<div style="display:flex;gap:8px;">' +
        '<input type="text" id="f-slug" class="form-input" placeholder="my-post-title" value="' + escapeHTML(item ? (item.slug || '') : '') + '">' +
        '<button type="button" id="f-slug-gen" class="btn btn-secondary btn-sm" style="white-space:nowrap;flex-shrink:0;">Auto-fill</button>' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-bodyHtml">Blog Post Body (HTML) <span style="font-weight:400;color:var(--color-gray-500)">(optional — write full article content)</span></label>' +
        '<textarea id="f-bodyHtml" class="form-input" rows="14" style="font-family:monospace;font-size:13px;resize:vertical;">' + escapeHTML(item && item.id ? TinahtData.getBlogBody(item.id) : '') + '</textarea>' +
        '<p style="font-size:12px;color:var(--color-gray-500);margin-top:4px;">Use HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc. Publish pushes this as <code>blog/{slug}/index.html</code> to GitHub.</p>' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="admin-form__checkbox"><input type="checkbox" id="f-featured"' + (item && item.featured ? ' checked' : '') + '><span>Featured Article</span></label>' +
        '</div>' +
        '<div class="admin-form__footer">' +
        '<button type="button" class="btn btn-secondary admin-modal-cancel">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save Post</button>' +
        '</div>';

      // Wire up slug auto-fill after form renders
      setTimeout(function () {
        var titleInput = document.getElementById('f-title');
        var slugInput = document.getElementById('f-slug');
        var urlInput = document.getElementById('f-url');
        var slugGenBtn = document.getElementById('f-slug-gen');
        var bodyField = document.getElementById('f-bodyHtml');
        if (!slugInput) return;

        function applySlug() {
          var s = slugify(titleInput.value);
          slugInput.value = s;
          urlInput.value = s ? '/blog/' + s : '';
        }
        slugGenBtn.addEventListener('click', applySlug);
        slugInput.addEventListener('input', function () {
          urlInput.value = slugInput.value ? '/blog/' + slugInput.value : '';
        });
        if (!item) {
          titleInput.addEventListener('blur', function () {
            if (!slugInput.value) applySlug();
          });
        }

        // If editing a post that has a URL/slug but no body stored locally,
        // try to fetch the existing HTML page from GitHub and extract the article body
        if (item && item.slug && bodyField && !bodyField.value.trim()) {
          var token = getGitHubToken();
          if (token) {
            var ghPath = 'blog/' + item.slug + '/index.html';
            var ghApiUrl = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + ghPath + '?t=' + Date.now();
            bodyField.placeholder = 'Loading existing page content from GitHub...';
            fetch(ghApiUrl, { headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' } })
              .then(function (res) { return res.ok ? res.json() : null; })
              .then(function (data) {
                if (!data || !data.content) {
                  bodyField.placeholder = 'Paste or write HTML content here...';
                  return;
                }
                var html = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
                // Extract just the article-body content
                var match = html.match(/<article[^>]*class="article-body"[^>]*>([\s\S]*?)<\/article>/i);
                if (match) {
                  // Strip the hero image (first <img> tag) since it's stored separately as imageUrl
                  var body = match[1].trim().replace(/^\s*<img[^>]*>\s*/i, '').trim();
                  bodyField.value = body;
                  TinahtData.saveBlogBody(item.id, body);
                  bodyField.placeholder = '';
                } else {
                  bodyField.placeholder = 'Could not extract article body — paste HTML manually.';
                }
              })
              .catch(function () {
                bodyField.placeholder = 'Could not load from GitHub — paste HTML manually.';
              });
          }
        }
      }, 0);
    } else if (currentTab === 'portfolio') {
      var portCategories = ['AI Automation', 'Hosting & DevOps', 'Networking', 'Cybersecurity', 'Web Optimization'];
      var techVal = item && item.technologies ? item.technologies.join(', ') : '';
      var galleryVal = item && item.gallery ? item.gallery.join('\n') : '';
      html =
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-title">Project Title *</label>' +
        '<input type="text" id="f-title" class="form-input" required value="' + escapeHTML(item ? item.title : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-slug">Slug *</label>' +
        '<div style="display:flex;gap:8px;">' +
        '<input type="text" id="f-slug" class="form-input" required placeholder="my-project" value="' + escapeHTML(item ? item.slug : '') + '">' +
        '<button type="button" id="f-slug-gen" class="btn btn-secondary btn-sm" style="white-space:nowrap;flex-shrink:0;">Auto</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-category">Category *</label>' +
        '<select id="f-category" class="form-input">' +
        portCategories.map(function (c) { return '<option value="' + c + '"' + (item && item.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-completionDate">Completion Date</label>' +
        '<input type="date" id="f-completionDate" class="form-input" value="' + escapeHTML(item ? (item.completionDate || '') : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-clientName">Client Name</label>' +
        '<input type="text" id="f-clientName" class="form-input" placeholder="Acme Corp" value="' + escapeHTML(item ? (item.clientName || '') : '') + '">' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-thumbnailUrl">Thumbnail Image URL</label>' +
        '<input type="text" id="f-thumbnailUrl" class="form-input" placeholder="https://images.unsplash.com/..." value="' + escapeHTML(item ? (item.thumbnailUrl || '') : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-heroImageUrl">Hero Image URL</label>' +
        '<input type="text" id="f-heroImageUrl" class="form-input" placeholder="https://images.unsplash.com/..." value="' + escapeHTML(item ? (item.heroImageUrl || '') : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-shortDescription">Short Description *</label>' +
        '<textarea id="f-shortDescription" class="form-input" required rows="2">' + escapeHTML(item ? (item.shortDescription || '') : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-fullDescription">Full Description</label>' +
        '<textarea id="f-fullDescription" class="form-input" rows="3">' + escapeHTML(item ? (item.fullDescription || '') : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-challenge">Challenge</label>' +
        '<textarea id="f-challenge" class="form-input" rows="3">' + escapeHTML(item ? (item.challenge || '') : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-solution">Solution</label>' +
        '<textarea id="f-solution" class="form-input" rows="3">' + escapeHTML(item ? (item.solution || '') : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-result">Result</label>' +
        '<textarea id="f-result" class="form-input" rows="3">' + escapeHTML(item ? (item.result || '') : '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-technologies">Technologies <span style="font-weight:400;color:var(--color-gray-500)">(comma-separated)</span></label>' +
        '<input type="text" id="f-technologies" class="form-input" placeholder="Docker, Python, n8n" value="' + escapeHTML(techVal) + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-gallery">Gallery Image URLs <span style="font-weight:400;color:var(--color-gray-500)">(one per line)</span></label>' +
        '<textarea id="f-gallery" class="form-input" rows="3" placeholder="https://images.unsplash.com/...">' + escapeHTML(galleryVal) + '</textarea>' +
        '</div>' +
        '<div class="admin-form__footer">' +
        '<button type="button" class="btn btn-secondary admin-modal-cancel">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save Project</button>' +
        '</div>';

      setTimeout(function () {
        var titleInput = document.getElementById('f-title');
        var slugInput = document.getElementById('f-slug');
        var slugGenBtn = document.getElementById('f-slug-gen');
        if (!slugInput) return;
        slugGenBtn.addEventListener('click', function () {
          slugInput.value = slugify(titleInput.value);
        });
        if (!item) {
          titleInput.addEventListener('blur', function () {
            if (!slugInput.value) slugInput.value = slugify(titleInput.value);
          });
        }
      }, 0);
    } else if (currentTab === 'testimonials') {
      html =
        '<div class="form-group">' +
        '<label for="f-quote">Quote *</label>' +
        '<textarea id="f-quote" class="form-input" required>' + escapeHTML(item ? item.quote : '') + '</textarea>' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-authorName">Author Name *</label>' +
        '<input type="text" id="f-authorName" class="form-input" required value="' + escapeHTML(item ? item.authorName : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-avatarInitials">Initials</label>' +
        '<input type="text" id="f-avatarInitials" class="form-input" maxlength="2" placeholder="SM" value="' + escapeHTML(item ? item.avatarInitials : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-role">Role / Title</label>' +
        '<input type="text" id="f-role" class="form-input" placeholder="CTO" value="' + escapeHTML(item ? item.role : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-company">Company</label>' +
        '<input type="text" id="f-company" class="form-input" value="' + escapeHTML(item ? item.company : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="admin-form__footer">' +
        '<button type="button" class="btn btn-secondary admin-modal-cancel">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save</button>' +
        '</div>';
    } else if (currentTab === 'team') {
      html =
        '<div class="admin-form__row">' +
        '<div class="form-group">' +
        '<label for="f-name">Name *</label>' +
        '<input type="text" id="f-name" class="form-input" required value="' + escapeHTML(item ? item.name : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-avatarInitials">Initials</label>' +
        '<input type="text" id="f-avatarInitials" class="form-input" maxlength="2" placeholder="DN" value="' + escapeHTML(item ? item.avatarInitials : '') + '">' +
        '</div>' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-role">Role / Title *</label>' +
        '<input type="text" id="f-role" class="form-input" required value="' + escapeHTML(item ? item.role : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="f-bio">Bio</label>' +
        '<textarea id="f-bio" class="form-input">' + escapeHTML(item ? item.bio : '') + '</textarea>' +
        '</div>' +
        '<div class="admin-form__footer">' +
        '<button type="button" class="btn btn-secondary admin-modal-cancel">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save</button>' +
        '</div>';
    }

    modalForm.innerHTML = html;
    modal.classList.add('is-open');

    modalForm.querySelectorAll('.admin-modal-cancel').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    editingId = null;
  }

  // Save handler
  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var item = {};

    if (currentTab === 'portfolio') {
      var techRaw = document.getElementById('f-technologies').value.trim();
      var galleryRaw = document.getElementById('f-gallery').value.trim();
      item = {
        slug: document.getElementById('f-slug').value.trim(),
        title: document.getElementById('f-title').value.trim(),
        category: document.getElementById('f-category').value,
        clientName: document.getElementById('f-clientName').value.trim(),
        completionDate: document.getElementById('f-completionDate').value,
        thumbnailUrl: document.getElementById('f-thumbnailUrl').value.trim(),
        heroImageUrl: document.getElementById('f-heroImageUrl').value.trim(),
        shortDescription: document.getElementById('f-shortDescription').value.trim(),
        fullDescription: document.getElementById('f-fullDescription').value.trim(),
        challenge: document.getElementById('f-challenge').value.trim(),
        solution: document.getElementById('f-solution').value.trim(),
        result: document.getElementById('f-result').value.trim(),
        technologies: techRaw ? techRaw.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [],
        gallery: galleryRaw ? galleryRaw.split('\n').map(function (u) { return u.trim(); }).filter(Boolean) : []
      };
      // Portfolio uses slug as unique key — update by slug, add if new
      var allProjects = TinahtData.getAll('portfolio') || [];
      var existing = allProjects.find(function (p) { return p.slug === (editingId || item.slug); });
      if (existing) {
        var idx = allProjects.indexOf(existing);
        allProjects[idx] = item;
        TinahtData.save('portfolio', allProjects);
        showToast('Project updated successfully', 'success');
      } else {
        allProjects.push(item);
        TinahtData.save('portfolio', allProjects);
        showToast('Project added successfully', 'success');
      }
      closeModal();
      renderList();
      return;
    } else if (currentTab === 'blogs') {
      var slugVal = document.getElementById('f-slug').value.trim();
      item = {
        title: document.getElementById('f-title').value.trim(),
        category: document.getElementById('f-category').value,
        categoryLabel: TinahtData.CATEGORIES[document.getElementById('f-category').value],
        imageUrl: document.getElementById('f-imageUrl').value.trim(),
        description: document.getElementById('f-description').value.trim(),
        author: document.getElementById('f-author').value.trim() || 'Djonny Noel',
        date: document.getElementById('f-date').value,
        readTime: document.getElementById('f-readTime').value.trim(),
        slug: slugVal || null,
        url: document.getElementById('f-url').value.trim() || (slugVal ? '/blog/' + slugVal : null),
        featured: document.getElementById('f-featured').checked
      };
    } else if (currentTab === 'testimonials') {
      item = {
        quote: document.getElementById('f-quote').value.trim(),
        authorName: document.getElementById('f-authorName').value.trim(),
        avatarInitials: document.getElementById('f-avatarInitials').value.trim().toUpperCase(),
        role: document.getElementById('f-role').value.trim(),
        company: document.getElementById('f-company').value.trim()
      };
    } else if (currentTab === 'team') {
      item = {
        name: document.getElementById('f-name').value.trim(),
        avatarInitials: document.getElementById('f-avatarInitials').value.trim().toUpperCase(),
        role: document.getElementById('f-role').value.trim(),
        bio: document.getElementById('f-bio').value.trim()
      };
    }

    var savedId;
    if (editingId) {
      TinahtData.update(currentTab, editingId, item);
      savedId = editingId;
      showToast('Item updated successfully', 'success');
    } else {
      var addedItem = TinahtData.add(currentTab, item);
      savedId = addedItem.id;
      showToast('Item added successfully', 'success');
    }

    // Persist blog body HTML separately
    if (currentTab === 'blogs') {
      var bodyField = document.getElementById('f-bodyHtml');
      if (bodyField) TinahtData.saveBlogBody(savedId, bodyField.value.trim());
    }

    closeModal();
    renderList();
  });

  modal.querySelector('.admin-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.admin-modal__close').addEventListener('click', closeModal);

  // ── Delete Confirm ─────────────────────────────────────────

  confirmCancel.addEventListener('click', function () {
    confirmDialog.classList.remove('is-open');
    deleteId = null;
  });

  confirmDialog.querySelector('.admin-confirm__backdrop').addEventListener('click', function () {
    confirmDialog.classList.remove('is-open');
    deleteId = null;
  });

  confirmDelete.addEventListener('click', function () {
    if (deleteId === '__clear_all__') {
      TinahtData.clearAll();
      showToast('All data cleared', 'success');
      deleteId = null;
      confirmDialog.classList.remove('is-open');
      renderList();
    } else if (deleteId) {
      if (currentTab === 'blogs') TinahtData.removeBlogBody(deleteId);
      if (currentTab === 'portfolio') {
        var projects = TinahtData.getAll('portfolio') || [];
        TinahtData.save('portfolio', projects.filter(function (p) { return p.slug !== deleteId; }));
      } else {
        TinahtData.remove(currentTab, deleteId);
      }
      showToast('Item deleted', 'success');
      deleteId = null;
      confirmDialog.classList.remove('is-open');
      renderList();
    }
  });

  // ── Add Button ─────────────────────────────────────────────

  addBtn.addEventListener('click', function () {
    openModal(null);
  });

  // ── Export / Import ────────────────────────────────────────

  exportBtn.addEventListener('click', function () {
    var json = TinahtData.exportAll();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tinaht-data-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  });

  importBtn.addEventListener('click', function () {
    importFile.click();
  });

  importFile.addEventListener('change', function () {
    var file = importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        TinahtData.importAll(e.target.result);
        showToast('Data imported successfully', 'success');
        renderList();
      } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // ── Clear All ──────────────────────────────────────────────

  clearBtn.addEventListener('click', function () {
    deleteId = '__clear_all__';
    confirmMessage.textContent = 'Are you sure you want to clear ALL data? This will remove all blogs, testimonials, and team members. Public pages will revert to hardcoded content.';
    confirmDialog.classList.add('is-open');
  });

  // ── Seed Defaults ──────────────────────────────────────────

  var SEED_DATA = {
    blogs: [
      {
        id: 'blog-n8n-slack-automation',
        title: 'How to Automate Slack Notifications with n8n',
        category: 'ai-automation',
        categoryLabel: 'AI & Automation',
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80',
        description: 'Build webhook-triggered Slack notifications using n8n on Docker — no per-task fees, no third-party middlemen. Real config from Tinaht\'s stack.',
        author: 'Djonny Noel',
        date: '2026-03-23',
        readTime: '9 min read',
        url: '/blog/n8n-slack-automation',
        featured: false
      },
      {
        id: 'seed-blog-1',
        title: 'How AI Workflow Automation Is Transforming Small Business Operations',
        category: 'ai-automation',
        categoryLabel: 'AI & Automation',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
        description: 'Discover how small and mid-sized businesses are leveraging AI-driven workflows to reduce manual tasks, cut costs, and scale operations without adding headcount.',
        author: 'Djonny Noel',
        date: '2026-03-05',
        readTime: '8 min read',
        featured: true
      },
      {
        id: 'seed-blog-2',
        title: 'Docker vs. Kubernetes: Choosing the Right Container Strategy',
        category: 'hosting-devops',
        categoryLabel: 'Hosting & DevOps',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        description: 'A practical comparison of container orchestration tools to help you pick the best fit for your infrastructure needs and team size.',
        author: 'Djonny Noel',
        date: '2026-02-28',
        readTime: '6 min read',
        featured: false
      },
      {
        id: 'seed-blog-3',
        title: 'Zero Trust Architecture: A Practical Implementation Guide',
        category: 'cybersecurity',
        categoryLabel: 'Cybersecurity',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
        description: 'Move beyond perimeter security with a step-by-step guide to implementing zero trust principles in your organization.',
        author: 'Djonny Noel',
        date: '2026-02-20',
        readTime: '10 min read',
        featured: false
      },
      {
        id: 'seed-blog-4',
        title: 'Core Web Vitals in 2026: What Changed and How to Optimize',
        category: 'web-performance',
        categoryLabel: 'Web Performance',
        imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80',
        description: "Google's latest Core Web Vitals update brings new metrics. Here's what matters for your site speed and SEO rankings.",
        author: 'Djonny Noel',
        date: '2026-02-14',
        readTime: '7 min read',
        featured: false
      },
      {
        id: 'seed-blog-5',
        title: 'Building Custom AI Chatbots: From Concept to Deployment',
        category: 'ai-automation',
        categoryLabel: 'AI & Automation',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
        description: 'A technical walkthrough of designing, training, and deploying custom AI chatbots that actually solve customer problems.',
        author: 'Djonny Noel',
        date: '2026-02-07',
        readTime: '12 min read',
        featured: false
      },
      {
        id: 'seed-blog-6',
        title: 'The Rise of Edge Computing: What It Means for Your Infrastructure',
        category: 'industry-news',
        categoryLabel: 'Industry News',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        description: 'Edge computing is reshaping how businesses think about latency, data processing, and distributed architecture.',
        author: 'Djonny Noel',
        date: '2026-01-30',
        readTime: '5 min read',
        featured: false
      },
      {
        id: 'seed-blog-7',
        title: 'SSL/TLS Best Practices: Securing Your Web Applications in 2026',
        category: 'hosting-devops',
        categoryLabel: 'Hosting & DevOps',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=600&q=80',
        description: 'From certificate management to cipher suites, everything you need to know about modern TLS configuration.',
        author: 'Djonny Noel',
        date: '2026-01-22',
        readTime: '9 min read',
        featured: false
      }
    ],
    testimonials: [
      {
        id: 'seed-test-1',
        quote: 'Tinaht transformed our network infrastructure. Their team delivered a solution that exceeded our expectations and reduced our downtime significantly. Highly recommended for any business.',
        authorName: 'Sarah Mitchell',
        role: 'CTO',
        company: 'TechVenture Inc.',
        avatarInitials: 'SM'
      },
      {
        id: 'seed-test-2',
        quote: 'The AI automation solutions from Tinaht saved us over 20 hours per week in manual processes. Their team understood our needs from day one and delivered beyond our expectations.',
        authorName: 'Marcus Johnson',
        role: 'CEO',
        company: 'GrowthScale Labs',
        avatarInitials: 'MJ'
      },
      {
        id: 'seed-test-3',
        quote: "Moving to Tinaht's managed hosting was the best decision we made. Zero downtime during migration, Docker deployments are seamless, and their support team is incredibly responsive.",
        authorName: 'Emily Chen',
        role: 'VP of Engineering',
        company: 'DataFlow Systems',
        avatarInitials: 'EC'
      }
    ],
    team: [
      {
        id: 'seed-team-1',
        name: 'Djonny Noel',
        role: 'Founder & Lead Engineer',
        bio: 'Full-stack engineer and network architect with a passion for building scalable solutions that make a real impact.',
        avatarInitials: 'DN'
      },
      {
        id: 'seed-team-2',
        name: 'Team Hiring',
        role: 'Position Open',
        bio: "We're growing! Interested in joining our team? Reach out to us and let's build the future of technology together.",
        avatarInitials: 'TH'
      },
      {
        id: 'seed-team-3',
        name: 'Team Hiring',
        role: 'Position Open',
        bio: "We're always looking for talented engineers, developers, and consultants who share our vision for excellence.",
        avatarInitials: 'TH'
      }
    ]
  };

  seedBtn.addEventListener('click', function () {
    TinahtData.importAll(JSON.stringify(SEED_DATA));
    showToast('Default data seeded successfully', 'success');
    renderList();
  });

  if (syncBtn) {
    syncBtn.addEventListener('click', syncFromLive);
  }

  // ── Publish to GitHub ──────────────────────────────────────

  function updatePublishStatus() {
    if (!getGitHubToken()) {
      publishStatus.textContent = 'No GitHub token set — click GitHub Setup';
      publishStatus.className = 'admin-publish-status';
    } else {
      publishStatus.textContent = 'Ready to publish';
      publishStatus.className = 'admin-publish-status';
    }
  }

  function publishToGitHub() {
    var token = getGitHubToken();
    if (!token) {
      showToast('Set up your GitHub token first', 'error');
      githubSetupModal.classList.add('is-open');
      return;
    }

    publishBtn.disabled = true;
    publishStatus.textContent = 'Publishing...';
    publishStatus.className = 'admin-publish-status';

    var content = TinahtData.buildPublishPayload();
    var apiUrl = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + GH_FILE;

    // Step 1: Get current file SHA (needed for update)
    fetch(apiUrl + '?ref=' + GH_BRANCH + '&t=' + Date.now(), {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    .then(function (res) {
      if (res.status === 404) {
        // File doesn't exist yet — create it
        return { sha: null };
      }
      if (!res.ok) throw new Error('GitHub API error: ' + res.status);
      return res.json();
    })
    .then(function (fileData) {
      // Step 2: Create or update the file
      var body = {
        message: 'Update site content via admin panel',
        content: btoa(unescape(encodeURIComponent(content))),
        branch: GH_BRANCH
      };
      if (fileData.sha) {
        body.sha = fileData.sha;
      }

      return fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || 'Publish failed');
        });
      }
      return res.json();
    })
    .then(function () {
      // Push projects.json
      var projContent = TinahtData.buildProjectsPayload();
      var projApiUrl = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/data/projects.json';
      return fetch(projApiUrl + '?ref=' + GH_BRANCH + '&t=' + Date.now(), {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      })
      .then(function (res) { return res.status === 404 ? { sha: null } : res.json(); })
      .then(function (fileData) {
        var body = { message: 'Update portfolio via admin panel', content: btoa(unescape(encodeURIComponent(projContent))), branch: GH_BRANCH };
        if (fileData.sha) body.sha = fileData.sha;
        return fetch(projApiUrl, { method: 'PUT', headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      })
      .then(function (res) { if (!res.ok) return res.json().then(function (e) { throw new Error(e.message); }); return res.json(); });
    })
    .then(function () {
      // Push any blog post HTML pages
      return pushBlogPages(token);
    })
    .then(function (pageCount) {
      publishBtn.disabled = false;
      var msg = 'Published successfully!';
      if (pageCount > 0) msg += ' ' + pageCount + ' blog page(s) pushed.';
      msg += ' Changes live in ~1 min.';
      publishStatus.textContent = msg;
      publishStatus.className = 'admin-publish-status is-success';
      showToast('Published to live site!', 'success');
    })
    .catch(function (err) {
      publishBtn.disabled = false;
      publishStatus.textContent = 'Publish failed: ' + err.message;
      publishStatus.className = 'admin-publish-status is-error';
      showToast('Publish failed: ' + err.message, 'error');
    });
  }

  publishBtn.addEventListener('click', publishToGitHub);

  // ── GitHub Setup Modal ─────────────────────────────────────

  githubSetupBtn.addEventListener('click', function () {
    var tokenInput = document.getElementById('gh-token');
    tokenInput.value = getGitHubToken();
    githubSetupModal.classList.add('is-open');
  });

  githubSetupModal.querySelector('.admin-modal__backdrop').addEventListener('click', function () {
    githubSetupModal.classList.remove('is-open');
  });
  githubSetupModal.querySelector('.admin-modal__close').addEventListener('click', function () {
    githubSetupModal.classList.remove('is-open');
  });
  githubSetupModal.querySelectorAll('.github-setup-cancel').forEach(function (btn) {
    btn.addEventListener('click', function () {
      githubSetupModal.classList.remove('is-open');
    });
  });

  githubSetupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var token = document.getElementById('gh-token').value.trim();
    if (token) {
      setGitHubToken(token);
      showToast('GitHub token saved', 'success');
      githubSetupModal.classList.remove('is-open');
      updatePublishStatus();
    }
  });

  // ── Keyboard shortcuts ─────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (confirmDialog.classList.contains('is-open')) {
        confirmDialog.classList.remove('is-open');
        deleteId = null;
      } else if (githubSetupModal.classList.contains('is-open')) {
        githubSetupModal.classList.remove('is-open');
      } else if (modal.classList.contains('is-open')) {
        closeModal();
      }
    }
  });

  // ── Init ───────────────────────────────────────────────────

  checkAuth();

})();
