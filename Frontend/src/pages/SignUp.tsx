import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  signUpSchema,
  type SignUpForm,
  PASSWORD_TOOLTIP_LINES,
} from "../schemas/signUpSchema";
import { signUp } from "../services/authService";
import Popup from "../components/Popup";
import background from "../assets/background.jpg";
import { EyeClosed, EyeOpen } from "../components/Eyeicon";

const inputClassName =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [showRetypeTooltip, setShowRetypeTooltip] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpForm, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [successfulUsername, setSuccessfulUsername] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const result = signUpSchema.safeParse({
      username,
      email,
      password,
      retypePassword,
    });
    if (result.success === false) {
      const fieldErrors: Partial<Record<keyof SignUpForm, string>> = {};
      const flat = z.flattenError(result.error);
      if (flat.fieldErrors) {
        for (const [key, messages] of Object.entries(flat.fieldErrors)) {
          const k = key as keyof SignUpForm;
          if (messages?.[0]) fieldErrors[k] = messages[0];
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await signUp({
        userName: username,
        email: email,
        password: password,
      });

      // Check if response status is success (0) or HTTP status is 200/201
      if (response.responseStatus === 0) {
        // Store username for redirect
        setSuccessfulUsername(username);
        setPopup({
          isOpen: true,
          type: "success",
          title: "Account Created Successfully!",
          message:
            response.responseMessage ||
            "Your account has been created successfully.",
        });
        // Reset form on success
        setUsername("");
        setEmail("");
        setPassword("");
        setRetypePassword("");
      } else {
        // API returned error response
        setPopup({
          isOpen: true,
          type: "error",
          title: "Sign Up Failed",
          message:
            response.responseMessage ||
            "Something went wrong. Please try again.",
        });
      }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center 
             px-4 py-8 bg-cover bg-center bg-no-repeat"
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
            Create an account
          </h1>

          <p className="text-sm text-white/70 text-center mb-8">
            Enter your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-username"
                  className="block text-sm font-medium text-white/80 mb-1.5 text-left"
                >
                  Username
                </label>
              </div>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={`${inputClassName} ${errors.username ? "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                aria-invalid={!!errors.username}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
              />
              {errors.username && (
                <p
                  id="username-error"
                  className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email Id */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-email"
                  className="text-sm font-medium text-white/80"
                >
                  Email Id
                </label>
              </div>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClassName} ${errors.email ? "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-password"
                  className="text-sm font-medium text-white/80"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordTooltip(true)}
                  onBlur={() => setShowPasswordTooltip(false)}
                  placeholder="Enter your password"
                  className={`${inputClassName.replace("px-4", "pl-4 pr-10")} ${errors.password ? "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : showPasswordTooltip
                        ? "password-tooltip"
                        : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                            text-white/60 hover:text-white
                            transition-colors duration-200
                            focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
                {showPasswordTooltip && (
                  <div
                    id="password-tooltip"
                    role="tooltip"
                    className="absolute left-0 right-0 top-full z-10 mt-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 shadow-lg"
                  >
                    <p className="text-sm font-medium text-black/80 text-left mb-1.5">
                      Password guidelines
                    </p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {PASSWORD_TOOLTIP_LINES.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Retype password */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-retype-password"
                  className="text-sm font-medium text-white/80"
                >
                  Retype password
                </label>
              </div>
              <div className="relative">
                <input
                  id="signup-retype-password"
                  type={showRetypePassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  onFocus={() => setShowRetypeTooltip(true)}
                  onBlur={() => setShowRetypeTooltip(false)}
                  placeholder="Retype your password"
                  className={`${inputClassName.replace("px-4", "pl-4 pr-10")} ${errors.retypePassword ? "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  aria-invalid={!!errors.retypePassword}
                  aria-describedby={
                    errors.retypePassword
                      ? "retype-password-error"
                      : showRetypeTooltip
                        ? "retype-password-tooltip"
                        : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowRetypePassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                            text-white/60 hover:text-white
                            transition-colors duration-200
                            focus:outline-none cursor-pointer"
                  aria-label={
                    showRetypePassword ? "Hide password" : "Show password"
                  }
                >
                  {showRetypePassword ? <EyeOpen /> : <EyeClosed />}
                </button>
                {showRetypeTooltip && (
                  <div
                    id="retype-password-tooltip"
                    role="tooltip"
                    className="absolute left-0 right-0 top-full z-10 mt-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 shadow-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white mb-1.5">
                      Password guidelines
                    </p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {PASSWORD_TOOLTIP_LINES.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {errors.retypePassword && (
                <p
                  id="retype-password-error"
                  className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.retypePassword}
                </p>
              )}
            </div>

            {/* Sign up button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3 mt-6 font-medium text-white
                     bg-gradient-to-r from-blue-500 to-indigo-600
                     hover:from-blue-600 hover:to-indigo-700
                     shadow-lg shadow-blue-600/30
                     transition-all duration-200 cursor-pointer"
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          {/* Already a member link */}
          <p className="mt-8 text-center text-sm text-white/70">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Log in instead
            </Link>
          </p>
        </div>

        {/* Popup for success/error messages */}
        <Popup
          isOpen={popup.isOpen}
          onClose={() => {
            setPopup((prev) => ({ ...prev, isOpen: false }));
            // Redirect to login page with username prefilled only if signup was successful
            if (popup.type === "success" && successfulUsername) {
              navigate(
                `/login?username=${encodeURIComponent(successfulUsername)}`,
              );
              setSuccessfulUsername(null); // Clear after redirect
            }
          }}
          title={popup.title}
          message={popup.message}
          type={popup.type}
        />
      </div>
    </div>
  );
}
