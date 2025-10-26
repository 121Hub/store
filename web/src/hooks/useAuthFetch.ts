import axios from 'axios';
import { useAuth } from '../context/auth';
import { useEffect } from 'react';

export function useAuthFetch() {
  const { accessToken } = useAuth();
  useEffect(() => {
    axios.defaults.headers.common['Authorization'] = accessToken
      ? `Bearer ${accessToken}`
      : '';
    axios.defaults.withCredentials = true;
  }, [accessToken]);
  return axios;
}
