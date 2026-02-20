import { useState } from "react";
import { useAuth } from "../contexts/useAuth";
import { logout } from "../services/authService";
import Popup from "../components/Popup";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [loggingOut, setLoggingOut] = useState(false);
  const { setIsAuthenticated, setAccessToken } = useAuth();
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      setAccessToken("");

      setPopup({
        isOpen: true,
        type: "success",
        title: "Logout Successfully",
        message: "Thank You For Visiting!",
      });
    } catch (error: unknown) {
      let errorMessage = "Something went wrong, ";
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
        title: "Logout Failed",
        message: errorMessage,
      });
    } finally {
      setLoggingOut(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-8 text-center w-full">
      <div className="p-8">
        <h1 className="text-[3.2em] leading-tight font-semibold mb-4">Home</h1>
        <p className="text-gray-500 dark:text-[#888] mb-6">Welcome Back 👋</p>
        <button
          disabled={loggingOut}
          type="submit"
          className="rounded-lg border border-transparent px-5 py-2.5 text-base font-medium bg-[#f9f9f9] dark:bg-[#1a1a1a] hover:border-[#646cff] transition-colors cursor-pointer focus:outline focus:outline-4 focus:outline-[#646cff]"
          onClick={handleLogout}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
        <Popup
          isOpen={popup.isOpen}
          onClose={() => {
            setPopup((prev) => ({ ...prev, isOpen: false }));

            setAccessToken("");
            setIsAuthenticated(false);
            navigate("/login");
          }}
          title={popup.title}
          message={popup.message}
          type={popup.type}
        />
      </div>
    </div>
  );
}
