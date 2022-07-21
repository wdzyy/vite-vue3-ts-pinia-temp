import axios from 'axios';
import { ElMessage } from 'element-plus';

const ENV = import.meta.env;
const { VITE_GLOB_API_URL } = ENV;

const CODE = {
  LOGIN_TIMEOUT: 1000,
  REQUEST_SUCCESS: 200,
  REQUEST_FOBID: 1001,
};

const instance = axios.create({
  baseURL: VITE_GLOB_API_URL,
  timeout: 1000,
  withCredentials: true,
});

instance.interceptors.request.use((config) => config);

instance.defaults.timeout = 5000;

instance.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      const { data } = response;
      if (data.code === CODE.REQUEST_SUCCESS) {
        return data;
      }
    }
    ElMessage({
      message: response.data.msg || response.data.message || '系统错误',
      type: 'error',
    });
    return response;
  },
  (err) => {
    const { config } = err;

    if (!config || !config.retry) return Promise.reject(err);

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= config.retry) {
      return Promise.reject(err);
    }

    config.retryCount += 1;

    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, config.retryDelay || 1);
    });

    return backoff.then(() => instance(config));
  },
);

export default instance;
