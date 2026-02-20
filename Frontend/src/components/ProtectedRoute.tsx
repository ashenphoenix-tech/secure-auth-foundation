import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../contexts/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const {
    isAuthenticated,
    setIsAuthenticated,
    setAccessToken,
    accessToken: token,
  } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (token === "") {
          return;
        }

        if (token && token !== "") {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
        // Try refresh
        const response = await apiClient.post("/auth/refresh");
        const newToken = response.data.responseData.accessToken;

        if (newToken) {
          setAccessToken(newToken);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [token, setAccessToken, setIsAuthenticated]);

  if (isChecking) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">
          Logging You In.....
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
