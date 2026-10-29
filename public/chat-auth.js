/**
 * Cliente Auth0 SPA (PKCE) + Socket.IO autenticado.
 * CDN UMD: createAuth0Client vive en window.auth0.createAuth0Client
 * (no como global suelta). La instancia del cliente se guarda en state.auth0Client.
 */
(function (window, $) {
  'use strict';

  var state = {
    auth0Client: null,
    socket: null,
    config: null,
    colorHex: '',
    user: null,
    uiBound: false,
    initInFlight: false
  };

  var AUTH0_CDN =
    'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.1.3/dist/auth0-spa-js.production.js';

  function el(id) {
    return document.getElementById(id);
  }

  function show(id, visible) {
    var node = el(id);
    if (!node) return;
    node.hidden = !visible;
  }

  function setBusy(busy) {
    ['btn-login', 'btn-retry', 'btn-logout'].forEach(function (id) {
      var node = el(id);
      if (node) node.disabled = !!busy;
    });
    var send = document.querySelector('#chat-panel form button[type="submit"]');
    if (send) {
      send.disabled = !!busy;
    }
  }

  /**
   * @param {string} message Mensaje principal comprensible
   * @param {string} [kind]
   * @param {string} [detail] Diagnóstico técnico opcional (sin secretos)
   */
  function setStatus(message, kind, detail) {
    var box = el('auth-status');
    if (!box) return;
    var title = box.querySelector('.auth-status__title');
    if (!title) {
      title = document.createElement('p');
      title.className = 'auth-status__title';
      box.insertBefore(title, box.firstChild);
    }
    title.textContent = message || '';
    box.className = 'auth-status' + (kind ? ' auth-status--' + kind : '');

    var tech = el('auth-tech');
    var detailNode = el('auth-status-detail');
    if (tech && detailNode) {
      if (detail) {
        detailNode.textContent = detail;
        tech.hidden = false;
      } else {
        detailNode.textContent = '';
        tech.hidden = true;
      }
    }
  }

  function setChatBanner(message, kind) {
    var banner = el('chat-banner');
    if (!banner) return;
    if (!message) {
      banner.hidden = true;
      banner.textContent = '';
      banner.className = 'chat-banner';
      return;
    }
    banner.hidden = false;
    banner.textContent = message;
    banner.className = 'chat-banner' + (kind === 'error' ? ' chat-banner--error' : kind === 'warn' ? ' chat-banner--warn' : '');
  }

  function appendMessage(msgJson) {
    var mine =
      state.user &&
      msgJson.userId &&
      state.user.sub &&
      String(msgJson.userId) === String(state.user.sub);
    var li = $('<li>')
      .addClass('msg')
      .addClass(mine ? 'msg--mine' : 'msg--other');
    var meta = $('<div>').addClass('msg__meta');
    var name = $('<span>')
      .addClass('msg__name')
      .css('color', msgJson.color || '#0b3a6a')
      .text(msgJson.nombre || 'Anónimo');
    meta.append(name);
    if (mine) {
      meta.append($('<span>').addClass('msg__you').text('Vos'));
    }
    var body = $('<div>').addClass('msg__body').html(msgJson.mensaje || '');
    li.append(meta).append(body);
    $('#vacio').hide();
    $('#messages').append(li);
    window.scrollTo(0, document.body.scrollHeight);
  }

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function looksLikeProviderSubject(value, sub) {
    var text = value == null ? '' : String(value).trim();
    if (!text) return true;
    if (sub && text === String(sub)) return true;
    return /^(google-oauth2|auth0|facebook|github|windowslive|twitter|apple|linkedin|line|oauth2)\|/i.test(
      text
    );
  }

  function displayName(user) {
    if (!user) return 'Usuario';
    var candidates = [user.name, user.nickname, user.given_name, user.email];
    for (var i = 0; i < candidates.length; i++) {
      var value = candidates[i] == null ? '' : String(candidates[i]).trim();
      if (value && !looksLikeProviderSubject(value, user.sub)) {
        return value;
      }
    }
    return 'Usuario';
  }

  function renderIdentity(user) {
    state.user = user;
    el('user-name').textContent = displayName(user);
    el('user-email').textContent = user && user.email ? user.email : (user && user.sub ? user.sub : '');
    var img = el('user-picture');
    if (user && user.picture) {
      img.src = user.picture;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
  }

  function disconnectSocket() {
    if (state.socket) {
      state.socket.removeAllListeners();
      state.socket.disconnect();
      state.socket = null;
    }
    $('#messages').empty();
    show('vacio', true);
    el('vacio').textContent = 'La conversación está vacía. Escribe el primer mensaje.';
  }

  /**
   * Factory del SDK UMD. No confundir window.auth0 (namespace) con auth0Client (instancia).
   */
  function getCreateAuth0Client() {
    if (window.__AUTH0_SDK_LOAD_ERROR__) {
      var loadErr = new Error(
        'El navegador no pudo descargar el SDK de Auth0 (' + AUTH0_CDN + '). ' +
        'Comprobá la conexión o un bloqueador y recargá con Ctrl+F5.'
      );
      loadErr.code = 'SDK_MISSING';
      throw loadErr;
    }
    var ns = window.auth0;
    if (!ns || typeof ns.createAuth0Client !== 'function') {
      var err = new Error(
        'El SDK de Auth0 no está disponible (se espera window.auth0.createAuth0Client). ' +
        'Recargá con Ctrl+F5. Si el problema continúa, el CDN puede estar bloqueado.'
      );
      err.code = 'SDK_MISSING';
      throw err;
    }
    return ns.createAuth0Client;
  }

  async function getAccessToken() {
    if (window.__E2E_ACCESS_TOKEN__) {
      return window.__E2E_ACCESS_TOKEN__;
    }
    return state.auth0Client.getTokenSilently({
      authorizationParams: {
        audience: state.config.audience,
        redirect_uri: state.config.redirectUri
      }
    });
  }

  function connectChat() {
    disconnectSocket();
    setStatus('Conectando al chat…', 'loading');

    return getAccessToken()
      .then(function (token) {
        var url = state.config.socketUrl || window.location.origin;
        state.socket = io(url, {
          auth: { token: token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000
        });

        state.socket.on('connect', function () {
          setStatus('Conectado al chat.', 'ok');
          setChatBanner('Conectado. Los mensajes se sincronizan en tiempo real.', null);
          setBusy(false);
          show('chat-panel', true);
          show('auth-gate', false);
          var shell = el('auth-shell');
          if (shell) shell.hidden = true;
          window.clearTimeout(state.bannerTimer);
          state.bannerTimer = window.setTimeout(function () {
            var banner = el('chat-banner');
            if (banner && !banner.classList.contains('chat-banner--error') && !banner.classList.contains('chat-banner--warn')) {
              setChatBanner('');
            }
          }, 4000);
        });

        state.socket.on('auth:ready', function (identity) {
          var current = state.user || {};
          var serverName = identity && identity.name ? identity.name : '';
          var keepClientName =
            current.name &&
            !looksLikeProviderSubject(current.name, current.sub || (identity && identity.sub)) &&
            looksLikeProviderSubject(serverName, identity && identity.sub);
          renderIdentity({
            name: keepClientName ? current.name : serverName || current.name,
            email: (identity && identity.email) || current.email || '',
            picture: (identity && identity.picture) || current.picture || '',
            nickname: current.nickname,
            given_name: current.given_name,
            sub: (identity && identity.sub) || current.sub
          });
        });

        state.socket.on('auth:expired', function (payload) {
          setChatBanner((payload && payload.message) || 'Sesión expirada.', 'error');
          setStatus(
            (payload && payload.message) || 'Tu sesión expiró. Volvé a iniciar sesión.',
            'error'
          );
          disconnectSocket();
          show('chat-panel', false);
          var shell = el('auth-shell');
          if (shell) shell.hidden = false;
          show('auth-gate', true);
          show('btn-login', true);
          show('btn-retry', true);
          setBusy(false);
        });

        state.socket.on('connect_error', function (err) {
          var msg = (err && err.message) || '';
          if (msg === 'AUTH_REQUIRED' || msg === 'AUTH_INVALID') {
            setStatus('No autorizado. Iniciá sesión de nuevo.', 'error');
            show('auth-gate', true);
            var shell = el('auth-shell');
            if (shell) shell.hidden = false;
            show('chat-panel', false);
            show('btn-login', true);
            show('btn-retry', true);
          } else {
            setChatBanner('No se pudo conectar al chat. Reintentando…', 'warn');
            setStatus('No se pudo conectar al chat. Comprobá tu red e intentá de nuevo.', 'error');
            show('btn-retry', true);
          }
          setBusy(false);
        });

        state.socket.on('disconnect', function () {
          setChatBanner('Desconectado. Reintentando si la sesión sigue activa…', 'warn');
        });

        state.socket.on('Evento-Mensaje-Server', function (msg) {
          var msgJson = typeof msg === 'string' ? JSON.parse(msg) : msg;
          appendMessage(msgJson);
        });

        state.socket.on('chat:error', function (payload) {
          setChatBanner((payload && payload.message) || 'Error en el chat.', 'error');
        });
      })
      .catch(function () {
        setStatus('No se pudo obtener un token de acceso. Volvé a iniciar sesión.', 'error');
        show('auth-gate', true);
        var shell = el('auth-shell');
        if (shell) shell.hidden = false;
        show('chat-panel', false);
        show('btn-retry', true);
        setBusy(false);
      });
  }

  /**
   * @returns {Promise<{kind:'none'|'cancelled'|'error'|'success', message?: string, auth0Error?: string}>}
   */
  async function handleRedirectCallback() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      var code = params.get('error') || '';
      var desc = params.get('error_description') || code || 'Error de autenticación';
      try {
        desc = decodeURIComponent(desc.replace(/\+/g, ' '));
      } catch (e) { /* keep raw */ }
      window.history.replaceState({}, document.title, window.location.pathname);
      // access_denied no siempre es cancelación del usuario (p. ej. "Service not found").
      if (/service not found/i.test(desc)) {
        return {
          kind: 'error',
          message:
            'No se pudo iniciar sesión: falta crear la API en Auth0 (audience).',
          detail:
            desc +
            ' — Applications → APIs → Create API con Identifier = AUTH0_AUDIENCE y autorizala para la SPA.',
          auth0Error: code
        };
      }
      if (
        code === 'access_denied' &&
        (/cancel/i.test(desc) || /user/i.test(desc) || /^access_denied$/i.test(desc))
      ) {
        return {
          kind: 'cancelled',
          message: 'Cancelaste el inicio de sesión. Podés intentarlo de nuevo.',
          auth0Error: code
        };
      }
      return {
        kind: 'error',
        message: 'Auth0 no pudo completar el inicio de sesión.',
        detail: code + ': ' + desc,
        auth0Error: code
      };
    }
    if (params.has('code') && params.has('state')) {
      try {
        await state.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
        return { kind: 'success' };
      } catch (err) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return {
          kind: 'error',
          message: 'No se pudo completar el login tras volver de Auth0.',
          detail: (err && err.message) || 'error desconocido'
        };
      }
    }
    return { kind: 'none' };
  }

  async function loadPublicConfig() {
    var res = await fetch('/auth-config', { credentials: 'same-origin' });
    if (!res.ok) {
      var body = await res.json().catch(function () { return {}; });
      var err = new Error(body.detail || body.error || 'Falta configuración Auth0 en el servidor');
      err.code = 'ENV_CONFIG';
      throw err;
    }
    state.config = await res.json();
  }

  async function ensureAuth0() {
    await loadPublicConfig();

    if (window.__E2E_ACCESS_TOKEN__ && window.__E2E_USER__) {
      state.auth0Client = {
        getTokenSilently: async function () { return window.__E2E_ACCESS_TOKEN__; },
        isAuthenticated: async function () { return true; },
        getUser: async function () { return window.__E2E_USER__; },
        loginWithRedirect: async function () {},
        logout: function () {},
        handleRedirectCallback: async function () {}
      };
      return;
    }

    var createAuth0Client = getCreateAuth0Client();
    var clientPromise = createAuth0Client({
      domain: state.config.domain,
      clientId: state.config.clientId,
      authorizationParams: {
        redirect_uri: state.config.redirectUri,
        audience: state.config.audience,
        scope: 'openid profile email',
        // Evita reutilizar una sesión Auth0 que devuelve access_denied en silencio.
        prompt: 'login'
      },
      cacheLocation: 'memory',
      useRefreshTokens: true
    });
    var timeoutPromise = new Promise(function (_, reject) {
      setTimeout(function () {
        var t = new Error('Tiempo de espera agotado al contactar Auth0');
        t.code = 'AUTH0_TIMEOUT';
        reject(t);
      }, 15000);
    });
    state.auth0Client = await Promise.race([clientPromise, timeoutPromise]);
  }

  async function login() {
    if (!state.auth0Client || typeof state.auth0Client.loginWithRedirect !== 'function') {
      setStatus('Auth0 aún no está listo. Pulsá Reintentar.', 'error');
      show('btn-retry', true);
      return;
    }
    setBusy(true);
    setStatus('Redirigiendo al inicio de sesión…', 'loading');
    show('btn-login', false);
    show('btn-retry', false);
    try {
      // Params ya vienen de createAuth0Client; no reenviar objetos anidados.
      await state.auth0Client.loginWithRedirect();
      // Si seguimos en localhost, la navegación no ocurrió.
      window.setTimeout(function () {
        if (!/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(window.location.origin)) {
          return;
        }
        var title = document.querySelector('#auth-status .auth-status__title');
        if (title && /Redirigiendo al inicio/i.test(title.textContent || '')) {
          setStatus(
            'La redirección a Auth0 no se completó.',
            'error',
            'Revisá bloqueadores o la consola del navegador.'
          );
          show('btn-login', true);
          show('btn-retry', true);
          setBusy(false);
        }
      }, 5000);
    } catch (err) {
      setStatus(
        'No se pudo iniciar el login.',
        'error',
        (err && err.message) || 'error desconocido'
      );
      show('btn-login', true);
      show('btn-retry', true);
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    disconnectSocket();
    state.user = null;
    setChatBanner('');
    show('chat-panel', false);
    var shell = el('auth-shell');
    if (shell) shell.hidden = false;
    show('auth-gate', true);
    show('btn-login', false);
    show('btn-retry', false);
    setStatus('Cerrando sesión…', 'loading');
    if (state.auth0Client && state.auth0Client.logout) {
      state.auth0Client.logout({
        logoutParams: {
          returnTo: state.config.redirectUri
        }
      });
    } else {
      setStatus('Sesión cerrada. Iniciá sesión para volver al chat.', 'info');
      show('btn-login', true);
      setBusy(false);
    }
  }

  async function bootAuthenticatedUi() {
    var user = window.__E2E_USER__ || (await state.auth0Client.getUser());
    renderIdentity(user || {});
    show('auth-gate', false);
    var shell = el('auth-shell');
    if (shell) shell.hidden = true;
    show('chat-panel', true);
    setBusy(true);
    await connectChat();
  }

  function formatInitError(err) {
    var code = err && err.code;
    var msg = (err && err.message) ? err.message : 'desconocido';
    if (code === 'SDK_MISSING') {
      return {
        message: 'No se pudo cargar el SDK de Auth0. Recargá o reintentá.',
        detail: msg
      };
    }
    if (code === 'ENV_CONFIG') {
      return {
        message: 'Falta configuración Auth0 en el servidor.',
        detail: msg + ' — Revisá .env y reiniciá npm start.'
      };
    }
    if (code === 'AUTH0_TIMEOUT') {
      return {
        message: 'Auth0 no respondió a tiempo. Podés reintentar.',
        detail: msg
      };
    }
    return {
      message: 'No se pudo inicializar Auth0.',
      detail: msg
    };
  }

  async function init() {
    if (state.initInFlight) {
      return;
    }
    state.initInFlight = true;
    setBusy(true);
    show('auth-gate', true);
    var shell = el('auth-shell');
    if (shell) shell.hidden = false;
    show('chat-panel', false);
    setChatBanner('');
    setStatus('Comprobando autenticación…', 'loading');
    show('btn-login', false);
    show('btn-retry', false);
    disconnectSocket();
    state.auth0Client = null;

    try {
      await ensureAuth0();
    } catch (err) {
      var initErr = formatInitError(err);
      setStatus(initErr.message, 'error', initErr.detail);
      show('btn-retry', true);
      setBusy(false);
      state.initInFlight = false;
      return;
    }

    var callback;
    try {
      callback = await handleRedirectCallback();
    } catch (err) {
      setStatus('Error al completar el inicio de sesión. Podés reintentar.', 'error');
      show('btn-retry', true);
      show('btn-login', true);
      setBusy(false);
      state.initInFlight = false;
      return;
    }

    // No pisar el mensaje de cancelación/error de Auth0 con el texto genérico.
    if (callback && (callback.kind === 'error' || callback.kind === 'cancelled')) {
      setStatus(
        callback.message,
        callback.kind === 'cancelled' ? 'warn' : 'error',
        callback.detail || ''
      );
      show('btn-login', true);
      show('btn-retry', true);
      setBusy(false);
      state.initInFlight = false;
      return;
    }

    var authenticated = await state.auth0Client.isAuthenticated();
    if (!authenticated) {
      setStatus('Iniciá sesión con tu red social para usar UNA Chat.', 'info');
      show('btn-login', true);
      show('btn-retry', false);
      setBusy(false);
      state.initInFlight = false;
      return;
    }

    try {
      await bootAuthenticatedUi();
    } finally {
      state.initInFlight = false;
    }
  }

  function bindUiOnce() {
    if (state.uiBound) {
      return;
    }
    state.uiBound = true;

    el('btn-login').addEventListener('click', function () {
      login().catch(function () {
        setStatus('No se pudo iniciar el login. Reintentá.', 'error');
        show('btn-login', true);
        show('btn-retry', true);
        setBusy(false);
      });
    });
    el('btn-retry').addEventListener('click', function () {
      init();
    });
    el('btn-logout').addEventListener('click', function () {
      logout();
    });

    $('form').submit(function () {
      if (!state.socket || !state.socket.connected) {
        setChatBanner('No hay conexión con el chat. Esperá a reconectar o volvé a iniciar sesión.', 'error');
        return false;
      }
      var mensajeTxt = $('#m').val();
      if (state.colorHex === '') {
        state.colorHex = getRandomColor();
      }
      var jsonMsg = {
        nombre: displayName(state.user),
        mensaje: mensajeTxt,
        color: state.colorHex
      };
      state.socket.emit('Evento-Mensaje-Server', JSON.stringify(jsonMsg));
      $('#vacio').hide();
      $('#m').val('');
      return false;
    });
  }

  $(function () {
    bindUiOnce();
    init();
  });
})(window, jQuery);
