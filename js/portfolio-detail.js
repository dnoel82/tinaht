/* ============================================================
   PORTFOLIO-DETAIL.JS -- Project Detail Page Data Loader,
   Lightbox Gallery, and Related Projects
   ============================================================ */

(function () {
  'use strict';

  // ---- Get slug from URL ----
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');

  if (!slug) {
    showNotFound();
    return;
  }

  var allProjects = [];
  var currentProject = null;
  var galleryImages = [];
  var lightboxIndex = 0;

  // ---- Fetch project data ----
  fetch('../data/projects.json')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    })
    .then(function (projects) {
      allProjects = projects;
      currentProject = projects.find(function (p) {
        return p.slug === slug;
      });

      if (!currentProject) {
        showNotFound();
        return;
      }

      renderProject(currentProject);
      renderRelatedProjects(currentProject);
      setupGallery();
    })
    .catch(function () {
      showNotFound();
    });

  // ---- Render Project Content ----
  function renderProject(project) {
    // Update page title
    document.title = project.title + ' — Tinaht Portfolio';

    // Update meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', project.shortDescription);

    // Breadcrumb
    var breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) breadcrumbTitle.textContent = project.title;

    // Title
    var titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = project.title;

    // Description
    var descEl = document.getElementById('project-description');
    if (descEl) descEl.textContent = project.fullDescription;

    // Meta (category tag + date)
    var metaEl = document.getElementById('project-meta');
    if (metaEl) {
      var date = new Date(project.completionDate);
      var dateStr = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      metaEl.innerHTML =
        '<span class="card__tag">' + escapeHTML(project.category) + '</span>' +
        '<span class="project-hero__date">Completed ' + dateStr + '</span>';
    }

    // Client info
    var infoEl = document.getElementById('project-info');
    if (infoEl) {
      var infoHTML = '';
      if (project.clientName) {
        infoHTML +=
          '<div class="project-info__item">' +
          '  <span class="project-info__label">Client</span>' +
          '  <span class="project-info__value">' + escapeHTML(project.clientName) + '</span>' +
          '</div>';
      }
      infoHTML +=
        '<div class="project-info__item">' +
        '  <span class="project-info__label">Category</span>' +
        '  <span class="project-info__value">' + escapeHTML(project.category) + '</span>' +
        '</div>';
      var completionDate = new Date(project.completionDate);
      infoHTML +=
        '<div class="project-info__item">' +
        '  <span class="project-info__label">Completed</span>' +
        '  <span class="project-info__value">' +
        completionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
        '</span>' +
        '</div>';
      infoEl.innerHTML = infoHTML;
    }

    // Hero banner image
    var bannerEl = document.getElementById('project-banner');
    if (bannerEl && project.heroImageUrl) {
      bannerEl.innerHTML =
        '<img src="' + escapeHTML(project.heroImageUrl) + '" alt="' + escapeHTML(project.title) + '" style="width:100%;height:100%;object-fit:cover;">';
    }

    // Technologies
    var techEl = document.getElementById('project-tech');
    if (techEl && project.technologies) {
      techEl.innerHTML = project.technologies
        .map(function (t) {
          return '<span class="tech-tag">' + escapeHTML(t) + '</span>';
        })
        .join('');
    }

    // Challenge / Solution / Result
    var csrEl = document.getElementById('project-csr');
    if (csrEl) {
      csrEl.innerHTML =
        // Challenge
        '<div class="project-csr__item">' +
        '  <div class="project-csr__icon project-csr__icon--challenge">' +
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
        '    </svg>' +
        '  </div>' +
        '  <h3>The Challenge</h3>' +
        '  <p>' + escapeHTML(project.challenge) + '</p>' +
        '</div>' +
        // Solution
        '<div class="project-csr__item">' +
        '  <div class="project-csr__icon project-csr__icon--solution">' +
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>' +
        '    </svg>' +
        '  </div>' +
        '  <h3>Our Solution</h3>' +
        '  <p>' + escapeHTML(project.solution) + '</p>' +
        '</div>' +
        // Result
        '<div class="project-csr__item">' +
        '  <div class="project-csr__icon project-csr__icon--result">' +
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' +
        '    </svg>' +
        '  </div>' +
        '  <h3>The Result</h3>' +
        '  <p>' + escapeHTML(project.result) + '</p>' +
        '</div>';
    }

    // Gallery images
    var galleryEl = document.getElementById('project-gallery');
    if (galleryEl) {
      galleryImages = project.gallery && project.gallery.length > 0
        ? project.gallery
        : [project.heroImageUrl || ''];

      galleryEl.innerHTML = galleryImages
        .map(function (url, i) {
          var label = project.title + ' — Image ' + (i + 1);
          return (
            '<div class="gallery-item" data-index="' + i + '" tabindex="0" role="button" aria-label="View image: ' + escapeHTML(label) + '">' +
            (url
              ? '<img src="' + escapeHTML(url) + '" alt="' + escapeHTML(label) + '" loading="lazy">'
              : '<div class="placeholder-image" style="width:100%;height:100%;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'
            ) +
            '</div>'
          );
        })
        .join('');
    }
  }

  // ---- Related Projects ----
  function renderRelatedProjects(project) {
    var relatedGrid = document.getElementById('related-grid');
    if (!relatedGrid) return;

    var related = allProjects
      .filter(function (p) {
        return p.category === project.category && p.slug !== project.slug;
      })
      .slice(0, 3);

    // If not enough in same category, fill from other projects
    if (related.length < 3) {
      var others = allProjects.filter(function (p) {
        return (
          p.slug !== project.slug &&
          !related.some(function (r) { return r.slug === p.slug; })
        );
      });
      related = related.concat(others.slice(0, 3 - related.length));
    }

    if (related.length === 0) {
      document.getElementById('related-section').style.display = 'none';
      return;
    }

    relatedGrid.innerHTML = related
      .map(function (p) {
        return (
          '<article class="card">' +
          '  <a href="/portfolio/project.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '    <div class="card__image">' +
          (p.thumbnailUrl
            ? '      <img src="' + escapeHTML(p.thumbnailUrl) + '" alt="' + escapeHTML(p.title) + '" loading="lazy">'
            : '      <div class="placeholder-image" style="width:100%;height:100%;aspect-ratio:16/9;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'
          ) +
          '      <div class="card__image-overlay"></div>' +
          '    </div>' +
          '  </a>' +
          '  <span class="card__tag">' + escapeHTML(p.category) + '</span>' +
          '  <h3 class="card__title">' + escapeHTML(p.title) + '</h3>' +
          '  <p class="card__text">' + escapeHTML(p.shortDescription) + '</p>' +
          '  <a href="/portfolio/project.html?slug=' + encodeURIComponent(p.slug) + '" class="card__link">View Project &rarr;</a>' +
          '</article>'
        );
      })
      .join('');
  }

  // ---- Lightbox ----
  function setupGallery() {
    var galleryEl = document.getElementById('project-gallery');
    var lightbox = document.getElementById('lightbox');
    var lightboxContent = document.getElementById('lightbox-content');
    var lightboxCounter = document.getElementById('lightbox-counter');
    var closeBtn = document.getElementById('lightbox-close');
    var prevBtn = document.getElementById('lightbox-prev');
    var nextBtn = document.getElementById('lightbox-next');

    if (!galleryEl || !lightbox) return;

    function openLightbox(index) {
      lightboxIndex = index;
      updateLightbox();
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function updateLightbox() {
      var url = galleryImages[lightboxIndex] || '';
      if (url) {
        // Use higher resolution for lightbox
        var hiResUrl = url.replace(/w=\d+/, 'w=1200');
        lightboxContent.innerHTML =
          '<img src="' + escapeHTML(hiResUrl) + '" alt="Gallery image ' + (lightboxIndex + 1) + '" class="lightbox__image">';
      } else {
        lightboxContent.innerHTML =
          '<div class="placeholder-image"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>';
      }
      lightboxCounter.textContent = (lightboxIndex + 1) + ' / ' + galleryImages.length;
    }

    // Click on gallery item
    galleryEl.addEventListener('click', function (e) {
      var item = e.target.closest('.gallery-item');
      if (item) {
        openLightbox(parseInt(item.getAttribute('data-index'), 10));
      }
    });

    // Keyboard on gallery item
    galleryEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var item = e.target.closest('.gallery-item');
        if (item) {
          openLightbox(parseInt(item.getAttribute('data-index'), 10));
        }
      }
    });

    // Close
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Navigation
    prevBtn.addEventListener('click', function () {
      lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
      updateLightbox();
    });

    nextBtn.addEventListener('click', function () {
      lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
      updateLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightbox();
      }
      if (e.key === 'ArrowRight') {
        lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
        updateLightbox();
      }
    });
  }

  // ---- 404 / Not Found ----
  function showNotFound() {
    var titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = 'Project Not Found';

    var descEl = document.getElementById('project-description');
    if (descEl) descEl.textContent = 'The project you are looking for does not exist or has been removed.';

    var breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) breadcrumbTitle.textContent = 'Not Found';

    // Hide content sections
    ['project-info-section', 'project-csr-section', 'project-gallery-section', 'related-section'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Hide banner
    var banner = document.getElementById('project-banner');
    if (banner) banner.style.display = 'none';

    var meta = document.getElementById('project-meta');
    if (meta) meta.style.display = 'none';

    document.title = 'Project Not Found — Tinaht Portfolio';
  }

  // ---- Utility ----
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
