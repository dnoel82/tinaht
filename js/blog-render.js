/* ============================================================
   BLOG-RENDER.JS -- Renders blog page from content.json
   Must load AFTER data-manager.js, BEFORE blog-filter.js
   ============================================================ */
(function () {
  'use strict';

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  TinahtData.fetchPublished().then(function (data) {
    if (!data) return; // fetch failed — keep hardcoded HTML

    var blogs = data.blogs;
    if (!blogs || blogs.length === 0) return;

    // Sort by date descending
    blogs.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    // Find featured article
    var featured = blogs.find(function (b) { return b.featured; }) || blogs[0];
    if (!featured) return;

    // Render featured article
    var featuredEl = document.querySelector('.blog-featured');
    if (featuredEl) {
      featuredEl.setAttribute('data-category', featured.category || '');
      if (featured.url) {
        featuredEl.style.cursor = 'pointer';
        featuredEl.onclick = function () { window.location.href = featured.url; };
      }
      featuredEl.innerHTML =
        '<div class="blog-featured__image">' +
        (featured.imageUrl ? '<img src="' + escapeHTML(featured.imageUrl) + '" alt="' + escapeHTML(featured.title) + '" loading="lazy">' : '') +
        '<div class="blog-featured__image-overlay"></div>' +
        '</div>' +
        '<div class="blog-featured__content">' +
        '<span class="card__tag">' + escapeHTML(featured.categoryLabel || TinahtData.CATEGORIES[featured.category] || featured.category) + '</span>' +
        '<h2>' + escapeHTML(featured.title) + '</h2>' +
        '<p>' + escapeHTML(featured.description) + '</p>' +
        '<div class="blog-featured__meta">' +
        '<span>' + escapeHTML(featured.author) + '</span>' +
        '<span>&bull;</span>' +
        '<span>' + formatDate(featured.date) + '</span>' +
        (featured.readTime ? '<span>&bull;</span><span>' + escapeHTML(featured.readTime) + '</span>' : '') +
        '</div>' +
        '</div>';
    }

    // Render blog card grid (exclude featured)
    var grid = null;
    var blogTabs = document.querySelector('.blog-tabs');
    if (blogTabs) {
      var sibling = blogTabs.nextElementSibling;
      if (sibling && sibling.classList.contains('grid-3')) {
        grid = sibling;
      }
    }
    if (!grid) {
      grid = document.querySelector('.section .grid-3');
    }

    if (grid) {
      var nonFeatured = blogs.filter(function (b) { return b.id !== featured.id; });
      var html = '';

      nonFeatured.forEach(function (post) {
        var cardOpen = post.url
          ? '<a href="' + escapeHTML(post.url) + '" class="card blog-card blog-card--link" data-category="' + escapeHTML(post.category) + '" style="display:block;text-decoration:none;color:inherit;">'
          : '<article class="card blog-card" data-category="' + escapeHTML(post.category) + '">';
        var cardClose = post.url ? '</a>' : '</article>';

        html +=
          cardOpen +
          '<div class="card__image">' +
          (post.imageUrl ? '<img src="' + escapeHTML(post.imageUrl) + '" alt="' + escapeHTML(post.title) + '" loading="lazy">' : '') +
          '<div class="card__image-overlay"></div>' +
          '</div>' +
          '<span class="card__tag">' + escapeHTML(post.categoryLabel || TinahtData.CATEGORIES[post.category] || post.category) + '</span>' +
          '<h3 class="card__title">' + escapeHTML(post.title) + '</h3>' +
          '<p class="card__text">' + escapeHTML(post.description) + '</p>' +
          '<div class="blog-featured__meta" style="padding:0 24px 20px;">' +
          '<span>' + escapeHTML(post.author) + '</span>' +
          '<span>&bull;</span>' +
          '<span>' + formatDate(post.date) + '</span>' +
          '</div>' +
          cardClose;
      });

      grid.innerHTML = html;
    }

    // Re-init blog filters after DOM update
    if (window.TinahtBlogFilter && typeof window.TinahtBlogFilter.init === 'function') {
      window.TinahtBlogFilter.init();
    }
  });
})();
