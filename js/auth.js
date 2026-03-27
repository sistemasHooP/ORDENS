window.Auth = (function () {
  function getToken() {
    return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN) || '';
  }

  function getUser() {
    return AppUtils.getStoredJson(APP_CONFIG.STORAGE_KEYS.USER, null);
  }

  function setSession(authData) {
    if (!authData || !authData.token) {
      throw new Error('Dados de autenticacao invalidos.');
    }
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TOKEN, authData.token);
    AppUtils.setStoredJson(APP_CONFIG.STORAGE_KEYS.USER, authData.usuario || null);
  }

  function clearSession() {
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
  }

  async function login(loginValue, senhaValue) {
    var result = await Api.login(loginValue, senhaValue);
    setSession(result);
    return result;
  }

  async function logout() {
    try {
      await Api.logout();
    } catch (err) {
      console.warn('Falha ao notificar logout no backend:', err);
    } finally {
      clearSession();
    }
  }

  function isPublicPage() {
    var page = window.location.pathname.split('/').pop();
    return !page || page === 'index.html';
  }

  async function validateSession() {
    var token = getToken();
    if (!token) return false;
    try {
      var resp = await Api.validarSessao();
      if (!resp || !resp.valido) return false;
      if (resp.usuario) AppUtils.setStoredJson(APP_CONFIG.STORAGE_KEYS.USER, resp.usuario);
      return true;
    } catch (err) {
      return false;
    }
  }

  function redirectToLogin() {
    window.location.href = 'index.html';
  }

  function redirectToDashboard() {
    window.location.href = 'dashboard.html';
  }

  function fillSessionUi() {
    var user = getUser();
    var name = user && (user.NOME || user.nome || user.LOGIN || user.login) ? (user.NOME || user.nome || user.LOGIN || user.login) : 'Usuário';
    AppUtils.qsa('[data-session-user]').forEach(function (el) {
      el.textContent = name;
    });
  }

  function bindLogoutButtons() {
    AppUtils.qsa('[data-logout]').forEach(function (btn) {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async function () {
        var confirmed = window.confirm('Deseja realmente sair do sistema?');
        if (!confirmed) return;
        await logout();
        redirectToLogin();
      });
    });
  }

  async function ensureAuthenticatedPage() {
    if (isPublicPage()) return true;
    var valid = await validateSession();
    if (!valid) {
      clearSession();
      redirectToLogin();
      return false;
    }
    fillSessionUi();
    bindLogoutButtons();
    return true;
  }

  async function initLoginPage() {
    if (!isPublicPage()) return;

    var hasToken = !!getToken();
    if (hasToken) {
      var isValid = await validateSession();
      if (isValid) {
        redirectToDashboard();
        return;
      }
      clearSession();
    }

    var form = AppUtils.qs('#loginForm');
    var loginInput = AppUtils.qs('#login');
    var senhaInput = AppUtils.qs('#senha');
    var btnSubmit = AppUtils.qs('#btnEntrar');
    var errorBox = AppUtils.qs('#loginError');

    if (!form) return;

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      errorBox.textContent = '';
      errorBox.classList.remove('show');

      var loginValue = AppUtils.safeString(loginInput.value);
      var senhaValue = AppUtils.safeString(senhaInput.value);

      if (!loginValue || !senhaValue) {
        errorBox.textContent = 'Informe login e senha.';
        errorBox.classList.add('show');
        return;
      }

      AppUtils.setLoading(btnSubmit, true, 'Entrando...');
      try {
        await login(loginValue, senhaValue);
        AppUtils.showToast('Login realizado com sucesso.', 'success');
        redirectToDashboard();
      } catch (err) {
        errorBox.textContent = AppUtils.getErrorMessage(err);
        errorBox.classList.add('show');
      } finally {
        AppUtils.setLoading(btnSubmit, false);
      }
    });
  }

  return {
    getToken: getToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    login: login,
    logout: logout,
    validateSession: validateSession,
    fillSessionUi: fillSessionUi,
    bindLogoutButtons: bindLogoutButtons,
    ensureAuthenticatedPage: ensureAuthenticatedPage,
    initLoginPage: initLoginPage
  };
})();
