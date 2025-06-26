const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5001/api'
  },
  production: {
    baseURL: 'https://apirisky.blackboxinovacao.com.br/api'
  }
};

// Detectar ambiente automaticamente
const getEnvironment = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'development';
  }
  return 'production';
};

const currentEnv = getEnvironment();
export const API_URL = API_CONFIG[currentEnv].baseURL;

console.log(`Environment: ${currentEnv}, API URL: ${API_URL}`);

// Também exportar para uso em outros arquivos
export default API_CONFIG;