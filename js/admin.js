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

    // If localStorage has no blogs yet, auto-load from published content.json
    if (!TinahtData.getAll('blogs')) {
      TinahtData.fetchPublished().then(function (data) {
        if (data && data.blogs && data.blogs.length > 0) {
          TinahtData.importAll(JSON.stringify(data));
          showToast('Loaded published content into editor', 'success');
        }
        renderList();
      });
    } else {
      renderList();
    }
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
      var labels = { blogs: 'blog post', testimonials: 'testimonial', team: 'team member' };
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
        html +=
          '<div class="admin-item">' +
          '<div class="admin-item__header">' +
          '<span class="admin-item__tag">' + escapeHTML(TinahtData.CATEGORIES[item.category] || item.category) + '</span>' +
          (item.featured ? '<span class="admin-item__featured">Featured</span>' : '') +
          '</div>' +
          '<h4 class="admin-item__title">' + escapeHTML(item.title) + '</h4>' +
          '<p class="admin-item__text">' + escapeHTML(truncate(item.description, 100)) + '</p>' +
          '<p class="admin-item__meta">' + escapeHTML(item.author) + ' &bull; ' + formatDate(item.date) + '</p>' +
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
        openModal(TinahtData.getById(currentTab, id));
      });
    });
    contentGrid.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteId = btn.getAttribute('data-delete');
        var item = TinahtData.getById(currentTab, deleteId);
        var name = item ? (item.title || item.authorName || item.name || 'this item') : 'this item';
        confirmMessage.textContent = 'Are you sure you want to delete "' + name + '"? This cannot be undone.';
        confirmDialog.classList.add('is-open');
      });
    });
  }

  // ── Modal Form ─────────────────────────────────────────────

  function openModal(item) {
    editingId = item ? item.id : null;
    modalTitle.textContent = (item ? 'Edit' : 'Add') + ' ' +
      { blogs: 'Blog Post', testimonials: 'Testimonial', team: 'Team Member' }[currentTab];

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
        '<label for="f-url">Post URL <span style="font-weight:400;color:var(--color-gray-500)">(optional — link to a dedicated post page, e.g. /blog/my-post)</span></label>' +
        '<input type="text" id="f-url" class="form-input" placeholder="/blog/my-post" value="' + escapeHTML(item ? (item.url || '') : '') + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="admin-form__checkbox"><input type="checkbox" id="f-featured"' + (item && item.featured ? ' checked' : '') + '><span>Featured Article</span></label>' +
        '</div>' +
        '<div class="admin-form__footer">' +
        '<button type="button" class="btn btn-secondary admin-modal-cancel">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save</button>' +
        '</div>';
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

    if (currentTab === 'blogs') {
      item = {
        title: document.getElementById('f-title').value.trim(),
        category: document.getElementById('f-category').value,
        categoryLabel: TinahtData.CATEGORIES[document.getElementById('f-category').value],
        imageUrl: document.getElementById('f-imageUrl').value.trim(),
        description: document.getElementById('f-description').value.trim(),
        author: document.getElementById('f-author').value.trim() || 'Djonny Noel',
        date: document.getElementById('f-date').value,
        readTime: document.getElementById('f-readTime').value.trim(),
        url: document.getElementById('f-url').value.trim() || null,
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

    if (editingId) {
      TinahtData.update(currentTab, editingId, item);
      showToast('Item updated successfully', 'success');
    } else {
      TinahtData.add(currentTab, item);
      showToast('Item added successfully', 'success');
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
      TinahtData.remove(currentTab, deleteId);
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
    fetch(apiUrl + '?ref=' + GH_BRANCH, {
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
      publishBtn.disabled = false;
      publishStatus.textContent = 'Published successfully! Changes will be live in ~1 min.';
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
