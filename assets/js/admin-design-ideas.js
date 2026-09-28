(function () {
  var Gate = window.JoyforestAdminGate;
  var isLocalPreview = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") && new URLSearchParams(window.location.search).get("preview") === "1";
  if (!Gate || (!isLocalPreview && !Gate.requireAuth("admin.html"))) return;

  var STORAGE_KEY = "joyforest_admin_design_ideas_order_v1";
  var list = document.getElementById("design-idea-list");
  var status = document.getElementById("design-save-status");
  var activeCard = null;
  var activePointerId = null;
  var orderBeforeDrag = "";
  var statusTimer = null;

  document.body.hidden = false;

  function cards() {
    return Array.prototype.slice.call(list.querySelectorAll(".design-idea-card"));
  }

  function currentOrder() {
    return cards().map(function (card) { return card.dataset.designId; });
  }

  function updateNumbers() {
    cards().forEach(function (card, index) {
      var number = card.querySelector(".design-idea-number");
      if (number) number.textContent = String(index + 1).padStart(2, "0");
      var up = card.querySelector('[data-move="up"]');
      var down = card.querySelector('[data-move="down"]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === cards().length - 1;
    });
  }

  function showStatus(message, isError) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    status.classList.add("is-saved");
    statusTimer = window.setTimeout(function () {
      status.classList.remove("is-saved");
      status.textContent = "共 " + cards().length + " 項構想｜此瀏覽器會自動保存排序";
    }, 1800);
  }

  function saveOrder() {
    updateNumbers();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder()));
      showStatus("順序已儲存", false);
    } catch (error) {
      showStatus("目前瀏覽器無法儲存排序", true);
    }
  }

  function restoreOrder() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      saved = [];
    }
    if (Array.isArray(saved)) {
      var originalCards = cards();
      var byId = {};
      originalCards.forEach(function (card) { byId[card.dataset.designId] = card; });
      var restoredIds = {};
      saved.forEach(function (id) {
        if (byId[id]) {
          list.appendChild(byId[id]);
          restoredIds[id] = true;
        }
      });
      originalCards.forEach(function (card) {
        if (!restoredIds[card.dataset.designId]) list.appendChild(card);
      });
    }
    updateNumbers();
    status.textContent = "共 " + cards().length + " 項構想｜此瀏覽器會自動保存排序";
  }

  function moveCard(card, direction) {
    if (direction === "up" && card.previousElementSibling) {
      list.insertBefore(card, card.previousElementSibling);
      saveOrder();
    }
    if (direction === "down" && card.nextElementSibling) {
      list.insertBefore(card.nextElementSibling, card);
      saveOrder();
    }
  }

  list.addEventListener("click", function (event) {
    var button = event.target.closest(".design-move-btn");
    if (!button) return;
    moveCard(button.closest(".design-idea-card"), button.dataset.move);
  });

  list.querySelectorAll(".design-drag-handle").forEach(function (handle) {
    handle.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      moveCard(handle.closest(".design-idea-card"), event.key === "ArrowUp" ? "up" : "down");
      handle.focus();
    });

    handle.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      activeCard = handle.closest(".design-idea-card");
      activePointerId = event.pointerId;
      orderBeforeDrag = currentOrder().join("|");
      handle.setPointerCapture(event.pointerId);
      activeCard.classList.add("is-dragging");
      document.body.classList.add("is-sorting-design-ideas");
    });
  });

  document.addEventListener("pointermove", function (event) {
    if (!activeCard || event.pointerId !== activePointerId) return;
    event.preventDefault();
    var element = document.elementFromPoint(event.clientX, event.clientY);
    var target = element && element.closest ? element.closest(".design-idea-card") : null;
    if (target && target !== activeCard && target.parentNode === list) {
      var rect = target.getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) list.insertBefore(activeCard, target);
      else list.insertBefore(activeCard, target.nextElementSibling);
      updateNumbers();
    }
    if (event.clientY < 90) window.scrollBy(0, -18);
    if (event.clientY > window.innerHeight - 90) window.scrollBy(0, 18);
  }, { passive: false });

  function endDrag(event) {
    if (!activeCard || (event && event.pointerId !== activePointerId)) return;
    activeCard.classList.remove("is-dragging");
    document.body.classList.remove("is-sorting-design-ideas");
    var changed = currentOrder().join("|") !== orderBeforeDrag;
    activeCard = null;
    activePointerId = null;
    if (changed) saveOrder();
  }

  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) restoreOrder();
  });

  restoreOrder();
})();
