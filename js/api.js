window.Api = (function () {
  function getToken() {
    return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TOKEN) || '';
  }

  async function request(action, payload, method, options) {
    if (!action) {
      throw new Error('Acao da API nao informada.');
    }

    var opts = options || {};
    var requestMethod = (method || 'POST').toUpperCase();
    var token = opts.includeAuth === false ? '' : getToken();
    var data = payload || {};
    var url = new URL(APP_CONFIG.API_BASE_URL);
    var fetchOptions = {
      method: requestMethod,
      redirect: 'follow'
    };

    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, APP_CONFIG.REQUEST_TIMEOUT_MS);
    fetchOptions.signal = controller.signal;

    try {
      if (requestMethod === 'GET') {
        url.searchParams.set('action', action);
        url.searchParams.set('payload', JSON.stringify(data));
        if (token) url.searchParams.set('token', token);
      } else {
        var body = new URLSearchParams();
        body.set('action', action);
        body.set('payload', JSON.stringify(data));
        if (token) body.set('token', token);

        fetchOptions.headers = {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        };
        fetchOptions.body = body.toString();
      }

      var response = await fetch(url.toString(), fetchOptions);
      var rawText = await response.text();
      var parsed = AppUtils.parseJson(rawText, null);

      if (!parsed) {
        throw new Error('Resposta invalida da API.');
      }
      if (!parsed.success) {
        throw new Error(parsed.message || 'Erro na chamada da API.');
      }
      return parsed.data;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('A requisicao demorou demais. Tente novamente.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function healthCheck() {
    return request('healthCheck', {}, 'GET', { includeAuth: false });
  }

  function login(login, senha) {
    return request('login', { login: login, senha: senha }, 'POST', { includeAuth: false });
  }

  function logout() {
    return request('logout', {}, 'POST');
  }

  function validarSessao() {
    return request('validarSessao', {}, 'POST');
  }

  function criarEstruturaSistema() {
    return request('criarEstruturaSistema', {}, 'POST');
  }

  function popularConfiguracoesIniciais() {
    return request('popularConfiguracoesIniciais', {}, 'POST');
  }

  function listarFornecedores(filtros) {
    return request('listarFornecedores', filtros || {}, 'POST');
  }

  function salvarFornecedor(payload) {
    return request('salvarFornecedor', payload || {}, 'POST');
  }

  function listarLicitacoes(filtros) {
    return request('listarLicitacoes', filtros || {}, 'POST');
  }

  function salvarLicitacao(payload) {
    return request('salvarLicitacao', payload || {}, 'POST');
  }

  function listarSecretarias(filtros) {
    return request('listarSecretarias', filtros || {}, 'POST');
  }

  function salvarSecretaria(payload) {
    return request('salvarSecretaria', payload || {}, 'POST');
  }

  function listarSecretarios(filtros) {
    return request('listarSecretarios', filtros || {}, 'POST');
  }

  function salvarSecretario(payload) {
    return request('salvarSecretario', payload || {}, 'POST');
  }

  function listarVeiculos(filtros) {
    return request('listarVeiculos', filtros || {}, 'POST');
  }

  function salvarVeiculo(payload) {
    return request('salvarVeiculo', payload || {}, 'POST');
  }

  function importarXmlNFe(xmlText) {
    return request('importarXmlNFe', { xml: xmlText }, 'POST');
  }

  function criarOrdem(payload) {
    return request('criarOrdem', payload || {}, 'POST');
  }

  function listarOrdens(filtros) {
    return request('listarOrdens', filtros || {}, 'POST');
  }

  function obterOrdemPorId(id) {
    return request('obterOrdemPorId', { id: id }, 'POST');
  }

  function atualizarStatusOrdem(id, status) {
    return request('atualizarStatusOrdem', { id: id, status: status }, 'POST');
  }

  return {
    request: request,
    healthCheck: healthCheck,
    login: login,
    logout: logout,
    validarSessao: validarSessao,
    criarEstruturaSistema: criarEstruturaSistema,
    popularConfiguracoesIniciais: popularConfiguracoesIniciais,
    listarFornecedores: listarFornecedores,
    salvarFornecedor: salvarFornecedor,
    listarLicitacoes: listarLicitacoes,
    salvarLicitacao: salvarLicitacao,
    listarSecretarias: listarSecretarias,
    salvarSecretaria: salvarSecretaria,
    listarSecretarios: listarSecretarios,
    salvarSecretario: salvarSecretario,
    listarVeiculos: listarVeiculos,
    salvarVeiculo: salvarVeiculo,
    importarXmlNFe: importarXmlNFe,
    criarOrdem: criarOrdem,
    listarOrdens: listarOrdens,
    obterOrdemPorId: obterOrdemPorId,
    atualizarStatusOrdem: atualizarStatusOrdem
  };
})();
