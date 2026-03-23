/* ============================================================
   BLOG-FILTER.JS -- Blog Category Filtering
   ============================================================ */

window.TinahtBlogFilter = (function () {
  'use strict';

  function init() {
    var tabs = document.querySelector('.blog-tabs');
    if (!tabs) return;

    var buttons = tabs.querySelectorAll('.filter-btn');
    var featured = document.querySelector('.blog-featured');

    // Remove old listeners by cloning buttons
    buttons.forEach(function (btn) {
      var clone = btn.cloneNode(true);
      btn.parentNode.replaceChild(clone, btn);
    });

    // Re-query after clone
    buttons = tabs.querySelectorAll('.filter-btn');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        // Update active button
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        // Filter featured article
        if (featured) {
          if (filter === 'all' || featured.getAttribute('data-category') === filter) {
            featured.style.display = '';
          } else {
            featured.style.display = 'none';
          }
        }

        // Re-query cards each click so dynamic cards are included
        var cards = document.querySelectorAll('.blog-card');
        var visibleCount = 0;
        cards.forEach(function (card) {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            setTimeout(function () {
              card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, visibleCount * 80);
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });

        // Show empty state if no cards match
        var grid = document.querySelector('.grid-3');
        if (!grid) return;
        var emptyMsg = grid.querySelector('.blog-empty');
        var featuredHidden = featured && featured.style.display === 'none';
        if (visibleCount === 0 && featuredHidden) {
          if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.className = 'blog-empty';
            emptyMsg.innerHTML = '<p style="text-align:center;color:var(--color-gray-500);padding:40px 0;grid-column:1/-1;">No articles found in this category yet.</p>';
            grid.appendChild(emptyMsg);
          }
          emptyMsg.style.display = '';
        } else if (emptyMsg) {
          emptyMsg.style.display = 'none';
        }
      });
    });
  }

  // Auto-init on load
  init();

  return { init: init };
})();
