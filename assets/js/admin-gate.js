(function (global) {
  var STORAGE_KEY = "joyforest_admin_auth";
  var ADMIN_PASSWORD = "5551";

  function isAuthed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function setAuthed(ok) {
    try {
      if (ok) sessionStorage.setItem(STORAGE_KEY, "1");
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function tryLogin(password) {
    var ok = String(password || "").trim() === ADMIN_PASSWORD;
    if (ok) setAuthed(true);
    return ok;
  }

  function logout() {
    setAuthed(false);
  }

  function requireAuth(loginPath) {
    if (isAuthed()) return true;
    var target = loginPath || "admin.html";
    window.location.replace(target);
    return false;
  }

  global.JoyforestAdminGate = {
    isAuthed: isAuthed,
    tryLogin: tryLogin,
    logout: logout,
    requireAuth: requireAuth
  };
})(window);
