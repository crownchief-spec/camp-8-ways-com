(function () {
  if (!window.JoyforestAdminGate || !window.JoyforestAdminGate.requireAuth("admin.html")) {
    return;
  }
  document.body.hidden = false;
})();
