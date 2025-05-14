import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

function Auth() {
  const [isActive, setIsActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl min-h-[600px] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="register"
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full w-full"
              >
                <Register setIsActive={setIsActive} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full w-full"
              >
                <Login setIsActive={setIsActive} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - Welcome Message */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full md:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 text-center"
          >
            <h1 className="text-4xl font-bold mb-4">
              Welcome Back!
            </h1>
            <p className="text-lg mb-8 opacity-90">
              Sign in to continue where you left off.
            </p>
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                Contact your administrator to create a new account.
              </p>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
