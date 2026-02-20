import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../services/authService";
import Popup from "../components/Popup";
import { useAuth } from "../contexts/useAuth";
import background from "../assets/background.jpg";
import { EyeClosed, EyeOpen } from "../components/Eyeicon";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, setAccessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [loginBy, setLoginBy] = useState<"username" | "email">("username");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Prefill username from URL query parameter (from signup redirect)
  useEffect(() => {
    const usernameParam = searchParams.get("username");
    if (usernameParam) {
      setIdentifier(usernameParam);
      setLoginBy("username"); // Ensure username mode is selected
    }
  }, [searchParams]);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (identifier.trim() === "" || password.trim() === "") {
        setPopup({
          isOpen: true,
          type: "error",
          title: "Validation Error",
          message: "Please Provide Valid Details.",
        });
        return;
      }

      const response = await login({
        identifier,
        password,
      });

      if (response.responseStatus !== 0 || !response.responseData) {
        setPopup({
          isOpen: true,
          type: "error",
          title: "Login Failed",
          message:
            response.responseMessage ||
            "Invalid credentials. Please try again.",
        });
        return;
      }

      const token = response.responseData.accessToken;
      setAccessToken(token);

      setPopup({
        isOpen: true,
        type: "success",
        title: "Login Successful",
        message: "Welcome back! Redirecting to dashboard...",
      });
      setIsAuthenticated(true);
    } catch (error: unknown) {
      // Handle axios errors or network errors
      let errorMessage = "Something went wrong. Please try again.";
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const apiError = error.response.data as {
          responseMessage?: string;
          responseStatus?: number;
        };
        if (apiError.responseMessage) {
          errorMessage = apiError.responseMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setPopup({
        isOpen: true,
        type: "error",
        title: "Sign Up Failed",
        message: errorMessage,
      });
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center 
             px-4 py-8  
             bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />
      <div className="w-full max-w-md mx-auto">
        {/* Glass Card */}
        <div
          className="relative z-10 w-full max-w-md rounded-3xl
      bg-white/10 backdrop-blur-2xl
      border border-white/20
      shadow-[0_20px_60px_rgba(0,0,0,0.6)]
      p-10"
        >
          <h1 className="text-3xl font-semibold text-white text-center mb-2">
            Welcome back
          </h1>

          <p className="text-sm text-white/70 text-center mb-8">
            Sign in to your account to continue
          </p>

          {/* Segmented Switch */}
          <div
            className="flex rounded-xl bg-white/10 border border-white/20 p-1 mb-6"
            role="group"
          >
            {["username", "email"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLoginBy(type as "username" | "email")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg cursor-pointer focus:z-10 transition-all ${
                  loginBy === type
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {type === "username" ? "Username" : "Email"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5 text-left">
                {loginBy === "username" ? "Username" : "Email address"}
              </label>
              <input
                type={loginBy === "email" ? "email" : "text"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  loginBy === "username"
                    ? "Enter your username"
                    : "you@example.com"
                }
                className="w-full rounded-xl border border-white/20 bg-white/10
                       px-4 py-3 text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-blue-400/40
                       focus:border-blue-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-white/80">
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/20 bg-white/10
                         px-4 py-3 text-white placeholder-white/50
                         focus:outline-none focus:ring-2 focus:ring-blue-400/40
                         focus:border-blue-400 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
             text-white/60 hover:text-white
             transition-colors duration-200
             focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              disabled={isLoading}
              type="submit"
              className="w-full rounded-xl py-3 mt-6 font-medium text-white
                     bg-gradient-to-r from-blue-500 to-indigo-600
                     hover:from-blue-600 hover:to-indigo-700
                     shadow-lg shadow-blue-600/30
                     transition-all duration-200 cursor-pointer"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-white/70">
            New User?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Create Free Account
            </Link>
          </p>
        </div>

        <Popup
          isOpen={popup.isOpen}
          onClose={() => {
            setPopup((prev) => ({ ...prev, isOpen: false }));
            if (popup.type === "success") navigate("/home");
          }}
          title={popup.title}
          message={popup.message}
          type={popup.type}
        />
      </div>
    </div>
  );
}
