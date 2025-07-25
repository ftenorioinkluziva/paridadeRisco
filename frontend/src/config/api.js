const API_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
  },
  production: {
    baseURL: 'https://apirisky.blackboxinovacao.com.br/api',
  },
};

export const getEnvironment = () => {
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'development';
  }
  return 'production';
};

export const getApiUrl = () => API_CONFIG[getEnvironment()].baseURL;

export const API_URL = getApiUrl();

console.log(`Environment: ${getEnvironment()}, API URL: ${API_URL}`);

export default API_CONFIG;
