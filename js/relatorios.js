(function () {
  var state = {
    fornecedores: [],
    ordens: []
  };

  function setTableLoading(message) {
    AppUtils.qs('#tbodyRelatorioOrdens').innerHTML = AppUtils.renderEmptyRow(8, message || 'Carregando...');
  }

  function renderResumo(ordens) {
    var quantidade = ordens.length;
    var bruto = 0;
    var desconto = 0;
    var liquido = 0;

    ordens.forEach(function (ordem) {
      bruto += AppUtils.toNumber(ordem.VALOR_BRUTO, 0);
      desconto += AppUtils.toNumber(ordem.VALOR_DESCONTO, 0);
      liquido += AppUtils.toNumber(ordem.VALOR_LIQUIDO, 0);
    });

    AppUtils.qs('#resQuantidade').textContent = quantidade;
    AppUtils.qs('#resBruto').textContent = AppUtils.formatCurrency(bruto);
    AppUtils.qs('#resDesconto').textContent = AppUtils.formatCurrency(desconto);
    AppUtils.qs('#resLiquido').textContent = AppUtils.formatCurrency(liquido);
  }

  function statusBadge(status) {
    return '<span class="status-badge status-' + AppUtils.escapeHtml(status) + '">' + AppUtils.escapeHtml(status || '-') + '</span>';
  }

  function renderTable(ordens) {
    var tbody = AppUtils.qs('#tbodyRelatorioOrdens');
    if (!ordens.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(8, 'Nenhuma ordem encontrada para os filtros informados.');
      return;
    }

    tbody.innerHTML = ordens.map(function (ordem) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(ordem.NUMERO_ORDEM || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(ordem.TIPO_ORDEM || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatDateBr(ordem.DATA_ORDEM)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(ordem.FORNECEDOR_NOME || '-') + '</td>' +
        '<td>' + statusBadge(ordem.STATUS) + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(ordem.VALOR_BRUTO)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(ordem.VALOR_DESCONTO)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(ordem.VALOR_LIQUIDO)) + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function popularFornecedores() {
    var select = AppUtils.qs('#filtroFornecedor');
    var options = ['<option value="">Todos</option>'];
    state.fornecedores.forEach(function (fornecedor) {
      options.push(
        '<option value="' + AppUtils.escapeHtml(fornecedor.ID) + '">' +
        AppUtils.escapeHtml(fornecedor.RAZAO_SOCIAL) +
        '</option>'
      );
    });
    select.innerHTML = options.join('');
  }

  function obterFiltros() {
    return {
      tipoOrdem: AppUtils.safeString(AppUtils.qs('#filtroTipo').value),
      status: AppUtils.safeString(AppUtils.qs('#filtroStatus').value),
      fornecedorId: AppUtils.safeString(AppUtils.qs('#filtroFornecedor').value),
      dataInicio: AppUtils.safeString(AppUtils.qs('#filtroDataInicio').value),
      dataFim: AppUtils.safeString(AppUtils.qs('#filtroDataFim').value)
    };
  }

  async function carregarRelatorio() {
    setTableLoading('Buscando ordens...');
    try {
      var filtros = obterFiltros();
      var ordens = await Api.listarOrdens(filtros);
      state.ordens = Array.isArray(ordens) ? ordens : [];
      renderResumo(state.ordens);
      renderTable(state.ordens);
    } catch (err) {
      setTableLoading('Erro ao buscar dados: ' + AppUtils.getErrorMessage(err));
      AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
    }
  }

  async function carregarBase() {
    try {
      var fornecedores = await Api.listarFornecedores({ incluirInativos: false });
      state.fornecedores = Array.isArray(fornecedores) ? fornecedores : [];
      popularFornecedores();
    } catch (err) {
      AppUtils.showToast('Falha ao carregar fornecedores: ' + AppUtils.getErrorMessage(err), 'warning');
    }
  }

  function limparFiltros() {
    AppUtils.qs('#filtroTipo').value = '';
    AppUtils.qs('#filtroStatus').value = '';
    AppUtils.qs('#filtroFornecedor').value = '';
    AppUtils.qs('#filtroDataInicio').value = '';
    AppUtils.qs('#filtroDataFim').value = '';
  }

  function bindEvents() {
    AppUtils.qs('#btnBuscarRelatorio').addEventListener('click', function () {
      carregarRelatorio();
    });

    AppUtils.qs('#btnLimparFiltros').addEventListener('click', function () {
      limparFiltros();
      carregarRelatorio();
    });

    AppUtils.qs('#btnImprimirRelatorio').addEventListener('click', function () {
      window.print();
    });
  }

  async function init() {
    var ok = await Auth.ensureAuthenticatedPage();
    if (!ok) return;
    Auth.fillSessionUi();
    Auth.bindLogoutButtons();

    bindEvents();
    await carregarBase();
    await carregarRelatorio();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
