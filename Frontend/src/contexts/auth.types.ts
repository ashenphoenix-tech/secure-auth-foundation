export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  accessToken: string;
  setAccessToken: (token: string) => void;
}
