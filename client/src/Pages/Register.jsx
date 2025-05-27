import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, ArrowLeft, Shield } from "lucide-react";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";

function Register({ adminMode = false }) {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    role: "user" // Default role
  });
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { theme } = useTheme();
  
  let logoSrc = "/GC_NoBG.png";
  if (theme === "dark") logoSrc = "/GC_DarkBG.png";
  if (theme === "light") logoSrc = "/GC_WhiteBG.png";

  // If user is not admin and trying to access admin register page, redirect
  useEffect(() => {
    if (adminMode && (!currentUser || currentUser.role !== "admin")) {
      navigate("/");
    }
    // If not in admin mode and user is already logged in (and not admin), redirect to home
    if (!adminMode && currentUser && currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate, adminMode]);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    setErr(null);
    setSuccess("");
    setIsLoading(true);

    if (inputs.password.length < 8) {
      setErr("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      await makeRequest.post("/auth/register", inputs);
      setSuccess(adminMode 
        ? "User registered successfully!" 
        : "Registration successful! Redirecting to login...");
      
      // Clear form after successful registration
      setInputs({
        username: "",
        email: "",
        password: "",
        name: "",
        role: "user"
      });
      
      // If not in admin mode, redirect to login after a delay
      if (!adminMode) {
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (err) {
      setErr(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br ${
      theme === "dark" 
        ? "from-gray-900 to-gray-800" 
        : "from-gray-50 to-gray-100"
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`w-full max-w-md rounded-3xl shadow-2xl p-8 border ${
          theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src={logoSrc} alt="Logo" className="h-12 w-auto" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            {adminMode ? "Register New User" : "Create Account"}
          </h2>
          <p className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            {adminMode ? "Admin user registration" : "Join our community today"}
          </p>
        </div>

        <form onSubmit={handleClick} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} group-focus-within:text-emerald-500 transition-colors duration-200`} />
            </div>
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={inputs.username}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark" 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
              required
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} group-focus-within:text-emerald-500 transition-colors duration-200`} />
            </div>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={inputs.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark" 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
              required
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} group-focus-within:text-emerald-500 transition-colors duration-200`} />
            </div>
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              name="password"
              value={inputs.password}
              onChange={handleChange}
              minLength={8}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark" 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
              required
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserPlus className={`h-5 w-5 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} group-focus-within:text-emerald-500 transition-colors duration-200`} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              name="name"
              value={inputs.name}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark" 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
              required
            />
          </div>

          {err && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-red-900/50 text-red-200 border border-red-800"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {err}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-sm ${
                theme === "dark"
                  ? "bg-green-900/50 text-green-200 border border-green-800"
                  : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {success}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {adminMode ? "Register User" : "Create Account"}
              </>
            )}
          </motion.button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className={`text-sm hover:underline flex items-center justify-center gap-2 mx-auto ${
                theme === "dark" ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default Register;
