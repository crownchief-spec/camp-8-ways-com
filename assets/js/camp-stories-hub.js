(function () {
  const grid = document.querySelector("[data-story-grid]");
  if (!grid) return;

  const buttons = Array.from(document.querySelectorAll("[data-story-filter]"));
  const status = document.querySelector("[data-story-status]");
  const empty = document.querySelector("[data-story-empty]");
  const base = document.body.dataset.base || "./";
  let articles = [];

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value + "T00:00:00+08:00"));
  }

  function card(article) {
    const tags = (article.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="story-card__tag">' + escapeHtml(tag) + "</span>";
    }).join("");
    return '<article class="story-card">' +
      '<a class="story-card__media" href="' + escapeHtml(article.path) + '">' +
        '<img src="' + escapeHtml(article.thumbnailImage) + '" alt="' + escapeHtml(article.thumbnailImageAlt) + '" title="' + escapeHtml(article.title) + '" width="' + escapeHtml(article.thumbnailImageWidth) + '" height="' + escapeHtml(article.thumbnailImageHeight) + '" loading="lazy" decoding="async">' +
      "</a>" +
      '<div class="story-card__body">' +
        '<div class="story-card__meta"><span>' + escapeHtml(article.category) + "</span><time datetime=\"" + escapeHtml(article.publishedDate) + '\">' + escapeHtml(formatDate(article.publishedDate)) + "</time></div>" +
        '<h3><a href="' + escapeHtml(article.path) + '">' + escapeHtml(article.title) + "</a></h3>" +
        "<p>" + escapeHtml(article.description) + "</p>" +
        (tags ? '<div class="story-card__tags">' + tags + "</div>" : "") +
        '<a class="story-card__link" href="' + escapeHtml(article.path) + '">閱讀完整故事 <span aria-hidden="true">→</span></a>' +
      "</div></article>";
  }

  function render(filter) {
    const shown = filter === "全部" ? articles : articles.filter(function (item) {
      return item.category === filter;
    });
    grid.innerHTML = shown.map(card).join("");
    empty.hidden = shown.length !== 0;
    status.textContent = shown.length ? "共 " + shown.length + " 篇文章" : "目前沒有這個分類的文章";
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      buttons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render(button.dataset.storyFilter);
    });
  });

  fetch(base + "assets/data/camp-stories-articles.json")
    .then(function (response) {
      if (!response.ok) throw new Error("stories data failed");
      return response.json();
    })
    .then(function (data) {
      articles = (data.articles || []).filter(function (item) {
        return item.status === "published" && item.privacy === "public";
      });
      render("全部");
    })
    .catch(function () {
      status.textContent = "森林故事暫時無法載入";
      empty.hidden = false;
    });
})();
