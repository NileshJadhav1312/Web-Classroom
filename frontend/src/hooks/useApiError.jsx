import { useState, useCallback } from "react";

export const useApiError = () => {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    const displayMessage =
      err.response?.data?.message || err.message || "An error occurred";
    setError(displayMessage);
    console.error("API Error:", err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
