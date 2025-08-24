import axios, {AxiosError} from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth-error', {
            detail: {
              message: 'Please log in to continue',
              type: 'error',
            },
          }),
        );
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
