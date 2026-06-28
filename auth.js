const Auth = {

  API_URL: window.APP_CONFIG && window.APP_CONFIG.API_URL ? window.APP_CONFIG.API_URL : '',

  getToken: function () {
    return sessionStorage.getItem('hc_token');
  },

  isLoggedIn: function () {
    const token = this.getToken();
    if (!token) return false;
    const ts = parseInt(sessionStorage.getItem('hc_token_ts') || '0', 10);
    const elapsed = Date.now() - ts;
    const TTL = 8 * 60 * 60 * 1000;
    if (elapsed > TTL) {
      this.logout();
      return false;
    }
    return true;
  },

  login: async function (user, pass) {
    const timestamp = Date.now().toString();
    const body = new URLSearchParams();
    body.append('action', 'login');
    body.append('user', user);
    body.append('pass', pass);
    body.append('timestamp', timestamp);

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body
    });

    const result = await response.json();

    if (result.ok && result.token) {
      sessionStorage.setItem('hc_token', result.token);
      sessionStorage.setItem('hc_token_ts', Date.now().toString());
      return { ok: true };
    }

    return { ok: false, message: result.message || 'Error de autenticación.' };
  },

  logout: function () {
    sessionStorage.removeItem('hc_token');
    sessionStorage.removeItem('hc_token_ts');
    localStorage.removeItem('domestic_finance_data');
    window.location.reload();
  }
};
