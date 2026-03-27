(function () {
  var state = {
    fornecedores: [],
    licitacoes: [],
    secretarias: [],
    secretarios: [],
    veiculos: [],
    itens: [],
    xmlData: null,
    xmlOriginal: '',
    ordemSalva: null
  };

  function setError(message) {
    var box = AppUtils.qs('#ordemError');
    if (!message) {
      box.textContent = '';
      box.classList.remove('show');
      return;
    }
    box.textContent = message;
    box.classList.add('show');
  }

  function setSuccess(message) {
    var box = AppUtils.qs('#ordemSuccess');
    if (!message) {
      box.textContent = '';
      box.classList.remove('show');
      return;
    }
    box.textContent = message;
    box.classList.add('show');
  }

  function getTipoOrdem() {
    return AppUtils.safeString(AppUtils.qs('#tipoOrdem').value || APP_CONFIG.ORDER_TYPES.COMPRA);
  }

  function fornecedorAtual() {
    var id = AppUtils.safeString(AppUtils.qs('#fornecedorId').value);
    return state.fornecedores.find(function (f) { return String(f.ID) === String(id); }) || null;
  }

  function secretariaAtual() {
    var id = AppUtils.safeString(AppUtils.qs('#secretariaId').value);
    return state.secretarias.find(function (s) { return String(s.ID) === String(id); }) || null;
  }

  function toggleXmlPanel() {
    var panel = AppUtils.qs('#xmlPanel');
    var tipo = getTipoOrdem();
    panel.style.display = tipo === APP_CONFIG.ORDER_TYPES.COMPRA ? 'block' : 'none';
  }

  function popularSelectFornecedores() {
    var select = AppUtils.qs('#fornecedorId');
    var options = ['<option value="">Selecione</option>'];
    state.fornecedores.forEach(function (item) {
      options.push('<option value="' + AppUtils.escapeHtml(item.ID) + '">' + AppUtils.escapeHtml(item.RAZAO_SOCIAL) + '</option>');
    });
    select.innerHTML = options.join('');
  }

  function popularSelectSecretarias() {
    var select = AppUtils.qs('#secretariaId');
    var options = ['<option value="">Selecione</option>'];
    state.secretarias.forEach(function (item) {
      options.push('<option value="' + AppUtils.escapeHtml(item.ID) + '">' + AppUtils.escapeHtml(item.NOME) + '</option>');
    });
    select.innerHTML = options.join('');
  }

  function popularSelectLicitacoes(fornecedorId) {
    var select = AppUtils.qs('#licitacaoId');
    var lista = state.licitacoes.filter(function (item) {
      return fornecedorId ? String(item.FORNECEDOR_ID) === String(fornecedorId) : false;
    });
    if (!fornecedorId) {
      select.innerHTML = '<option value="">Selecione o fornecedor primeiro</option>';
      return;
    }
    if (!lista.length) {
      select.innerHTML = '<option value="">Nenhuma licitação vinculada</option>';
      return;
    }
    var options = ['<option value="">Selecione</option>'];
    lista.forEach(function (item) {
      var text = [item.NUMERO || '-', item.MODALIDADE || '-', item.ANO || '-'].join(' | ');
      options.push('<option value="' + AppUtils.escapeHtml(item.ID) + '">' + AppUtils.escapeHtml(text) + '</option>');
    });
    select.innerHTML = options.join('');
  }

  function popularSecretariosVeiculos(secretariaId) {
    var selectSecretario = AppUtils.qs('#secretarioId');
    var selectVeiculo = AppUtils.qs('#veiculoId');

    var secretarios = state.secretarios.filter(function (item) {
      return !secretariaId || String(item.SECRETARIA_ID) === String(secretariaId);
    });
    var veiculos = state.veiculos.filter(function (item) {
      if (!secretariaId) return true;
      if (!item.SECRETARIA_ID) return true;
      return String(item.SECRETARIA_ID) === String(secretariaId);
    });

    var secOpts = ['<option value="">Selecione</option>'].concat(secretarios.map(function (item) {
      return '<option value="' + AppUtils.escapeHtml(item.ID) + '">' + AppUtils.escapeHtml(item.NOME) + '</option>';
    }));
    selectSecretario.innerHTML = secOpts.join('');

    var veiOpts = ['<option value="">Opcional</option>'].concat(veiculos.map(function (item) {
      var texto = [item.PLACA || '-', item.DESCRICAO || '-'].join(' - ');
      return '<option value="' + AppUtils.escapeHtml(item.ID) + '">' + AppUtils.escapeHtml(texto) + '</option>';
    }));
    selectVeiculo.innerHTML = veiOpts.join('');
  }

  function preencherFornecedorCampos(item) {
    AppUtils.qs('#razaoSocialFornecedor').value = item ? (item.RAZAO_SOCIAL || '') : '';
    AppUtils.qs('#cnpjFornecedor').value = item ? AppUtils.formatCnpj(item.CNPJ || '') : '';
    AppUtils.qs('#enderecoFornecedor').value = item ? [item.ENDERECO || '', item.NUMERO || ''].join(' ').trim() : '';
    AppUtils.qs('#cidadeFornecedor').value = item ? (item.CIDADE || '') : '';
    AppUtils.qs('#ufFornecedor').value = item ? (item.UF || '') : '';
  }

  function itemBase() {
    return {
      item: String(state.itens.length + 1),
      codigoProduto: '',
      descricao: '',
      ncm: '',
      cfop: '',
      unidade: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
      descontoItem: 0,
      origemXml: false
    };
  }

  function atualizarNumeracaoItens() {
    state.itens.forEach(function (item, index) {
      item.item = String(index + 1);
    });
  }

  function recalcularItem(index) {
    var item = state.itens[index];
    if (!item) return;
    item.quantidade = AppUtils.toNumber(item.quantidade, 0);
    item.valorUnitario = AppUtils.toNumber(item.valorUnitario, 0);
    item.descontoItem = AppUtils.toNumber(item.descontoItem, 0);
    item.valorTotal = AppUtils.round2(item.quantidade * item.valorUnitario);
  }

  function calcularTotais() {
    var bruto = 0;
    var desconto = 0;
    state.itens.forEach(function (item) {
      bruto += AppUtils.toNumber(item.valorTotal, 0);
      desconto += AppUtils.toNumber(item.descontoItem, 0);
    });
    var liquido = bruto - desconto;
    AppUtils.qs('#totalBruto').textContent = AppUtils.formatCurrency(bruto);
    AppUtils.qs('#totalDesconto').textContent = AppUtils.formatCurrency(desconto);
    AppUtils.qs('#totalLiquido').textContent = AppUtils.formatCurrency(liquido);
    return {
      bruto: AppUtils.round2(bruto),
      desconto: AppUtils.round2(desconto),
      liquido: AppUtils.round2(liquido)
    };
  }

  function renderItens() {
    var tbody = AppUtils.qs('#itensBody');
    if (!state.itens.length) {
      tbody.innerHTML = AppUtils.renderEmptyRow(11, 'Nenhum item adicionado.');
      calcularTotais();
      return;
    }

    tbody.innerHTML = state.itens.map(function (item, index) {
      return (
        '<tr>' +
        '<td>' + AppUtils.escapeHtml(item.item) + '</td>' +
        '<td><input data-field="codigoProduto" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.codigoProduto || '') + '" /></td>' +
        '<td><input data-field="descricao" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.descricao || '') + '" /></td>' +
        '<td><input data-field="ncm" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.ncm || '') + '" /></td>' +
        '<td><input data-field="cfop" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.cfop || '') + '" /></td>' +
        '<td><input data-field="unidade" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.unidade || '') + '" /></td>' +
        '<td><input type="number" step="0.01" min="0" data-field="quantidade" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.quantidade) + '" /></td>' +
        '<td><input type="number" step="0.01" min="0" data-field="valorUnitario" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.valorUnitario) + '" /></td>' +
        '<td><input type="number" step="0.01" min="0" data-field="valorTotal" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.valorTotal) + '" /></td>' +
        '<td><input type="number" step="0.01" min="0" data-field="descontoItem" data-index="' + index + '" value="' + AppUtils.escapeHtml(item.descontoItem) + '" /></td>' +
        '<td><button type="button" class="btn btn-danger" data-remove-item="' + index + '">Remover</button></td>' +
        '</tr>'
      );
    }).join('');

    calcularTotais();
  }

  function addItem() {
    state.itens.push(itemBase());
    atualizarNumeracaoItens();
    renderItens();
  }

  function removerItem(index) {
    state.itens.splice(index, 1);
    atualizarNumeracaoItens();
    renderItens();
  }

  function atualizarItem(index, field, value) {
    var item = state.itens[index];
    if (!item) return;

    if (field === 'quantidade' || field === 'valorUnitario' || field === 'valorTotal' || field === 'descontoItem') {
      item[field] = AppUtils.toNumber(value, 0);
      if (field === 'quantidade' || field === 'valorUnitario') {
        recalcularItem(index);
      }
      if (field === 'valorTotal') {
        item.valorTotal = AppUtils.round2(item.valorTotal);
      }
      if (field === 'descontoItem') {
        item.descontoItem = AppUtils.round2(item.descontoItem);
      }
    } else {
      item[field] = AppUtils.safeString(value);
    }
    calcularTotais();
  }

  function renderXmlResumo(data) {
    if (!data) {
      AppUtils.qs('#xmlResumo').value = '';
      return;
    }
    var linhas = [];
    linhas.push('NF: ' + (data.numeroNf || '-'));
    linhas.push('Série: ' + (data.serie || '-'));
    linhas.push('Chave: ' + (data.chaveNfe || '-'));
    linhas.push('Emitente: ' + ((data.emitente && data.emitente.razaoSocial) || '-'));
    linhas.push('CNPJ: ' + AppUtils.formatCnpj((data.emitente && data.emitente.cnpj) || ''));
    linhas.push('Itens: ' + (data.itens ? data.itens.length : 0));
    if (data.totais) {
      linhas.push('Total Bruto: ' + AppUtils.formatCurrency(data.totais.totalBruto || 0));
      linhas.push('Desconto: ' + AppUtils.formatCurrency(data.totais.descontoTotal || 0));
      linhas.push('Total Líquido: ' + AppUtils.formatCurrency(data.totais.totalLiquido || 0));
    }
    AppUtils.qs('#xmlResumo').value = linhas.join('\n');
  }

  function aplicarItensXml(itensXml) {
    state.itens = (itensXml || []).map(function (item, index) {
      return {
        item: String(index + 1),
        codigoProduto: item.codigoProduto || item.CODIGO_PRODUTO || '',
        descricao: item.descricao || item.DESCRICAO || '',
        ncm: item.ncm || item.NCM || '',
        cfop: item.cfop || item.CFOP || '',
        unidade: item.unidade || item.UNIDADE || '',
        quantidade: AppUtils.toNumber(item.quantidade || item.QUANTIDADE || 0, 0),
        valorUnitario: AppUtils.toNumber(item.valorUnitario || item.VALOR_UNITARIO || 0, 0),
        valorTotal: AppUtils.toNumber(item.valorTotal || item.VALOR_TOTAL || 0, 0),
        descontoItem: AppUtils.toNumber(item.descontoItem || item.DESCONTO_ITEM || 0, 0),
        origemXml: true
      };
    });
    renderItens();
  }

  function preencherDadosNfXml(xmlData) {
    AppUtils.qs('#numeroNf').value = xmlData.numeroNf || '';
    AppUtils.qs('#chaveNfe').value = xmlData.chaveNfe || '';
    AppUtils.qs('#dataEmissaoNf').value = xmlData.dataEmissao || '';
  }

  function tentarSelecionarFornecedorPorCnpj(cnpjXml) {
    if (!cnpjXml) return;
    var normalized = AppUtils.normalizeCnpj(cnpjXml);
    var fornecedor = state.fornecedores.find(function (item) {
      return AppUtils.normalizeCnpj(item.CNPJ || '') === normalized;
    });
    if (!fornecedor) return;
    AppUtils.qs('#fornecedorId').value = fornecedor.ID;
    preencherFornecedorCampos(fornecedor);
    popularSelectLicitacoes(fornecedor.ID);
  }

  async function importarXml(file) {
    if (!file) return;
    var texto = await file.text();
    var data = await Api.importarXmlNFe(texto);
    state.xmlOriginal = texto;
    state.xmlData = data;

    renderXmlResumo(data);
    preencherDadosNfXml(data);
    aplicarItensXml(data.itens || []);
    tentarSelecionarFornecedorPorCnpj(data.emitente && data.emitente.cnpj);

    if (data.informacoesComplementares && !AppUtils.safeString(AppUtils.qs('#observacao').value)) {
      AppUtils.qs('#observacao').value = data.informacoesComplementares;
    }
    AppUtils.showToast('XML importado com sucesso.', 'success');
  }

  function montarPayload() {
    var tipo = getTipoOrdem();
    var fornecedorId = AppUtils.safeString(AppUtils.qs('#fornecedorId').value);
    var secretariaId = AppUtils.safeString(AppUtils.qs('#secretariaId').value);
    var secretarioId = AppUtils.safeString(AppUtils.qs('#secretarioId').value);

    if (!fornecedorId) throw new Error('Selecione o fornecedor.');
    if (!secretariaId) throw new Error('Selecione a secretaria.');
    if (!secretarioId) throw new Error('Selecione o secretário.');

    var itensValidos = state.itens.filter(function (item) {
      return AppUtils.safeString(item.descricao) && AppUtils.toNumber(item.quantidade, 0) > 0;
    });
    if (!itensValidos.length) throw new Error('Adicione ao menos um item válido.');

    var payload = {
      TIPO_ORDEM: tipo,
      STATUS: AppUtils.safeString(AppUtils.qs('#statusOrdem').value),
      DATA_ORDEM: AppUtils.safeString(AppUtils.qs('#dataOrdem').value),
      FORNECEDOR_ID: fornecedorId,
      LICITACAO_ID: AppUtils.safeString(AppUtils.qs('#licitacaoId').value),
      SECRETARIA_ID: secretariaId,
      SECRETARIO_ID: secretarioId,
      VEICULO_ID: AppUtils.safeString(AppUtils.qs('#veiculoId').value),
      NUMERO_NF: AppUtils.safeString(AppUtils.qs('#numeroNf').value),
      CHAVE_NFE: AppUtils.safeString(AppUtils.qs('#chaveNfe').value),
      DATA_EMISSAO_NF: AppUtils.safeString(AppUtils.qs('#dataEmissaoNf').value),
      OBSERVACAO: AppUtils.safeString(AppUtils.qs('#observacao').value),
      ITENS: itensValidos.map(function (item) {
        return {
          ITEM: item.item,
          CODIGO_PRODUTO: item.codigoProduto,
          DESCRICAO: item.descricao,
          NCM: item.ncm,
          CFOP: item.cfop,
          UNIDADE: item.unidade,
          QUANTIDADE: AppUtils.toNumber(item.quantidade, 0),
          VALOR_UNITARIO: AppUtils.toNumber(item.valorUnitario, 0),
          VALOR_TOTAL: AppUtils.toNumber(item.valorTotal, 0),
          DESCONTO_ITEM: AppUtils.toNumber(item.descontoItem, 0),
          ORIGEM_XML: !!item.origemXml
        };
      })
    };

    if (tipo === APP_CONFIG.ORDER_TYPES.COMPRA && state.xmlOriginal) {
      payload.XML_ORIGINAL = state.xmlOriginal;
      payload.XML_PROCESSADO = state.xmlData;
    }
    return payload;
  }

  function getCurrentPreviewData() {
    var fornecedor = fornecedorAtual();
    var secretaria = secretariaAtual();
    var secretario = state.secretarios.find(function (s) {
      return String(s.ID) === String(AppUtils.qs('#secretarioId').value);
    }) || null;
    var veiculo = state.veiculos.find(function (v) {
      return String(v.ID) === String(AppUtils.qs('#veiculoId').value);
    }) || null;
    var licitacao = state.licitacoes.find(function (l) {
      return String(l.ID) === String(AppUtils.qs('#licitacaoId').value);
    }) || null;

    var totais = calcularTotais();
    return {
      numeroOrdem: AppUtils.safeString(AppUtils.qs('#numeroOrdemGerada').value) || 'RASCUNHO',
      tipo: getTipoOrdem(),
      status: AppUtils.safeString(AppUtils.qs('#statusOrdem').value),
      dataOrdem: AppUtils.safeString(AppUtils.qs('#dataOrdem').value),
      fornecedorNome: fornecedor ? fornecedor.RAZAO_SOCIAL : '-',
      cnpj: fornecedor ? fornecedor.CNPJ : '',
      licitacao: licitacao ? [licitacao.NUMERO, licitacao.MODALIDADE, licitacao.ANO].filter(Boolean).join(' | ') : '-',
      secretaria: secretaria ? secretaria.NOME : '-',
      secretario: secretario ? secretario.NOME : '-',
      veiculo: veiculo ? ((veiculo.PLACA || '-') + ' - ' + (veiculo.DESCRICAO || '-')) : '-',
      numeroNf: AppUtils.safeString(AppUtils.qs('#numeroNf').value) || '-',
      chaveNfe: AppUtils.safeString(AppUtils.qs('#chaveNfe').value) || '-',
      observacao: AppUtils.safeString(AppUtils.qs('#observacao').value) || '-',
      itens: state.itens,
      totais: totais
    };
  }

  function renderPrintArea(data) {
    AppUtils.qs('#printNumeroOrdem').textContent = data.numeroOrdem || 'RASCUNHO';
    AppUtils.qs('#printTipoOrdem').textContent = data.tipo === APP_CONFIG.ORDER_TYPES.COMPRA ? 'ORDEM DE COMPRA' : 'ORDEM DE SERVIÇO';
    AppUtils.qs('#printStatusOrdem').textContent = 'STATUS: ' + (data.status || '-');

    AppUtils.qs('#printFornecedor').textContent = data.fornecedorNome || '-';
    AppUtils.qs('#printCnpj').textContent = AppUtils.formatCnpj(data.cnpj || '');
    AppUtils.qs('#printDataOrdem').textContent = AppUtils.formatDateBr(data.dataOrdem || '');
    AppUtils.qs('#printLicitacao').textContent = data.licitacao || '-';
    AppUtils.qs('#printSecretaria').textContent = data.secretaria || '-';
    AppUtils.qs('#printSecretario').textContent = data.secretario || '-';
    AppUtils.qs('#printVeiculo').textContent = data.veiculo || '-';
    AppUtils.qs('#printNumeroNf').textContent = data.numeroNf || '-';
    AppUtils.qs('#printChaveNfe').textContent = data.chaveNfe || '-';
    AppUtils.qs('#printObservacao').textContent = data.observacao || '-';

    var printBody = AppUtils.qs('#printItensBody');
    if (!data.itens || !data.itens.length) {
      printBody.innerHTML = AppUtils.renderEmptyRow(7, 'Nenhum item');
    } else {
      printBody.innerHTML = data.itens.map(function (item) {
        return (
          '<tr>' +
          '<td>' + AppUtils.escapeHtml(item.item || item.ITEM || '-') + '</td>' +
          '<td>' + AppUtils.escapeHtml(item.descricao || item.DESCRICAO || '-') + '</td>' +
          '<td>' + AppUtils.escapeHtml(item.unidade || item.UNIDADE || '-') + '</td>' +
          '<td>' + AppUtils.escapeHtml(AppUtils.toNumber(item.quantidade || item.QUANTIDADE || 0, 0).toFixed(2)) + '</td>' +
          '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(item.valorUnitario || item.VALOR_UNITARIO || 0)) + '</td>' +
          '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(item.valorTotal || item.VALOR_TOTAL || 0)) + '</td>' +
          '<td>' + AppUtils.escapeHtml(AppUtils.formatCurrency(item.descontoItem || item.DESCONTO_ITEM || 0)) + '</td>' +
          '</tr>'
        );
      }).join('');
    }

    AppUtils.qs('#printTotalBruto').textContent = AppUtils.formatCurrency(data.totais.bruto || 0);
    AppUtils.qs('#printTotalDesconto').textContent = AppUtils.formatCurrency(data.totais.desconto || 0);
    AppUtils.qs('#printTotalLiquido').textContent = AppUtils.formatCurrency(data.totais.liquido || 0);
  }

  function preencherComOrdemSalva(data) {
    if (!data || !data.ordem) return;
    var ordem = data.ordem;
    AppUtils.qs('#numeroOrdemGerada').value = ordem.NUMERO_ORDEM || '';
    AppUtils.qs('#statusOrdem').value = ordem.STATUS || APP_CONFIG.ORDER_STATUS.RASCUNHO;
    AppUtils.qs('#tipoOrdem').value = ordem.TIPO_ORDEM || APP_CONFIG.ORDER_TYPES.COMPRA;
    AppUtils.qs('#dataOrdem').value = ordem.DATA_ORDEM || '';
    AppUtils.qs('#fornecedorId').value = ordem.FORNECEDOR_ID || '';
    preencherFornecedorCampos(fornecedorAtual());
    popularSelectLicitacoes(ordem.FORNECEDOR_ID || '');
    AppUtils.qs('#licitacaoId').value = ordem.LICITACAO_ID || '';

    AppUtils.qs('#secretariaId').value = ordem.SECRETARIA_ID || '';
    popularSecretariosVeiculos(ordem.SECRETARIA_ID || '');
    AppUtils.qs('#secretarioId').value = ordem.SECRETARIO_ID || '';
    AppUtils.qs('#veiculoId').value = ordem.VEICULO_ID || '';

    AppUtils.qs('#numeroNf').value = ordem.NUMERO_NF || '';
    AppUtils.qs('#chaveNfe').value = ordem.CHAVE_NFE || '';
    AppUtils.qs('#dataEmissaoNf').value = ordem.DATA_EMISSAO_NF || '';
    AppUtils.qs('#observacao').value = ordem.OBSERVACAO || '';

    state.itens = (data.itens || []).map(function (item) {
      return {
        item: item.ITEM,
        codigoProduto: item.CODIGO_PRODUTO || '',
        descricao: item.DESCRICAO || '',
        ncm: item.NCM || '',
        cfop: item.CFOP || '',
        unidade: item.UNIDADE || '',
        quantidade: AppUtils.toNumber(item.QUANTIDADE, 0),
        valorUnitario: AppUtils.toNumber(item.VALOR_UNITARIO, 0),
        valorTotal: AppUtils.toNumber(item.VALOR_TOTAL, 0),
        descontoItem: AppUtils.toNumber(item.DESCONTO_ITEM, 0),
        origemXml: !!item.ORIGEM_XML
      };
    });
    renderItens();
    toggleXmlPanel();
    renderPrintArea(getCurrentPreviewData());
  }

  async function carregarOrdemPorIdSeInformado() {
    var id = AppUtils.getQueryParam('id');
    if (!id) return;
    try {
      var data = await Api.obterOrdemPorId(id);
      preencherComOrdemSalva(data);
    } catch (err) {
      AppUtils.showToast('Não foi possível carregar a ordem: ' + AppUtils.getErrorMessage(err), 'warning');
    }
  }

  async function carregarDadosBase() {
    var resultados = await Promise.all([
      Api.listarFornecedores({ incluirInativos: false }),
      Api.listarLicitacoes({}),
      Api.listarSecretarias({ incluirInativas: false }),
      Api.listarSecretarios({ incluirInativos: false }),
      Api.listarVeiculos({ incluirInativos: false })
    ]);
    state.fornecedores = Array.isArray(resultados[0]) ? resultados[0] : [];
    state.licitacoes = Array.isArray(resultados[1]) ? resultados[1] : [];
    state.secretarias = Array.isArray(resultados[2]) ? resultados[2] : [];
    state.secretarios = Array.isArray(resultados[3]) ? resultados[3] : [];
    state.veiculos = Array.isArray(resultados[4]) ? resultados[4] : [];

    popularSelectFornecedores();
    popularSelectSecretarias();
    popularSelectLicitacoes('');
    popularSecretariosVeiculos('');
  }

  function bindEvents() {
    AppUtils.qs('#tipoOrdem').addEventListener('change', function () {
      toggleXmlPanel();
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#fornecedorId').addEventListener('change', function () {
      var fornecedor = fornecedorAtual();
      preencherFornecedorCampos(fornecedor);
      popularSelectLicitacoes(AppUtils.safeString(this.value));
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#secretariaId').addEventListener('change', function () {
      popularSecretariosVeiculos(AppUtils.safeString(this.value));
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#btnAdicionarItem').addEventListener('click', function () {
      addItem();
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#itensBody').addEventListener('input', function (ev) {
      var field = ev.target.dataset.field;
      var index = ev.target.dataset.index;
      if (field === undefined || index === undefined) return;
      atualizarItem(Number(index), field, ev.target.value);
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#itensBody').addEventListener('click', function (ev) {
      var idx = ev.target.dataset.removeItem;
      if (idx === undefined) return;
      removerItem(Number(idx));
      renderPrintArea(getCurrentPreviewData());
    });

    AppUtils.qs('#xmlFile').addEventListener('change', async function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      setError('');
      setSuccess('');
      try {
        await importarXml(file);
        renderPrintArea(getCurrentPreviewData());
      } catch (err) {
        setError(AppUtils.getErrorMessage(err));
      }
    });

    ['#statusOrdem', '#dataOrdem', '#licitacaoId', '#secretarioId', '#veiculoId', '#numeroNf', '#chaveNfe', '#dataEmissaoNf', '#observacao']
      .forEach(function (selector) {
        var el = AppUtils.qs(selector);
        if (!el) return;
        el.addEventListener('change', function () {
          renderPrintArea(getCurrentPreviewData());
        });
        el.addEventListener('input', function () {
          renderPrintArea(getCurrentPreviewData());
        });
      });

    AppUtils.qs('#btnSalvarOrdem').addEventListener('click', async function () {
      setError('');
      setSuccess('');
      var btn = this;
      AppUtils.setLoading(btn, true, 'Salvando...');
      try {
        var payload = montarPayload();
        var data = await Api.criarOrdem(payload);
        state.ordemSalva = data;
        preencherComOrdemSalva(data);
        setSuccess('Ordem salva com sucesso.');
        AppUtils.showToast('Ordem emitida com sucesso.', 'success');
      } catch (err) {
        setError(AppUtils.getErrorMessage(err));
        AppUtils.showToast(AppUtils.getErrorMessage(err), 'error');
      } finally {
        AppUtils.setLoading(btn, false);
      }
    });

    AppUtils.qs('#btnImprimirOrdem').addEventListener('click', function () {
      setError('');
      setSuccess('');
      renderPrintArea(getCurrentPreviewData());
      window.print();
    });

    AppUtils.qs('#btnLimparOrdem').addEventListener('click', function () {
      var ok = window.confirm('Deseja limpar os dados da ordem atual?');
      if (!ok) return;
      limparFormulario();
      renderPrintArea(getCurrentPreviewData());
    });
  }

  function limparFormulario() {
    AppUtils.qs('#tipoOrdem').value = APP_CONFIG.ORDER_TYPES.COMPRA;
    AppUtils.qs('#statusOrdem').value = APP_CONFIG.ORDER_STATUS.RASCUNHO;
    AppUtils.qs('#dataOrdem').value = new Date().toISOString().slice(0, 10);
    AppUtils.qs('#fornecedorId').value = '';
    AppUtils.qs('#licitacaoId').innerHTML = '<option value="">Selecione o fornecedor primeiro</option>';
    preencherFornecedorCampos(null);

    AppUtils.qs('#secretariaId').value = '';
    popularSecretariosVeiculos('');
    AppUtils.qs('#secretarioId').value = '';
    AppUtils.qs('#veiculoId').value = '';
    AppUtils.qs('#numeroNf').value = '';
    AppUtils.qs('#chaveNfe').value = '';
    AppUtils.qs('#dataEmissaoNf').value = '';
    AppUtils.qs('#observacao').value = '';
    AppUtils.qs('#numeroOrdemGerada').value = '';
    AppUtils.qs('#xmlResumo').value = '';
    AppUtils.qs('#xmlFile').value = '';

    state.itens = [];
    state.xmlData = null;
    state.xmlOriginal = '';
    state.ordemSalva = null;
    renderItens();
    toggleXmlPanel();
    setError('');
    setSuccess('');
  }

  async function init() {
    var ok = await Auth.ensureAuthenticatedPage();
    if (!ok) return;
    Auth.fillSessionUi();
    Auth.bindLogoutButtons();

    AppUtils.qs('#dataOrdem').value = new Date().toISOString().slice(0, 10);
    bindEvents();
    toggleXmlPanel();

    try {
      await carregarDadosBase();
      await carregarOrdemPorIdSeInformado();
      if (!state.itens.length) {
        addItem();
      } else {
        renderItens();
      }
      renderPrintArea(getCurrentPreviewData());
    } catch (err) {
      setError(AppUtils.getErrorMessage(err));
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
