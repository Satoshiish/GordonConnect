import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { useTheme } from "../ThemeContext";

function Login({ setIsActive }) {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [err, setErr] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, loginAsGuest } = useContext(AuthContext);
  const { theme } = useTheme();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr(null);
    
    try {
      console.log("Attempting login with:", inputs.username);
      await login(inputs);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 404) {
          setErr("User not found. Please check your username.");
        } else if (err.response.status === 400) {
          setErr("Incorrect username or password. Please try again.");
        } else {
          setErr(err.response.data || "An error occurred during login");
        }
      } else if (err.request) {
        // The request was made but no response was received
        setErr("No response from server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setErr("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginAsGuest();
      navigate("/");
    } catch (err) {
      setErr("Failed to login as guest");
    } finally {
      setIsLoading(false);
    }
  };

  // Choose logo based on theme
  let logoSrc = "/GC_NoBG.png";
  if (theme === "dark") logoSrc = "/GC_DarkBG.png";
  if (theme === "light") logoSrc = "/GC_WhiteBG.png";

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={formVariants}
        className={`rounded-2xl shadow-xl overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="flex flex-col items-center pt-8 pb-4">
          <motion.div 
            variants={itemVariants}
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              theme === "dark" ? "bg-gray-700" : "bg-white shadow-md"
            }`}
          >
            <img
              src={logoSrc}
              alt="Logo"
              className="h-10 w-auto object-contain"
              draggable="false"
            />
          </motion.div>
          <motion.h2 
            variants={itemVariants}
            className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            Sign In
          </motion.h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-2 text-right">
              <Link 
                to="/forgot-password" 
                className={`text-sm font-medium hover:underline ${
                  theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                }`}
              >
                Forgot password?
              </Link>
            </motion.div>

            {err && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg text-sm ${
                  theme === "dark"
                    ? "bg-red-900/50 text-red-200 border border-red-800"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {err}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="mt-6 space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <User className="w-5 h-5" />
              Continue as Guest
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
