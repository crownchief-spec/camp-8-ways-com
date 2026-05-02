(function () {
  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initPetPhotographyGallery() {
    var root = qs("#pet-photo-lightbox");
    var grid = qs("[data-pet-gallery]");
    if (!root || !grid) return;

    var items = qsa(".pet-gallery__item", grid);
    var slides = items.map(function (btn) {
      return {
        full: btn.getAttribute("data-full"),
        caption: btn.getAttribute("data-caption") || "",
        alt: btn.getAttribute("data-img-alt") || "",
      };
    });

    var imgEl = qs(".pet-lightbox__img", root);
    var capEl = qs(".pet-lightbox__cap", root);
    var cur = 0;

    function trapFocus(e) {
      if (e.key === "Tab" && root && !root.hidden) {
        var focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root).filter(function (el) {
          return !el.hasAttribute("disabled");
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function open(index) {
      cur = index;
      var s = slides[cur];
      if (!s || !s.full) return;
      imgEl.src = s.full;
      imgEl.alt = s.alt;
      capEl.textContent = s.caption;
      root.hidden = false;
      document.body.style.overflow = "hidden";
      qs(".pet-lightbox__close", root).focus();
    }

    function close() {
      root.hidden = true;
      imgEl.removeAttribute("src");
      document.body.style.overflow = "";
    }

    function show(delta) {
      cur = (cur + delta + slides.length) % slides.length;
      open(cur);
    }

    items.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        open(i);
      });
    });

    qs(".pet-lightbox__close", root).addEventListener("click", close);
    qs(".pet-lightbox__prev", root).addEventListener("click", function (e) {
      e.stopPropagation();
      show(-1);
    });
    qs(".pet-lightbox__next", root).addEventListener("click", function (e) {
      e.stopPropagation();
      show(1);
    });
    root.addEventListener("click", function (e) {
      if (e.target === root) close();
    });

    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(-1);
      else if (e.key === "ArrowRight") show(1);
    });

    root.addEventListener("keydown", trapFocus);

    var sx = 0;
    var sy = 0;
    root.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length !== 1) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      function (e) {
        if (!sx || e.changedTouches.length !== 1) return;
        var dx = e.changedTouches[0].clientX - sx;
        var dy = e.changedTouches[0].clientY - sy;
        sx = sy = 0;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) show(1);
        else show(-1);
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetPhotographyGallery);
  } else {
    initPetPhotographyGallery();
  }
})();
