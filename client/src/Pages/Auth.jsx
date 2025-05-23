import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import { useTheme } from "../ThemeContext";

function Auth() {
  const [isActive, setIsActive] = useState(false);
  const { theme } = useTheme();

  // Animation variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const slideVariants = {
    login: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    register: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-100 via-white to-teal-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div 
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80"
      >
        {/* Left side - Form */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <Register setIsActive={setIsActive} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                <Login setIsActive={setIsActive} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - Welcome Message */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent drop-shadow-lg">
              Welcome Back!
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 opacity-90 font-medium">
              Sign in to continue where you left off.
            </p>
            <div className="space-y-4">
              <p className="text-xs sm:text-sm opacity-80">
                Need an account? Contact your administrator.
              </p>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;
