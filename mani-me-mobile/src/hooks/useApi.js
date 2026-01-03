import { useState } from "react";
import api from "../api";

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const request = async (method, url, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api({ method, url, ...options });
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, request };
}
