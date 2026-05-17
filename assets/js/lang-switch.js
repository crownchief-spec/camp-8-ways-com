/**
 * Bilingual path pairs for header/footer language toggles.
 */
(function (global) {
  var PAGE_PAIRS = [
    { zh: "/", en: "/en/" },
    { zh: "/index.html", en: "/en/" },
    { zh: "/en/", en: "/" },
    { zh: "/en/index.html", en: "/" },
    { zh: "/pages/balloon-tent", en: "/en/pages/balloon-tent" },
    { zh: "/pages/balloon-tent.html", en: "/en/pages/balloon-tent" },
    { zh: "/en/pages/balloon-tent", en: "/pages/balloon-tent" },
    { zh: "/en/pages/balloon-tent.html", en: "/pages/balloon-tent" },
    { zh: "/pages/cloud-tent", en: "/en/pages/cloud-tent" },
    { zh: "/pages/cloud-tent.html", en: "/en/pages/cloud-tent" },
    { zh: "/en/pages/cloud-tent", en: "/pages/cloud-tent" },
    { zh: "/en/pages/cloud-tent.html", en: "/pages/cloud-tent" },
    { zh: "/pages/party-event-space", en: "/en/pages/party-event-space" },
    { zh: "/pages/party-event-space.html", en: "/en/pages/party-event-space" },
    { zh: "/en/pages/party-event-space", en: "/pages/party-event-space" },
    { zh: "/en/pages/party-event-space.html", en: "/pages/party-event-space" },
    { zh: "/pages/availability", en: "/en/pages/availability" },
    { zh: "/pages/availability.html", en: "/en/pages/availability" },
    { zh: "/en/pages/availability", en: "/pages/availability" },
    { zh: "/en/pages/availability.html", en: "/pages/availability" }
  ];

  function normalizePath(pathname) {
    if (!pathname) return "/";
    var p = pathname.replace(/\/+$/, "") || "/";
    return p;
  }

  function resolveAlternateUrl(targetLocale) {
    var path = normalizePath(global.location.pathname);
    var i;
    for (i = 0; i < PAGE_PAIRS.length; i++) {
      var pair = PAGE_PAIRS[i];
      if (targetLocale === "en") {
        if (path === normalizePath(pair.zh)) return pair.en;
      } else {
        if (path === normalizePath(pair.en)) return pair.zh;
      }
    }
    if (targetLocale === "en") {
      if (path.indexOf("/en/") === 0) return path;
      return "/en/";
    }
    if (path.indexOf("/en/") === 0) return path.replace(/^\/en/, "") || "/";
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
