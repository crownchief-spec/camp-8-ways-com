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

  function render() {
    var authed = Gate.isAuthed();
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

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (Gate.tryLogin(passwordInput.value)) {
      passwordInput.value = "";
      showLoginError("");
      render();
      return;
    }
    showLoginError("密碼錯誤，請再試一次。");
    passwordInput.select();
  });

  logoutBtn.addEventListener("click", function () {
    Gate.logout();
    render();
  });

  render();
})();
