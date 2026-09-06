import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true, params = {} } = options;

  const fetchData = useCallback(async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(url, { params: { ...params, ...overrideParams } });
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate && url) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [url, immediate]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
