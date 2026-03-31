/* ============================================================
   HOME-RENDER.JS -- Renders homepage sections from content.json
   Must load AFTER data-manager.js, BEFORE main.js
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

  // Fetch published data then render
  TinahtData.fetchPublished().then(function (data) {
    if (!data) return; // fetch failed — keep hardcoded HTML

    // ── Testimonials ─────────────────────────────────────────
    var testimonials = data.testimonials;
    if (testimonials && testimonials.length > 0) {
      var track = document.querySelector('.testimonial-track');
      var dots = document.querySelector('.testimonial-dots');

      if (track && dots) {
        var trackHTML = '';
        var dotsHTML = '';

        testimonials.forEach(function (t, i) {
          trackHTML +=
            '<div class="testimonial-slide' + (i === 0 ? ' is-active' : '') + '">' +
            '<blockquote class="testimonial-card">' +
            '<p class="testimonial-card__text">' + escapeHTML(t.quote) + '</p>' +
            '<footer class="testimonial-card__author">' +
            '<div class="testimonial-card__avatar"></div>' +
            '<div>' +
            '<cite class="testimonial-card__name">' + escapeHTML(t.authorName) + '</cite>' +
            '<p class="testimonial-card__role">' + escapeHTML(t.role) + ', ' + escapeHTML(t.company) + '</p>' +
            '</div>' +
            '</footer>' +
            '</blockquote>' +
            '</div>';

          dotsHTML +=
            '<button class="testimonial-dot' + (i === 0 ? ' is-active' : '') + '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-label="Testimonial ' + (i + 1) + '"></button>';
        });

        track.innerHTML = trackHTML;
        dots.innerHTML = dotsHTML;

        // Re-init carousel after DOM update
        if (window.TinahtCarousel && typeof window.TinahtCarousel.init === 'function') {
          window.TinahtCarousel.init();
        }
      }
    }

    // ── Latest Blog Posts ────────────────────────────────────
    var blogs = data.blogs;
    if (blogs && blogs.length > 0) {
      blogs.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
      var latestPosts = blogs.slice(0, 3);

      var blogSection = document.getElementById('blog');
      if (blogSection) {
        var grid = blogSection.querySelector('.grid-3');
        if (grid) {
          var html = '';
          latestPosts.forEach(function (post) {
            html +=
              '<article class="card blog-card">' +
              '<div class="card__image">' +
              (post.imageUrl ? '<img src="' + escapeHTML(post.imageUrl) + '" alt="' + escapeHTML(post.title) + '" loading="lazy">' : '') +
              '</div>' +
              '<div class="blog-card__meta">' +
              '<span class="card__tag">' + escapeHTML(TinahtData.CATEGORIES[post.category] || post.category) + '</span>' +
              '<time datetime="' + escapeHTML(post.date) + '">' + formatDate(post.date) + '</time>' +
              '</div>' +
              '<h3 class="card__title">' + escapeHTML(post.title) + '</h3>' +
              '<p class="card__text">' + escapeHTML(post.description) + '</p>' +
              '<a href="' + escapeHTML(post.url || 'blog') + '" class="card__link">Read More &rarr;</a>' +
              '</article>';
          });
          grid.innerHTML = html;
        }
      }
    }
  });
})();
