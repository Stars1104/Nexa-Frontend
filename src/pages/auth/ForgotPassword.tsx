import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LightLogo from "../../assets/light-logo.png";
import DarkLogo from "../../assets/dark-logo.png";
import { useTheme } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useSystemTheme } from "../../hooks/use-system-theme";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const systemTheme = useSystemTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("this is my funct")
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert(data.message || "Email not found. Please try again.");
      }
    } catch (error) {
      console.error("Error sending reset link:", error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717] transition-colors duration-300 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8 flex flex-col items-center">
        <img
          src={isDarkMode ? LightLogo : DarkLogo}
          alt="App Logo"
          className="h-6 mb-4 cursor-pointer"
          onClick={() => navigate("/")}
        />

        {submitted ? (
          <>
            <div className="text-green-600 dark:text-green-400 text-center mb-4 bg-[#19B95426] py-4 rounded-lg">
              Um email foi enviado para você com um link para redefinir sua senha.
              Verifique sua caixa de entrada (ou a pasta de spam).
            </div>
            <span
              className="text-pink-600 font-bold text-base hover:underline cursor-pointer"
              onClick={() => navigate("/auth")}
            >
              Voltar para login
            </span>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-300 text-sm mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>

            <form className="w-full" onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-6 transition-colors bg-transparent border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-full transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </>
        )}

        {/* Login link */}
        <div className="text-center mt-2 text-sm flex flex-col gap-2">
          <div className="flex justify-center gap-2">
            <span className="text-gray-700 dark:text-gray-200">
              Lembrou sua senha?
            </span>
            <Link to="/auth" className="text-pink-600 font-semibold hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
