import { createContext, useState, type ReactNode } from "react";
import type { AuthContextType } from "./auth.types";
import { setAccessToken as setTokenStore } from "../services/tokenStore";

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  const setAccessTokenAndSync = (token: string) => {
    setAccessToken(token);
    setTokenStore(token);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        accessToken,
        setAccessToken: setAccessTokenAndSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
