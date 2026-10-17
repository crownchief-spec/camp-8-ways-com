(function () {
  var Gate = window.JoyforestAdminGate;
  var isLocalPreview = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") && new URLSearchParams(window.location.search).get("preview") === "1";
  if (!Gate || (!isLocalPreview && !Gate.requireAuth("admin.html"))) return;

  var reader = document.querySelector("[data-manual-src]");
  if (!reader) return;

  document.body.hidden = false;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value, baseUrl) {
    try {
      var url = new URL(value, baseUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "#";
      return url.href;
    } catch (error) {
      return "#";
    }
  }

  function inlineMarkup(value, baseUrl) {
    var escaped = escapeHtml(value);
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, href) {
      var url = safeUrl(href, baseUrl);
      return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + label + "</a>";
    });
    return escaped;
  }

  function tableCells(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (cell) {
      return cell.trim();
    });
  }

  function isTableDivider(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line || "");
  }

  function isBlockStart(lines, index) {
    var line = lines[index] || "";
    var next = lines[index + 1] || "";
    return /^#{1,6}\s+/.test(line) || /^\s*([-*_])\1\1+\s*$/.test(line) || /^>\s?/.test(line) || /^\s*[-+*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line) || /^```/.test(line) || /^!\[[^\]]*\]\([^)]+\)\s*$/.test(line) || (line.indexOf("|") !== -1 && isTableDivider(next));
  }

  function renderMarkdown(markdown, baseUrl) {
    var lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    var html = [];
    var index = 0;

    while (index < lines.length) {
      var line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (/^```/.test(line)) {
        var code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
        continue;
      }

      var heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        var level = Math.min(6, heading[1].length + 1);
        html.push("<h" + level + ">" + inlineMarkup(heading[2], baseUrl) + "</h" + level + ">");
        index += 1;
        continue;
      }

      if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
        html.push("<hr>");
        index += 1;
        continue;
      }

      var image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (image) {
        var imageUrl = safeUrl(image[2], baseUrl);
        var alt = image[1] || "說明書原始頁面";
        var dimensions = imageUrl.indexOf("brush-cutter-bg-series") !== -1 ? ' width="1152" height="1536"' : "";
        html.push('<figure class="admin-manual-figure"><a href="' + escapeHtml(imageUrl) + '" target="_blank" rel="noopener"><img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(alt) + '" title="' + escapeHtml(alt) + '"' + dimensions + ' loading="lazy" decoding="async"></a><figcaption>' + escapeHtml(alt) + "（點圖可放大）</figcaption></figure>");
        index += 1;
        continue;
      }

      if (line.indexOf("|") !== -1 && isTableDivider(lines[index + 1])) {
        var headers = tableCells(line);
        index += 2;
        var rows = [];
        while (index < lines.length && lines[index].indexOf("|") !== -1 && lines[index].trim()) {
          rows.push(tableCells(lines[index]));
          index += 1;
        }
        html.push('<div class="admin-manual-table-wrap"><table><thead><tr>' + headers.map(function (cell) { return "<th>" + inlineMarkup(cell, baseUrl) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (row) { return "<tr>" + row.map(function (cell) { return "<td>" + inlineMarkup(cell, baseUrl) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>");
        continue;
      }

      if (/^>\s?/.test(line)) {
        var quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        html.push('<aside class="admin-manual-note">' + quote.map(function (item) { return "<p>" + inlineMarkup(item, baseUrl) + "</p>"; }).join("") + "</aside>");
        continue;
      }

      var unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      var ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        var listTag = ordered ? "ol" : "ul";
        var items = [];
        var matcher = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-+*]\s+(.+)$/;
        while (index < lines.length) {
          var item = lines[index].match(matcher);
          if (!item) break;
          items.push(item[1]);
          index += 1;
        }
        html.push("<" + listTag + ">" + items.map(function (item) { return "<li>" + inlineMarkup(item, baseUrl) + "</li>"; }).join("") + "</" + listTag + ">");
        continue;
      }

      var paragraph = [line.trim()];
      index += 1;
      while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      html.push("<p>" + inlineMarkup(paragraph.join(" "), baseUrl) + "</p>");
    }

    return html.join("\n");
  }

  var sourceUrl = new URL(reader.getAttribute("data-manual-src"), window.location.href);
  fetch(sourceUrl.href, { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then(function (markdown) {
      reader.innerHTML = renderMarkdown(markdown, sourceUrl.href);
      reader.removeAttribute("aria-busy");
    })
    .catch(function () {
      reader.innerHTML = '<p class="staff-error">說明書載入失敗，請重新整理；若問題持續，請回報管理者。</p>';
      reader.removeAttribute("aria-busy");
    });
})();
