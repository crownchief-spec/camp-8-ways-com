/**
 * Bilingual path pairs for header/footer language toggles.
 * Canonical URLs use trailing slashes on folder routes.
 */
(function (global) {
  var PAGE_PAIRS = [
    { zh: "/", en: "/en/" },
    { zh: "/index.html", en: "/en/" },
    { zh: "/en/", en: "/" },
    { zh: "/en/index.html", en: "/" },
    { zh: "/pages/balloon-tent/", en: "/en/pages/balloon-tent/" },
    { zh: "/pages/balloon-tent", en: "/en/pages/balloon-tent/" },
    { zh: "/pages/balloon-tent.html", en: "/en/pages/balloon-tent/" },
    { zh: "/en/pages/balloon-tent/", en: "/pages/balloon-tent/" },
    { zh: "/en/pages/balloon-tent", en: "/pages/balloon-tent/" },
    { zh: "/en/pages/balloon-tent.html", en: "/pages/balloon-tent/" },
    { zh: "/pages/cloud-tent/", en: "/en/pages/cloud-tent/" },
    { zh: "/pages/cloud-tent", en: "/en/pages/cloud-tent/" },
    { zh: "/pages/cloud-tent.html", en: "/en/pages/cloud-tent/" },
    { zh: "/en/pages/cloud-tent/", en: "/pages/cloud-tent/" },
    { zh: "/en/pages/cloud-tent", en: "/pages/cloud-tent/" },
    { zh: "/en/pages/cloud-tent.html", en: "/pages/cloud-tent/" },
    { zh: "/pages/party-event-space/", en: "/en/pages/party-event-space/" },
    { zh: "/pages/party-event-space", en: "/en/pages/party-event-space/" },
    { zh: "/pages/party-event-space.html", en: "/en/pages/party-event-space/" },
    { zh: "/en/pages/party-event-space/", en: "/pages/party-event-space/" },
    { zh: "/en/pages/party-event-space", en: "/pages/party-event-space/" },
    { zh: "/en/pages/party-event-space.html", en: "/pages/party-event-space/" },
    { zh: "/pages/availability/", en: "/en/pages/availability/" },
    { zh: "/pages/availability", en: "/en/pages/availability/" },
    { zh: "/pages/availability.html", en: "/en/pages/availability/" },
    { zh: "/en/pages/availability/", en: "/pages/availability/" },
    { zh: "/en/pages/availability", en: "/pages/availability/" },
    { zh: "/en/pages/availability.html", en: "/pages/availability/" },
    { zh: "/pages/booking/", en: "/en/pages/booking/" },
    { zh: "/pages/booking", en: "/en/pages/booking/" },
    { zh: "/pages/booking.html", en: "/en/pages/booking/" },
    { zh: "/en/pages/booking/", en: "/pages/booking/" },
    { zh: "/en/pages/booking", en: "/pages/booking/" },
    { zh: "/pages/balloon-tent-tv-guide.html", en: "/en/pages/balloon-tent/" },
    { zh: "/pages/balloon-tent-tv-guide", en: "/en/pages/balloon-tent/" },
    { zh: "/pages/cloud-tent-projector-guide.html", en: "/en/pages/cloud-tent/" },
    { zh: "/pages/cloud-tent-projector-guide", en: "/en/pages/cloud-tent/" },
    { zh: "/pages/facilities.html", en: "/en/pages/facilities/" },
    { zh: "/pages/facilities", en: "/en/pages/facilities/" },
    { zh: "/en/pages/facilities/", en: "/pages/facilities/" },
    { zh: "/en/pages/facilities", en: "/pages/facilities/" },
    { zh: "/pages/faq.html", en: "/en/pages/booking/" },
    { zh: "/pages/faq", en: "/en/pages/booking/" },
    { zh: "/pages/location.html", en: "/en/pages/booking/" },
    { zh: "/pages/location", en: "/en/pages/booking/" },
    { zh: "/pages/stories.html", en: "/en/seo/" },
    { zh: "/pages/stories", en: "/en/seo/" },
    { zh: "/pages/campervan.html", en: "/en/seo/campervan-travel/" },
    { zh: "/pages/campervan", en: "/en/seo/campervan-travel/" },
    { zh: "/seo/", en: "/en/seo/" },
    { zh: "/seo/index.html", en: "/en/seo/" },
    { zh: "/en/seo/", en: "/seo/" },
    { zh: "/en/seo/index.html", en: "/seo/" },
    { zh: "/pages/forest-graduation-photo/", en: "/en/pages/forest-graduation-photo/" },
    { zh: "/pages/forest-graduation-photo", en: "/en/pages/forest-graduation-photo/" },
    { zh: "/pages/forest-graduation-photo.html", en: "/en/pages/forest-graduation-photo/" },
    { zh: "/en/pages/forest-graduation-photo/", en: "/pages/forest-graduation-photo/" },
    { zh: "/en/pages/forest-graduation-photo", en: "/pages/forest-graduation-photo/" },
    { zh: "/pages/family-photography-party/", en: "/en/pages/family-photography-party/" },
    { zh: "/pages/family-photography-party", en: "/en/pages/family-photography-party/" },
    { zh: "/pages/family-photography-party.html", en: "/en/pages/family-photography-party/" },
    { zh: "/en/pages/family-photography-party/", en: "/pages/family-photography-party/" },
    { zh: "/en/pages/family-photography-party", en: "/pages/family-photography-party/" },
    { zh: "/pages/pet-photography-party/", en: "/en/pages/pet-photography-party/" },
    { zh: "/pages/pet-photography-party", en: "/en/pages/pet-photography-party/" },
    { zh: "/pages/pet-photography-party.html", en: "/en/pages/pet-photography-party/" },
    { zh: "/en/pages/pet-photography-party/", en: "/pages/pet-photography-party/" },
    { zh: "/en/pages/pet-photography-party", en: "/pages/pet-photography-party/" }
  ];

  function normalizePath(pathname) {
    if (!pathname) return "/";
    var p = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
    return p;
  }

  function withTrailingSlash(path) {
    if (!path || path === "/") return "/";
    if (path.indexOf(".") !== -1) return path;
    return path.endsWith("/") ? path : path + "/";
  }

  function resolveAlternateUrl(targetLocale) {
    var path = normalizePath(global.location.pathname);
    var i;
    for (i = 0; i < PAGE_PAIRS.length; i++) {
      var pair = PAGE_PAIRS[i];
      if (targetLocale === "en") {
        if (path === normalizePath(pair.zh)) return withTrailingSlash(pair.en);
      } else {
        if (path === normalizePath(pair.en)) return withTrailingSlash(pair.zh);
      }
    }
    var SEO_SLUG_ZH_TO_EN = {
      "taoyuan-glamping": "glamping-guide",
      "dome-glamping": "glamping-guide",
      "campervan-stay": "campervan-travel",
      "forest-camping": "forest-outdoor-experience",
      "forest-activities": "forest-outdoor-experience",
      "night-outdoor": "night-camping-atmosphere",
      "guide/night-outdoor-mood": "night-outdoor-atmosphere",
      "guide/weekend-outdoor-taoyuan": "taoyuan-outdoor-activities",
      "guide/first-camping-prep": "first-camping-trip",
      "guide/campervan-who": "who-campervan-travel",
      "guide/yangmei-easy-outings": "easy-yangmei-outdoor-trips",
      "guide/small-group-events": "small-private-event-planning",
      "guide/pet-camping-notes": "camping-with-pets",
      "guide/camping-faq-general": "common-camping-questions"
    };
    var SEO_SLUG_EN_TO_ZH = {
      "beginner-camping": "beginner-camping",
      "campervan-travel": "campervan-stay",
      "camping-gear": "camping-gear",
      "camping-photo-tips": "guide/camping-photo-tips",
      "camping-with-pets": "guide/pet-camping-notes",
      "choose-campsite": "guide/how-to-choose-campsite",
      "common-camping-questions": "guide/camping-faq-general",
      "easy-yangmei-outdoor-trips": "guide/yangmei-easy-outings",
      "family-camping-planning": "guide/family-camping-easier",
      "family-camping": "family-camping",
      "first-camping-trip": "guide/first-camping-prep",
      "forest-event-space": "guide/forest-space-charm",
      "forest-outdoor-experience": "forest-camping",
      "glamping-guide": "taoyuan-glamping",
      "glamping-vs-camping": "guide/glamping-vs-camping",
      "nearby-attractions": "nearby-attractions",
      "night-camping-atmosphere": "night-outdoor",
      "night-outdoor-atmosphere": "guide/night-outdoor-mood",
      "one-day-vs-overnight-event": "guide/one-day-vs-overnight",
      "outdoor-vs-indoor-gathering": "guide/outdoor-vs-indoor-gathering",
      "pet-friendly-camping": "pet-friendly-camping",
      "small-private-event-planning": "guide/small-group-events",
      "taoyuan-camping": "taoyuan-camping",
      "taoyuan-outdoor-activities": "guide/weekend-outdoor-taoyuan",
      "types-of-camping-taoyuan": "guide/taoyuan-camping-types",
      "who-campervan-travel": "guide/campervan-who",
      "yangmei-camping": "yangmei-camping"
    };

    if (targetLocale === "en") {
      if (path.indexOf("/pages/") === 0) {
        var zhPageSlug = path.replace(/^\/pages\//, "").replace(/\.html$/, "");
        if (zhPageSlug) return withTrailingSlash("/en/pages/" + zhPageSlug);
      }
      if (path.indexOf("/seo/") === 0) {
        var zhSeoSlug = path.replace(/^\/seo\//, "").replace(/\.html$/, "");
        if (zhSeoSlug && zhSeoSlug !== "index") {
          var enSeoFromZh = SEO_SLUG_ZH_TO_EN[zhSeoSlug] || zhSeoSlug.replace(/^guide\//, "");
          return withTrailingSlash("/en/seo/" + enSeoFromZh);
        }
      }
      return "/en/";
    }
    if (path.indexOf("/en/pages/") === 0) {
      var enPageSlug = path.replace(/^\/en\/pages\//, "");
      if (enPageSlug) return "/pages/" + enPageSlug + ".html";
    }
    if (path.indexOf("/en/seo/") === 0) {
      var enSeoSlug = path.replace(/^\/en\/seo\//, "");
      if (enSeoSlug) {
        var zhSeoFromEn = SEO_SLUG_EN_TO_ZH[enSeoSlug] || enSeoSlug;
        return "/seo/" + zhSeoFromEn + ".html";
      }
    }
    if (path.indexOf("/en/") === 0) {
      var zhPath = path.replace(/^\/en/, "") || "/";
      if (zhPath.indexOf("/pages/") === 0 && zhPath.indexOf(".") === -1) {
        return zhPath + ".html";
      }
      return withTrailingSlash(zhPath);
    }
    return "/";
  }

  function initLangSwitchLinks() {
    document.querySelectorAll("[data-lang-switch]").forEach(function (el) {
      var target = el.getAttribute("data-lang-switch");
      if (target === "to-en") {
        el.setAttribute("href", resolveAlternateUrl("en"));
        el.setAttribute("hreflang", "en");
        el.setAttribute("lang", "en");
      } else if (target === "to-zh") {
        el.setAttribute("href", resolveAlternateUrl("zh"));
        el.setAttribute("hreflang", "zh-Hant");
        el.setAttribute("lang", "zh-Hant");
      }
    });
  }

  global.JoyforestLangSwitch = {
    resolveAlternateUrl: resolveAlternateUrl,
    initLangSwitchLinks: initLangSwitchLinks
  };
})(window);
