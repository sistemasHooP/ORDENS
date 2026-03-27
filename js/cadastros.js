(function () {
  var state = {
    fornecedores: [],
    licitacoes: [],
    secretarias: [],
    secretarios: [],
    veiculos: []
  };

  function toBool(value) {
    return value === true || value === 'true' || value === '1';
  }

  function fornecedorNome(id) {
    var item = state.fornecedores.find(function (f) { return String(f.ID) === String(id); });
    return item ? item.RAZAO_SOCIAL : '-';
  }

  function secretariaNome(id) {
    var item = state.secretarias.find(function (s) { return String(s.ID) === String(id); });
    return item ? item.NOME : '-';
  }

  function bindTabs() {
    AppUtils.qsa('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.tab;
        AppUtils.qsa('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        AppUtils.qsa('.tab-panel').forEach(function (panel) { panel.classList.remove('active'); });
        btn.classList.add('active');
        AppUtils.qs('#' + target).classList.add('active');
      });
    });
  }

  function popularSelectsDependentes() {
    var optionsFornecedores = ['<option value="">Selecione</option>'].concat(
      state.fornecedores.map(function (f) {
        return '<option value="' + AppUtils.escapeHtml(f.ID) + '">' + AppUtils.escapeHtml(f.RAZAO_SOCIAL) + '</option>';
      })
    );
    AppUtils.qs('#licFornecedorId').innerHTML = optionsFornecedores.join('');

    var optionsSecretarias = ['<option value="">Selecione</option>'].concat(
      state.secretarias.map(function (s) {
        return '<option value="' + AppUtils.escapeHtml(s.ID) + '">' + AppUtils.escapeHtml(s.NOME) + '</option>';
      })
    );
    AppUtils.qs('#scrSecretariaId').innerHTML = optionsSecretarias.join('');
    AppUtils.qs('#veiSecretariaId').innerHTML = ['<option value="">Opcional</option>'].concat(
      state.secretarias.map(function (s) {
        return '<option value="' + AppUtils.escapeHtml(s.ID) + '">' + AppUtils.escapeHtml(s.NOME) + '</option>';
      })
    ).join('');
  }

  function renderFornecedores() {
    var tbody = AppUtils.qs('#tbodyFornecedores');
    if (!state.fornecedores.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(6, 'Nenhum fornecedor cadastrado.');
      return;
    }
    tbody.innerHTML = state.fornecedores.map(function (item) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.RAZAO_SOCIAL || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(AppUtils.formatCnpj(item.CNPJ)) + '</td>' +
        '<td>' + AppUtils.escapeHtml((item.CIDADE || '-') + '/' + (item.UF || '-')) + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.CONTATO || item.TELEFONE || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(toBool(item.ATIVO) ? 'ATIVO' : 'INATIVO') + '</td>' +
        '<td><button class="btn btn-secondary" data-edit-fornecedor="' + AppUtils.escapeHtml(item.ID) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderLicitacoes() {
    var tbody = AppUtils.qs('#tbodyLicitacoes');
    if (!state.licitacoes.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(6, 'Nenhuma licitação cadastrada.');
      return;
    }
    tbody.innerHTML = state.licitacoes.map(function (item) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.NUMERO || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.ANO || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.MODALIDADE || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(fornecedorNome(item.FORNECEDOR_ID)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.STATUS || '-') + '</td>' +
        '<td><button class="btn btn-secondary" data-edit-licitacao="' + AppUtils.escapeHtml(item.ID) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderSecretarias() {
    var tbody = AppUtils.qs('#tbodySecretarias');
    if (!state.secretarias.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(5, 'Nenhuma secretaria cadastrada.');
      return;
    }
    tbody.innerHTML = state.secretarias.map(function (item) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.NOME || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.SIGLA || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.RESPONSAVEL_PADRAO || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(toBool(item.ATIVA) ? 'ATIVA' : 'INATIVA') + '</td>' +
        '<td><button class="btn btn-secondary" data-edit-secretaria="' + AppUtils.escapeHtml(item.ID) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderSecretarios() {
    var tbody = AppUtils.qs('#tbodySecretarios');
    if (!state.secretarios.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(6, 'Nenhum secretário cadastrado.');
      return;
    }
    tbody.innerHTML = state.secretarios.map(function (item) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.NOME || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.CARGO || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(secretariaNome(item.SECRETARIA_ID)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.EMAIL || item.TELEFONE || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(toBool(item.ATIVO) ? 'ATIVO' : 'INATIVO') + '</td>' +
        '<td><button class="btn btn-secondary" data-edit-secretario="' + AppUtils.escapeHtml(item.ID) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderVeiculos() {
    var tbody = AppUtils.qs('#tbodyVeiculos');
    if (!state.veiculos.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(6, 'Nenhum veículo/equipamento cadastrado.');
      return;
    }
    tbody.innerHTML = state.veiculos.map(function (item) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.PLACA || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.DESCRICAO || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(secretariaNome(item.SECRETARIA_ID)) + '</td>' +
        '<td>' + AppUtils.escapeHtml(item.STATUS || '-') + '</td>' +
        '<td>' + AppUtils.escapeHtml(toBool(item.ATIVO) ? 'SIM' : 'NÃO') + '</td>' +
        '<td><button class="btn btn-secondary" data-edit-veiculo="' + AppUtils.escapeHtml(item.ID) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function limparFormFornecedor() {
    AppUtils.qs('#fornecedorIdEdit').value = '';
    AppUtils.qs('#formFornecedor').reset();
    AppUtils.qs('#forAtivo').value = 'true';
  }

  function preencherFormFornecedor(item) {
    AppUtils.qs('#fornecedorIdEdit').value = item.ID || '';
    AppUtils.qs('#forRazaoSocial').value = item.RAZAO_SOCIAL || '';
    AppUtils.qs('#forNomeFantasia').value = item.NOME_FANTASIA || '';
    AppUtils.qs('#forCnpj').value = item.CNPJ || '';
    AppUtils.qs('#forIe').value = item.INSCRICAO_ESTADUAL || '';
    AppUtils.qs('#forEndereco').value = item.ENDERECO || '';
    AppUtils.qs('#forNumero').value = item.NUMERO || '';
    AppUtils.qs('#forCidade').value = item.CIDADE || '';
    AppUtils.qs('#forUf').value = item.UF || '';
    AppUtils.qs('#forTelefone').value = item.TELEFONE || '';
    AppUtils.qs('#forEmail').value = item.EMAIL || '';
    AppUtils.qs('#forContato').value = item.CONTATO || '';
    AppUtils.qs('#forAtivo').value = toBool(item.ATIVO) ? 'true' : 'false';
  }

  function limparFormLicitacao() {
    AppUtils.qs('#licitacaoIdEdit').value = '';
    AppUtils.qs('#formLicitacao').reset();
    AppUtils.qs('#licStatus').value = 'ATIVA';
  }

  function preencherFormLicitacao(item) {
    AppUtils.qs('#licitacaoIdEdit').value = item.ID || '';
    AppUtils.qs('#licNumero').value = item.NUMERO || '';
    AppUtils.qs('#licModalidade').value = item.MODALIDADE || '';
    AppUtils.qs('#licAno').value = item.ANO || '';
    AppUtils.qs('#licFornecedorId').value = item.FORNECEDOR_ID || '';
    AppUtils.qs('#licDataInicio').value = item.DATA_INICIO || '';
    AppUtils.qs('#licDataFim').value = item.DATA_FIM || '';
    AppUtils.qs('#licStatus').value = item.STATUS || '';
    AppUtils.qs('#licObjeto').value = item.OBJETO || '';
    AppUtils.qs('#licObservacao').value = item.OBSERVACAO || '';
  }

  function limparFormSecretaria() {
    AppUtils.qs('#secretariaIdEdit').value = '';
    AppUtils.qs('#formSecretaria').reset();
    AppUtils.qs('#secAtiva').value = 'true';
  }

  function preencherFormSecretaria(item) {
    AppUtils.qs('#secretariaIdEdit').value = item.ID || '';
    AppUtils.qs('#secNome').value = item.NOME || '';
    AppUtils.qs('#secSigla').value = item.SIGLA || '';
    AppUtils.qs('#secResponsavelPadrao').value = item.RESPONSAVEL_PADRAO || '';
    AppUtils.qs('#secAtiva').value = toBool(item.ATIVA) ? 'true' : 'false';
  }

  function limparFormSecretario() {
    AppUtils.qs('#secretarioIdEdit').value = '';
    AppUtils.qs('#formSecretario').reset();
    AppUtils.qs('#scrAtivo').value = 'true';
  }

  function preencherFormSecretario(item) {
    AppUtils.qs('#secretarioIdEdit').value = item.ID || '';
    AppUtils.qs('#scrNome').value = item.NOME || '';
    AppUtils.qs('#scrCargo').value = item.CARGO || '';
    AppUtils.qs('#scrSecretariaId').value = item.SECRETARIA_ID || '';
    AppUtils.qs('#scrCpf').value = item.CPF || '';
    AppUtils.qs('#scrEmail').value = item.EMAIL || '';
    AppUtils.qs('#scrTelefone').value = item.TELEFONE || '';
    AppUtils.qs('#scrAtivo').value = toBool(item.ATIVO) ? 'true' : 'false';
  }

  function limparFormVeiculo() {
    AppUtils.qs('#veiculoIdEdit').value = '';
    AppUtils.qs('#formVeiculo').reset();
    AppUtils.qs('#veiStatus').value = 'ATIVO';
    AppUtils.qs('#veiAtivo').value = 'true';
  }

  function preencherFormVeiculo(item) {
    AppUtils.qs('#veiculoIdEdit').value = item.ID || '';
    AppUtils.qs('#veiPlaca').value = item.PLACA || '';
    AppUtils.qs('#veiDescricao').value = item.DESCRICAO || '';
    AppUtils.qs('#veiModelo').value = item.MODELO || '';
    AppUtils.qs('#veiMarca').value = item.MARCA || '';
    AppUtils.qs('#veiAno').value = item.ANO || '';
    AppUtils.qs('#veiChassi').value = item.CHASSI || '';
    AppUtils.qs('#veiSecretariaId').value = item.SECRETARIA_ID || '';
    AppUtils.qs('#veiStatus').value = item.STATUS || 'ATIVO';
    AppUtils.qs('#veiObservacao').value = item.OBSERVACAO || '';
    AppUtils.qs('#veiAtivo').value = toBool(item.ATIVO) ? 'true' : 'false';
  }

  async function carregarDados() {
    try {
      var resultados = await Promise.all([
        Api.listarFornecedores({ incluirInativos: true }),
        Api.listarLicitacoes({}),
        Api.listarSecretarias({ incluirInativas: true }),
        Api.listarSecretarios({ incluirInativos: true }),
        Api.listarVeiculos({ incluirInativos: true })
      ]);

      state.fornecedores = Array.isArray(resultados[0]) ? resultados[0] : [];
      state.licitacoes = Array.isArray(resultados[1]) ? resultados[1] : [];
      state.secretarias = Array.isArray(resultados[2]) ? resultados[2] : [];
      state.secretarios = Array.isArray(resultados[3]) ? resultados[3] : [];
      state.veiculos = Array.isArray(resultados[4]) ? resultados[4] : [];

      popularSelectsDependentes();
      renderFornecedores();
      renderLicitacoes();
      renderSecretarias();
      renderSecretarios();
      renderVeiculos();
    } catch (err) {
      AppUtils.showToast('Erro ao carregar cadastros: ' + AppUtils.getErrorMessage(err), 'error');
    }
  }

  function bindForms() {
    AppUtils.qs('#formFornecedor').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {
        ID: AppUtils.safeString(AppUtils.qs('#fornecedorIdEdit').value),
        RAZAO_SOCIAL: AppUtils.safeString(AppUtils.qs('#forRazaoSocial').value),
        NOME_FANTASIA: AppUtils.safeString(AppUtils.qs('#forNomeFantasia').value),
        CNPJ: AppUtils.safeString(AppUtils.qs('#forCnpj').value),
        INSCRICAO_ESTADUAL: AppUtils.safeString(AppUtils.qs('#forIe').value),
        ENDERECO: AppUtils.safeString(AppUtils.qs('#forEndereco').value),
        NUMERO: AppUtils.safeString(AppUtils.qs('#forNumero').value),
        CIDADE: AppUtils.safeString(AppUtils.qs('#forCidade').value),
        UF: AppUtils.safeString(AppUtils.qs('#forUf').value).toUpperCase(),
        TELEFONE: AppUtils.safeString(AppUtils.qs('#forTelefone').value),
        EMAIL: AppUtils.safeString(AppUtils.qs('#forEmail').value),
        CONTATO: AppUtils.safeString(AppUtils.qs('#forContato').value),
        ATIVO: AppUtils.qs('#forAtivo').value === 'true'
      };

      try {
        await Api.salvarFornecedor(payload);
        AppUtils.showToast('Fornecedor salvo com sucesso.', 'success');
        limparFormFornecedor();
        await carregarDados();
      } catch (err) {
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      }
    });

    AppUtils.qs('#formLicitacao').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {
        ID: AppUtils.safeString(AppUtils.qs('#licitacaoIdEdit').value),
        NUMERO: AppUtils.safeString(AppUtils.qs('#licNumero').value),
        MODALIDADE: AppUtils.safeString(AppUtils.qs('#licModalidade').value),
        ANO: AppUtils.safeString(AppUtils.qs('#licAno').value),
        FORNECEDOR_ID: AppUtils.safeString(AppUtils.qs('#licFornecedorId').value),
        DATA_INICIO: AppUtils.safeString(AppUtils.qs('#licDataInicio').value),
        DATA_FIM: AppUtils.safeString(AppUtils.qs('#licDataFim').value),
        STATUS: AppUtils.safeString(AppUtils.qs('#licStatus').value),
        OBJETO: AppUtils.safeString(AppUtils.qs('#licObjeto').value),
        OBSERVACAO: AppUtils.safeString(AppUtils.qs('#licObservacao').value)
      };

      try {
        await Api.salvarLicitacao(payload);
        AppUtils.showToast('Licitação salva com sucesso.', 'success');
        limparFormLicitacao();
        await carregarDados();
      } catch (err) {
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      }
    });

    AppUtils.qs('#formSecretaria').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {
        ID: AppUtils.safeString(AppUtils.qs('#secretariaIdEdit').value),
        NOME: AppUtils.safeString(AppUtils.qs('#secNome').value),
        SIGLA: AppUtils.safeString(AppUtils.qs('#secSigla').value).toUpperCase(),
        RESPONSAVEL_PADRAO: AppUtils.safeString(AppUtils.qs('#secResponsavelPadrao').value),
        ATIVA: AppUtils.qs('#secAtiva').value === 'true'
      };

      try {
        await Api.salvarSecretaria(payload);
        AppUtils.showToast('Secretaria salva com sucesso.', 'success');
        limparFormSecretaria();
        await carregarDados();
      } catch (err) {
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      }
    });

    AppUtils.qs('#formSecretario').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {
        ID: AppUtils.safeString(AppUtils.qs('#secretarioIdEdit').value),
        NOME: AppUtils.safeString(AppUtils.qs('#scrNome').value),
        CARGO: AppUtils.safeString(AppUtils.qs('#scrCargo').value),
        SECRETARIA_ID: AppUtils.safeString(AppUtils.qs('#scrSecretariaId').value),
        CPF: AppUtils.safeString(AppUtils.qs('#scrCpf').value),
        EMAIL: AppUtils.safeString(AppUtils.qs('#scrEmail').value),
        TELEFONE: AppUtils.safeString(AppUtils.qs('#scrTelefone').value),
        ATIVO: AppUtils.qs('#scrAtivo').value === 'true'
      };

      try {
        await Api.salvarSecretario(payload);
        AppUtils.showToast('Secretário salvo com sucesso.', 'success');
        limparFormSecretario();
        await carregarDados();
      } catch (err) {
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      }
    });

    AppUtils.qs('#formVeiculo').addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var payload = {
        ID: AppUtils.safeString(AppUtils.qs('#veiculoIdEdit').value),
        PLACA: AppUtils.safeString(AppUtils.qs('#veiPlaca').value).toUpperCase(),
        DESCRICAO: AppUtils.safeString(AppUtils.qs('#veiDescricao').value),
        MODELO: AppUtils.safeString(AppUtils.qs('#veiModelo').value),
        MARCA: AppUtils.safeString(AppUtils.qs('#veiMarca').value),
        ANO: AppUtils.safeString(AppUtils.qs('#veiAno').value),
        CHASSI: AppUtils.safeString(AppUtils.qs('#veiChassi').value),
        SECRETARIA_ID: AppUtils.safeString(AppUtils.qs('#veiSecretariaId').value),
        STATUS: AppUtils.safeString(AppUtils.qs('#veiStatus').value),
        OBSERVACAO: AppUtils.safeString(AppUtils.qs('#veiObservacao').value),
        ATIVO: AppUtils.qs('#veiAtivo').value === 'true'
      };

      try {
        await Api.salvarVeiculo(payload);
        AppUtils.showToast('Veículo salvo com sucesso.', 'success');
        limparFormVeiculo();
        await carregarDados();
      } catch (err) {
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      }
    });
  }

  function bindResetButtons() {
    AppUtils.qs('#btnNovoFornecedor').addEventListener('click', limparFormFornecedor);
    AppUtils.qs('#btnNovaLicitacao').addEventListener('click', limparFormLicitacao);
    AppUtils.qs('#btnNovaSecretaria').addEventListener('click', limparFormSecretaria);
    AppUtils.qs('#btnNovoSecretario').addEventListener('click', limparFormSecretario);
    AppUtils.qs('#btnNovoVeiculo').addEventListener('click', limparFormVeiculo);
  }

  function bindTableActions() {
    AppUtils.qs('#tbodyFornecedores').addEventListener('click', function (ev) {
      var id = ev.target.dataset.editFornecedor;
      if (!id) return;
      var item = state.fornecedores.find(function (x) { return String(x.ID) === String(id); });
      if (item) preencherFormFornecedor(item);
    });

    AppUtils.qs('#tbodyLicitacoes').addEventListener('click', function (ev) {
      var id = ev.target.dataset.editLicitacao;
      if (!id) return;
      var item = state.licitacoes.find(function (x) { return String(x.ID) === String(id); });
      if (item) preencherFormLicitacao(item);
    });

    AppUtils.qs('#tbodySecretarias').addEventListener('click', function (ev) {
      var id = ev.target.dataset.editSecretaria;
      if (!id) return;
      var item = state.secretarias.find(function (x) { return String(x.ID) === String(id); });
      if (item) preencherFormSecretaria(item);
    });

    AppUtils.qs('#tbodySecretarios').addEventListener('click', function (ev) {
      var id = ev.target.dataset.editSecretario;
      if (!id) return;
      var item = state.secretarios.find(function (x) { return String(x.ID) === String(id); });
      if (item) preencherFormSecretario(item);
    });

    AppUtils.qs('#tbodyVeiculos').addEventListener('click', function (ev) {
      var id = ev.target.dataset.editVeiculo;
      if (!id) return;
      var item = state.veiculos.find(function (x) { return String(x.ID) === String(id); });
      if (item) preencherFormVeiculo(item);
    });
  }

  async function init() {
    var ok = await Auth.ensureAuthenticatedPage();
    if (!ok) return;
    Auth.fillSessionUi();
    Auth.bindLogoutButtons();

    bindTabs();
    bindForms();
    bindResetButtons();
    bindTableActions();
    await carregarDados();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
