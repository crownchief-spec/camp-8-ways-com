(function (global) {
  var STORAGE_KEY = "joyforest_admin_auth";
  var API_BASE = "/api/staff-auth";

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

  function request(path, options) {
    var config = Object.assign(
      {
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" }
      },
      options || {}
    );

    return fetch(API_BASE + path, config).then(function (res) {
      return res
        .json()
        .catch(function () {
          return { ok: false, error: "伺服器回應格式錯誤。" };
        })
        .then(function (data) {
          return { res: res, data: data };
        });
    });
  }

  function checkSession() {
    return request("/session")
      .then(function (result) {
        var ok = Boolean(result.res.ok && result.data.authenticated);
        setAuthed(ok);
        return ok;
      })
      .catch(function () {
        setAuthed(false);
        return false;
      });
  }

  function login(password) {
    return request("/login", {
      method: "POST",
      body: JSON.stringify({ password: String(password || "").trim() })
    })
      .then(function (result) {
        var ok = Boolean(result.res.ok && result.data.ok);
        setAuthed(ok);
        return {
          ok: ok,
          error: result.data.error || (ok ? "" : "登入失敗，請再試一次。")
        };
      })
      .catch(function () {
        setAuthed(false);
        return { ok: false, error: "目前無法登入，請稍後再試一次。" };
      });
  }

  function logout() {
    setAuthed(false);
    return request("/logout", { method: "POST", body: "{}" }).catch(function () {
      return null;
    });
  }

  function requireAuth(loginPath) {
    if (isAuthed()) return true;
    var target = loginPath || "admin.html";
    window.location.replace(target);
    return false;
  }

  function clearLocalSession() {
    setAuthed(false);
  }

  global.JoyforestAdminGate = {
    isAuthed: isAuthed,
    checkSession: checkSession,
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    clearLocalSession: clearLocalSession
  };
})(window);
