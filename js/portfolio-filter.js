/* ============================================================
   PORTFOLIO-FILTER.JS -- Portfolio Grid & Category Filtering
   ============================================================ */

(function () {
  'use strict';

  const grid = document.getElementById('portfolio-grid');
  const filterBar = document.querySelector('.filter-bar');

  if (!grid || !filterBar) return;

  let allProjects = [];
  let currentFilter = 'all';

  // ---- Fetch and Render Projects ----
  fetch('../data/projects.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Failed to load projects');
      return response.json();
    })
    .then(function (projects) {
      allProjects = projects;
      renderProjects(projects);
    })
    .catch(function (error) {
      console.error('Portfolio load error:', error);
      grid.innerHTML =
        '<div class="portfolio-empty">Unable to load projects. Please try again later.</div>';
    });

  // ---- Render Project Cards ----
  function renderProjects(projects) {
    if (projects.length === 0) {
      grid.innerHTML =
        '<div class="portfolio-empty">No projects found in this category.</div>';
      return;
    }

    grid.innerHTML = projects
      .map(function (project) {
        return createCardHTML(project);
      })
      .join('');

    // Stagger animation for cards
    var cards = grid.querySelectorAll('.portfolio-card');
    cards.forEach(function (card, index) {
      card.style.animationDelay = index * 0.08 + 's';
    });
  }

  function createCardHTML(project) {
    var date = new Date(project.completionDate);
    var dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    return (
      '<article class="card portfolio-card" data-category="' +
      escapeHTML(project.category) +
      '">' +
      '  <a href="/portfolio/project.html?slug=' +
      encodeURIComponent(project.slug) +
      '" class="card__image-link">' +
      '    <div class="card__image">' +
      (project.thumbnailUrl
        ? '      <img src="' + escapeHTML(project.thumbnailUrl) + '" alt="' + escapeHTML(project.title) + '" loading="lazy">'
        : '      <div class="placeholder-image" style="width:100%;height:100%;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'
      ) +
      '      <div class="card__image-overlay"></div>' +
      '    </div>' +
      '  </a>' +
      '  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
      '    <span class="card__tag">' +
      escapeHTML(project.category) +
      '</span>' +
      '    <time style="font-family:var(--font-nav);font-size:var(--fs-small);color:var(--color-gray-500);">' +
      dateStr +
      '</time>' +
      '  </div>' +
      '  <h3 class="card__title">' +
      escapeHTML(project.title) +
      '</h3>' +
      '  <p class="card__text">' +
      escapeHTML(project.shortDescription) +
      '</p>' +
      '  <a href="/portfolio/project.html?slug=' +
      encodeURIComponent(project.slug) +
      '" class="card__link">View Project &rarr;</a>' +
      '</article>'
    );
  }

  // ---- Filter Logic ----
  filterBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;

    var filter = btn.getAttribute('data-filter');
    if (filter === currentFilter) return;

    // Update active button
    filterBar.querySelector('.filter-btn.is-active').classList.remove('is-active');
    btn.classList.add('is-active');
    currentFilter = filter;

    // Filter projects
    if (filter === 'all') {
      renderProjects(allProjects);
    } else {
      var filtered = allProjects.filter(function (p) {
        return p.category === filter;
      });
      renderProjects(filtered);
    }
  });

  // ---- Utility ----
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
