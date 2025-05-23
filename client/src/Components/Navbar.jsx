import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { AuthContext } from "../authContext";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

function Navbar({ open, setOpen }) {
  const { theme, toggleTheme } = useTheme(); 
  const { currentUser } = useContext(AuthContext);

  // Time and date state
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  // Format: Sunday, May 18, 2025, 12:27 PM
  const dateTimeString = now.toLocaleString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });

  // Choose logo based on theme
  let logoSrc = "/GC_WhiteBG.png";
  if (theme === "dark") logoSrc = "/GC_DarkBG.png";

  return (
    <div
      className={`flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 border-b fixed top-0 left-0 w-full z-50 transition-colors duration-200
      ${theme === "dark" 
        ? "bg-gray-900/95 border-gray-800 text-white backdrop-blur-sm" 
        : "bg-white/95 border-gray-200 text-gray-900 backdrop-blur-sm"}`}
    >
      {/* Left Section (now includes icons) */}
      <div className="left flex items-center gap-2 sm:gap-4">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
          aria-expanded={open}
          className={`p-2 rounded-lg transition-all duration-200 hover:bg-opacity-80
            ${theme === "dark"
              ? "bg-emerald-600/90 hover:bg-emerald-500 text-white"
              : "bg-teal-500/90 hover:bg-teal-400 text-white"}`}
        >
          {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Logo and Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight transition-colors duration-200"
        >
          <img
            src={logoSrc}
            alt="Logo"
            className="h-8 w-auto object-contain drop-shadow"
            draggable="false"
          />
          <span className={`hidden sm:inline ${theme === "dark" ? "text-emerald-400" : "text-teal-600"}`}>
            GordonConnect
          </span>
        </Link>

        {/* Icons beside GordonConnect - Home button removed */}
        <div className="flex items-center gap-2 ml-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-gray-800 text-yellow-400" 
                : "hover:bg-gray-100 text-gray-700"}`}
          >
            {theme === "dark" ? (
              <WbSunnyOutlinedIcon className="text-xl" />
            ) : (
              <DarkModeOutlinedIcon className="text-xl" />
            )}
          </button>
        </div>
      </div>
      {/* Right Section: Date and Time with Calendar Icon */}
      <div className="flex items-center gap-2 min-w-[auto] sm:min-w-[260px] justify-end">
        <CalendarDays className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`} />
        <span className={`text-sm sm:text-base font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>{dateTimeString}</span>
      </div>
    </div>
  );
}

export default Navbar;






