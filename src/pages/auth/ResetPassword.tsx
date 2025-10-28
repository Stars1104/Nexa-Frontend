import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LightLogo from "../../assets/light-logo.png";
import DarkLogo from "../../assets/dark-logo.png";
import { useTheme } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useSystemTheme } from "../../hooks/use-system-theme";
import { resetPassword } from "../../api/auth";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const systemTheme = useSystemTheme();
  const isDarkMode = theme === "dark" || (theme === "system" && systemTheme);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    // If token or email is missing, redirect to forgot password page
    if (!token || !email) {
      setTimeout(() => {
        navigate("/forgot-password");
      }, 2000);
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Password validation
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    // Check for at least 1 number
    if (!/\d/.test(password)) {
      setError("A senha deve conter pelo menos 1 número.");
      setLoading(false);
      return;
    }

    // Check for at least 1 uppercase letter
    if (!/[A-Z]/.test(password)) {
      setError("A senha deve conter pelo menos 1 letra maiúscula.");
      setLoading(false);
      return;
    }

    // Check for at least 1 special character
    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("A senha deve conter pelo menos 1 caractere especial.");
      setLoading(false);
      return;
    }

    // Check for at least 1 lowercase letter
    if (!/[a-z]/.test(password)) {
      setError("A senha deve conter pelo menos 1 letra minúscula.");
      setLoading(false);
      return;
    }

    try {
      await resetPassword({
        token: token!,
        email: email!,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao redefinir senha. Tente novamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show message if token or email is missing
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#171717] transition-colors duration-300 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8">
          <img
            src={isDarkMode ? LightLogo : DarkLogo}
            alt="App Logo"
            className="h-6 mb-4 mx-auto"
          />
          <div className="text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 py-4 rounded-lg">
            Link inválido ou expirado. Redirecionando...
          </div>
        </div>
      </div>
    );
  }

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
              Sua senha foi redefinida com sucesso!
            </div>
            <span
              className="text-pink-600 font-bold text-base hover:underline cursor-pointer"
              onClick={() => navigate("/auth")}
            >
              Fazer login
            </span>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Redefinir senha
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-300 text-sm mb-6">
              Digite sua nova senha.
            </p>

            <form className="w-full" onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-4 transition-colors bg-transparent border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Confirmar senha
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md outline-none dark:text-white mb-4 transition-colors bg-transparent border"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />

              <div className="mb-6 text-xs text-gray-600 dark:text-gray-400">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Pelo menos 8 caracteres</li>
                  <li>Pelo menos 1 número</li>
                  <li>Pelo menos 1 letra maiúscula</li>
                  <li>Pelo menos 1 letra minúscula</li>
                  <li>Pelo menos 1 caractere especial</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-full transition-colors mb-2 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}

        {/* Login link */}
        <div className="text-center mt-4 text-sm flex flex-col gap-2">
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

export default ResetPassword;

