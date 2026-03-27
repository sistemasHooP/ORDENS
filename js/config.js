window.APP_CONFIG = Object.freeze({
  APP_NAME: 'Sistema de Ordens - Prefeitura de Riachuelo/RN',
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbyRZdxeNyXdbo3dGSTJ-oR_4h_EukJdyhK9TZuXq8m2n-mcZrt3Nxa3dvs0W0o3pIPn/exec',
  REQUEST_TIMEOUT_MS: 30000,
  STORAGE_KEYS: Object.freeze({
    TOKEN: 'sistema_ordens_token',
    USER: 'sistema_ordens_user'
  }),
  ORDER_TYPES: Object.freeze({
    COMPRA: 'COMPRA',
    SERVICO: 'SERVICO'
  }),
  ORDER_STATUS: Object.freeze({
    RASCUNHO: 'RASCUNHO',
    EMITIDA: 'EMITIDA',
    CANCELADA: 'CANCELADA'
  })
});
