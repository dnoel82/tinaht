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
      featuredEl.innerHTML =
        '<div class="blog-featured__image">' +
        (featured.imageUrl ? '<img src="' + escapeHTML(featured.imageUrl) + '" alt="' + escapeHTML(featured.title) + '" loading="lazy">' : '') +
        '<div class="blog-featured__image-overlay"></div>' +
        '</div>' +
        '<div class="blog-featured__content">' +
        '<span class="card__tag">' + escapeHTML(TinahtData.CATEGORIES[featured.category] || featured.category) + '</span>' +
        (featured.url
          ? '<h2><a href="' + escapeHTML(featured.url) + '" style="color:inherit;text-decoration:none;">' + escapeHTML(featured.title) + '</a></h2>'
          : '<h2>' + escapeHTML(featured.title) + '</h2>') +
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
        var titleHtml = post.url
          ? '<h3 class="card__title"><a href="' + escapeHTML(post.url) + '" style="color:inherit;text-decoration:none;">' + escapeHTML(post.title) + '</a></h3>'
          : '<h3 class="card__title">' + escapeHTML(post.title) + '</h3>';
        var imageHtml = post.imageUrl
          ? (post.url
              ? '<a href="' + escapeHTML(post.url) + '"><img src="' + escapeHTML(post.imageUrl) + '" alt="' + escapeHTML(post.title) + '" loading="lazy"></a>'
              : '<img src="' + escapeHTML(post.imageUrl) + '" alt="' + escapeHTML(post.title) + '" loading="lazy">')
          : '';
        html +=
          '<article class="card blog-card" data-category="' + escapeHTML(post.category) + '">' +
          '<div class="card__image">' +
          imageHtml +
          '<div class="card__image-overlay"></div>' +
          '</div>' +
          '<span class="card__tag">' + escapeHTML(TinahtData.CATEGORIES[post.category] || post.category) + '</span>' +
          titleHtml +
          '<p class="card__text">' + escapeHTML(post.description) + '</p>' +
          '<div class="blog-featured__meta" style="padding:0 24px 20px;">' +
          '<span>' + escapeHTML(post.author) + '</span>' +
          '<span>&bull;</span>' +
          '<span>' + formatDate(post.date) + '</span>' +
          '</div>' +
          '</article>';
      });

      grid.innerHTML = html;
    }

    // Re-init blog filters after DOM update
    if (window.TinahtBlogFilter && typeof window.TinahtBlogFilter.init === 'function') {
      window.TinahtBlogFilter.init();
    }
  });
})();
