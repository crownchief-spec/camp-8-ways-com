(function () {
  var Gate = window.JoyforestAdminGate;
  if (!Gate) return;

  var loginSection = document.getElementById("admin-login-section");
  var hubSection = document.getElementById("admin-hub-section");
  var logoutBtn = document.getElementById("admin-logout-btn");
  var loginForm = document.getElementById("admin-login-form");
  var passwordInput = document.getElementById("admin-password");
  var loginError = document.getElementById("admin-login-error");

  function showLoginError(msg) {
    loginError.textContent = msg || "";
    loginError.hidden = !msg;
  }

  function render(authed) {
    loginSection.hidden = authed;
    hubSection.hidden = !authed;
    logoutBtn.hidden = !authed;
    if (!authed) {
      showLoginError("");
      setTimeout(function () {
        passwordInput.focus();
      }, 0);
    }
  }

  function safeNextPage() {
    var next = new URLSearchParams(window.location.search).get("next") || "";
    var allowed = [
      "staff-availability.html",
      "admin-revenue.html",
      "admin-cleaning-sop.html",
      "admin-design-ideas.html"
    ];
    return allowed.indexOf(next) !== -1 ? next : "";
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    showLoginError("");

    Gate.login(passwordInput.value).then(function (result) {
      submitButton.disabled = false;
      if (result.ok) {
        passwordInput.value = "";
        var next = safeNextPage();
        if (next) {
          window.location.replace(next);
          return;
        }
        render(true);
        return;
      }
      showLoginError(result.error || "密碼錯誤，請再試一次。");
      passwordInput.select();
    });
  });

  logoutBtn.addEventListener("click", function () {
    logoutBtn.disabled = true;
    Gate.logout().then(function () {
      logoutBtn.disabled = false;
      render(false);
    });
  });

  Gate.checkSession().then(function (authed) {
    render(authed);
  });
})();
