import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { AuthContext } from "../authContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Navbar({ open, setOpen }) {
  const { theme, toggleTheme } = useTheme(); 
  const { currentUser } = useContext(AuthContext);

  // Choose logo based on theme
  let logoSrc = "/GC_WhiteBG.png";
  if (theme === "dark") logoSrc = "/GC_DarkBG.png";

  return (
    <div
      className={`flex items-center justify-between h-16 px-4 sm:px-6 border-b fixed top-0 left-0 w-full shadow-sm z-50 transition-colors duration-200
      ${theme === "dark" 
        ? "bg-gray-900/95 border-gray-800 text-white backdrop-blur-sm" 
        : "bg-white/95 border-gray-200 text-gray-900 backdrop-blur-sm"}`}
    >
      {/* Left Section (now includes icons) */}
      <div className="left flex items-center gap-4">
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
          <span className={theme === "dark" ? "text-emerald-400" : "text-teal-600"}>
            GordonConnect
          </span>
        </Link>

        {/* Icons beside GordonConnect */}
        <div className="flex items-center gap-2 ml-2">
          <Link 
            to="/"
            className={`p-2 rounded-lg transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-gray-800" 
                : "hover:bg-gray-100"}`}
          >
            <HomeOutlinedIcon className="text-xl" />
          </Link>

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
    </div>
  );
}

export default Navbar;
