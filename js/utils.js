window.AppUtils = (function () {
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function safeString(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function toNumber(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback || 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : (fallback || 0);
    var normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    var num = Number(normalized);
    return Number.isNaN(num) ? (fallback || 0) : num;
  }

  function round2(value) {
    return Math.round(toNumber(value) * 100) / 100;
  }

  function formatCurrency(value) {
    return round2(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatDateBr(value) {
    if (!value) return '';
    var date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
  }

  function toInputDate(value) {
    if (!value) return '';
    var date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  function normalizeCnpj(value) {
    return safeString(value).replace(/\D/g, '');
  }

  function formatCnpj(value) {
    var raw = normalizeCnpj(value);
    if (raw.length !== 14) return safeString(value);
    return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  function escapeHtml(text) {
    return safeString(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseJson(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return fallback;
    }
  }

  function getStoredJson(key, fallback) {
    var raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return parseJson(raw, fallback);
  }

  function setStoredJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getErrorMessage(err) {
    if (!err) return 'Erro inesperado.';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    return 'Erro inesperado.';
  }

  function setLoading(button, loading, loadingText) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = loadingText || 'Carregando...';
      button.classList.add('is-loading');
    } else {
      button.disabled = false;
      button.classList.remove('is-loading');
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    }
  }

  function ensureToastContainer() {
    var container = qs('#toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type, timeout) {
    var container = ensureToastContainer();
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message || 'Operacao realizada.';
    container.appendChild(toast);

    var ttl = typeof timeout === 'number' ? timeout : 3500;
    setTimeout(function () {
      toast.classList.add('toast-hide');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, ttl);
  }

  function renderEmptyRow(colspan, message) {
    return (
      '<tr>' +
      '<td class="empty-row" colspan="' + colspan + '">' + escapeHtml(message || 'Nenhum registro encontrado.') + '</td>' +
      '</tr>'
    );
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  return {
    qs: qs,
    qsa: qsa,
    safeString: safeString,
    toNumber: toNumber,
    round2: round2,
    formatCurrency: formatCurrency,
    formatDateBr: formatDateBr,
    toInputDate: toInputDate,
    normalizeCnpj: normalizeCnpj,
    formatCnpj: formatCnpj,
    escapeHtml: escapeHtml,
    parseJson: parseJson,
    getStoredJson: getStoredJson,
    setStoredJson: setStoredJson,
    getErrorMessage: getErrorMessage,
    setLoading: setLoading,
    showToast: showToast,
    renderEmptyRow: renderEmptyRow,
    getQueryParam: getQueryParam,
    clone: clone
  };
})();
