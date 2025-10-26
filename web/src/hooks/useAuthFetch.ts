import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export function useAuthFetch() {
  const { accessToken } = useAuth();
  useEffect(() => {
    axios.defaults.withCredentials = true;
    if (accessToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }, [accessToken]);
  return axios;
}
