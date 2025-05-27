import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, ArrowLeft } from "lucide-react";
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
      setSuccess("User registered successfully!");
      
      // Clear form after successful registration
      setInputs({
        username: "",
        email: "",
        password: "",
        name: "",
        role: "user"
      });
    } catch (err) {
      setErr(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center p-4 ${
      theme === "dark" 
        ? "text-white" 
        : "text-gray-900"
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-3xl rounded-xl shadow-lg p-5 border ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Title and description */}
          <div className="md:w-1/3 flex flex-col justify-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
              Register New User
            </h2>
            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Create accounts for new team members with appropriate access levels.
            </p>
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-2 rounded-lg text-sm ${
                  theme === "dark"
                    ? "bg-green-900/50 text-green-200 border border-green-800"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {success}
              </motion.div>
            )}
          </div>
          
          {/* Right side - Form */}
          <div className="md:w-2/3">
            <form onSubmit={handleClick} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={inputs.username}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:ring-1 focus:ring-emerald-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={inputs.email}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:ring-1 focus:ring-emerald-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  name="password"
                  value={inputs.password}
                  onChange={handleChange}
                  minLength={8}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:ring-1 focus:ring-emerald-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  name="name"
                  value={inputs.name}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:ring-1 focus:ring-emerald-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
                  }`}
                  required
                />
              </div>

              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`col-span-2 p-2 rounded-lg text-sm ${
                    theme === "dark"
                      ? "bg-red-900/50 text-red-200 border border-red-800"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {err}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="col-span-2 py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register User
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
