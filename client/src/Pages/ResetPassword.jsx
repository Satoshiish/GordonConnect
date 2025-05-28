import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { makeRequest } from "../axios";

function ResetPassword() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  let logoSrc = "/GC_NoBG.png";
  if (theme === "dark") logoSrc = "/GC_DarkBG.png";
  if (theme === "light") logoSrc = "/GC_WhiteBG.png";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSuccess("");
    setIsLoading(true);

    if (newPassword.length < 8) {
      setErr("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Get email from URL if not already set
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email") || email;
      
      const response = await makeRequest.post("/auth/reset-password", {
        username,
        email: emailParam,
        newPassword
      });
      
      setSuccess("Password has been reset successfully!");
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setErr(error.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logoSrc} alt="Logo" className="h-12 w-auto" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Enter your username and new password below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              required
              minLength={8}
            />
          </div>
          <div className="relative group">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              required
              minLength={8}
            />
          </div>
          {err && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 shadow">
              {err}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800 shadow">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 flex items-center justify-center gap-2 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword; 
