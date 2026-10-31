(function () {
  const grid = document.querySelector("[data-story-grid]");
  if (!grid) return;

  const buttons = Array.from(document.querySelectorAll("[data-story-filter]"));
  const status = document.querySelector("[data-story-status]");
  const empty = document.querySelector("[data-story-empty]");
  const tagCloud = document.querySelector("[data-story-tag-cloud]");
  const base = document.body.dataset.base || "./";
  const discoveryTags = [
    "親子寫真", "家庭寫真", "家庭照", "寵物攝影", "寵物寫真", "毛小孩寫真", "棚拍", "外拍", "森林外拍", "白背景棚拍", "三代同堂", "生日攝影",
    "戶外電影院", "景觀浴缸", "美式瓦斯烤肉", "戶外燈光", "KTV 歡唱",
    "圓頂帳篷", "私人草地", "森林景觀", "戶外料理", "免裝備露營", "場地租借",
    "寵物友善", "親子友善", "好友包場", "家庭包場", "情侶旅行", "一個人旅行",
    "親子攝影", "女孩寫真", "多犬家庭",
  ];
  let articles = [];
  let activeCategory = "全部";
  const selectedTag = new URLSearchParams(window.location.search).get("tag") || "";

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
      return '<a class="story-card__tag" href="/pages/stories.html?tag=' + encodeURIComponent(tag) + '#latest-stories">' + escapeHtml(tag) + "</a>";
    }).join("");
    const collaborators = (article.collaborators || []).map(function (account) {
      return '<a href="' + escapeHtml(account.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(account.handle) + "</a>";
    }).join("、");
    return '<article class="story-card">' +
      '<a class="story-card__media" href="' + escapeHtml(article.path) + '">' +
        '<img src="' + escapeHtml(article.thumbnailImage) + '" alt="' + escapeHtml(article.thumbnailImageAlt) + '" title="' + escapeHtml(article.title) + '" width="' + escapeHtml(article.thumbnailImageWidth) + '" height="' + escapeHtml(article.thumbnailImageHeight) + '" loading="lazy" decoding="async">' +
      "</a>" +
      '<div class="story-card__body">' +
        '<div class="story-card__meta"><span>' + escapeHtml(article.category) + "</span><time datetime=\"" + escapeHtml(article.publishedDate) + '\">' + escapeHtml(formatDate(article.publishedDate)) + "</time></div>" +
        '<h3><a href="' + escapeHtml(article.path) + '">' + escapeHtml(article.title) + "</a></h3>" +
        "<p>" + escapeHtml(article.description) + "</p>" +
        (collaborators ? '<p class="story-card__collaborators"><span>合作／真實分享：</span>' + collaborators + "</p>" : "") +
        (tags ? '<div class="story-card__tags">' + tags + "</div>" : "") +
        '<a class="story-card__link" href="' + escapeHtml(article.path) + '">閱讀完整故事 <span aria-hidden="true">→</span></a>' +
      "</div></article>";
  }

  function render() {
    const shown = articles.filter(function (item) {
      const categoryMatches = activeCategory === "全部" || item.category === activeCategory;
      const tagMatches = !selectedTag || (item.tags || []).includes(selectedTag);
      return categoryMatches && tagMatches;
    });
    grid.innerHTML = shown.map(card).join("");
    empty.hidden = shown.length !== 0;
    if (!shown.length) {
      status.textContent = selectedTag ? "目前沒有符合「" + selectedTag + "」的文章" : "目前沒有這個分類的文章";
    } else if (selectedTag) {
      status.innerHTML = '關鍵字「<strong>' + escapeHtml(selectedTag) + '</strong>」共 ' + shown.length + ' 篇文章　<a href="/pages/stories.html#latest-stories">清除關鍵字</a>';
    } else {
      status.textContent = "共 " + shown.length + " 篇文章";
    }
  }

  function renderTagCloud() {
    if (!tagCloud) return;
    const counts = new Map();
    articles.forEach(function (article) {
      (article.tags || []).forEach(function (tag) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    const tags = discoveryTags
      .filter(function (tag) { return counts.has(tag) || tag === selectedTag; })
      .map(function (tag) { return [tag, counts.get(tag) || 0]; });
    tagCloud.innerHTML = tags.map(function (entry) {
      const active = entry[0] === selectedTag ? " is-active" : "";
      return '<a class="story-keyword' + active + '" href="/pages/stories.html?tag=' + encodeURIComponent(entry[0]) + '#latest-stories">' + escapeHtml(entry[0]) + '<span>' + entry[1] + '</span></a>';
    }).join("");
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      buttons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      activeCategory = button.dataset.storyFilter;
      render();
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
      renderTagCloud();
      render();
    })
    .catch(function () {
      status.textContent = "森林故事暫時無法載入";
      empty.hidden = false;
    });
})();
