(function () {
  var state = {
    ordens: []
  };

  function setLoadingTable(message) {
    var tbody = AppUtils.qs('#tbodyUltimasOrdens');
    tbody.innerHTML = AppUtils.renderEmptyRow(6, message || 'Carregando...');
  }

  function renderKpis(ordens) {
    var total = ordens.length;
    var emitidas = ordens.filter(function (o) { return o.STATUS === APP_CONFIG.ORDER_STATUS.EMITIDA; }).length;
    var canceladas = ordens.filter(function (o) { return o.STATUS === APP_CONFIG.ORDER_STATUS.CANCELADA; }).length;
    var liquido = ordens.reduce(function (acc, item) {
      return acc + AppUtils.toNumber(item.VALOR_LIQUIDO, 0);
    }, 0);

    AppUtils.qs('#kpiTotalOrdens').textContent = total;
    AppUtils.qs('#kpiEmitidas').textContent = emitidas;
    AppUtils.qs('#kpiCanceladas').textContent = canceladas;
    AppUtils.qs('#kpiValorLiquido').textContent = AppUtils.formatCurrency(liquido);
  }

  function statusBadge(status) {
    return '<span class="status-badge status-' + AppUtils.escapeHtml(status) + '">' + AppUtils.escapeHtml(status || '-') + '</span>';
  }

  function renderTabela(ordens) {
    var tbody = AppUtils.qs('#tbodyUltimasOrdens');
    if (!ordens.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(6, 'Nenhuma ordem encontrada.');
      return;
    }

    var rows = ordens.slice(0, 10).map(function (ordem) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(ordem.NUMERO_ORDEM || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(ordem.TIPO_ORDEM || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatDateBr(ordem.DATA_ORDEM)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(ordem.FORNECEDOR_NOME || '-') + '</td>' +
        '<td>' + statusBadge(ordem.STATUS) + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(ordem.VALOR_LIQUIDO)) + '</td>' +
        '</tr>'
      );
    });
    tbody.innerHTML = rows.join('');
  }

  async function carregarDashboard() {
    setLoadingTable('Carregando ordens...');
    try {
      var ordens = await Api.listarOrdens({});
      state.ordens = Array.isArray(ordens) ? ordens : [];
      renderKpis(state.ordens);
      renderTabela(state.ordens);
    } catch (err) {
      setLoadingTable('Erro ao carregar dados: ' + AppUtils.getErrorMessage(err));
      AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
    }
  }

  async function init() {
    var ok = await Auth.ensureAuthenticatedPage();
    if (!ok) return;

    Auth.fillSessionUi();
    Auth.bindLogoutButtons();
    await carregarDashboard();

    var btnAtualizar = AppUtils.qs('#btnAtualizarDashboard');
    btnAtualizar.addEventListener('click', function () {
      carregarDashboard();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
