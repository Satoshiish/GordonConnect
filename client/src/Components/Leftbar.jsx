import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useContext } from "react";
import { AuthContext } from "../authContext";
import { MessageSquare, Calendar, Bookmark, Users, BarChart2, LogOut, Home, User } from "lucide-react";

function Leftbar({ open, setOpen }) {
  const location = useLocation();
  const { theme } = useTheme();
  const { currentUser, logout } = useContext(AuthContext);

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <div 
      className={`fixed h-[calc(100vh-4rem)] top-16 overflow-y-auto transition-all duration-300 ease-in-out z-40
        ${open ? "w-64 left-0" : "w-0 -left-64 md:left-0 md:w-16"}
        ${theme === "dark" 
          ? "bg-gray-900 border-r border-gray-800 text-gray-300" 
          : "bg-white border-r border-gray-200 text-gray-600"}`}
    >
      <div className="flex flex-col h-full p-4">
        {/* Menu items */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {/* Home */}
            <li>
              <Link
                to="/"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/"
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Home className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>Home</span>
              </Link>
            </li>
            
            {/* Profile */}
            <li>
              <Link
                to={`/profile/${currentUser?.user_id}`}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname.startsWith("/profile")
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <User className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>Profile</span>
              </Link>
            </li>
            
            {/* Forum */}
            <li>
              <Link
                to="/forum"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/forum"
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <MessageSquare className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>Forum</span>
              </Link>
            </li>
            
            {/* Events */}
            <li>
              <Link
                to="/events"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/events"
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Calendar className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>Events</span>
              </Link>
            </li>
            
            {/* Bookmarks */}
            <li>
              <Link
                to="/bookmarks"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/bookmarks"
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Bookmark className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>Bookmarks</span>
              </Link>
            </li>
            
            {/* People */}
            <li>
              <Link
                to="/people"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/people"
                    ? theme === "dark"
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-teal-100/50 text-teal-600"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Users className="h-6 w-6" />
                <span className={`${!open && "md:hidden"} font-medium`}>People</span>
              </Link>
            </li>
            
            {/* Reports - Only show for admins */}
            {currentUser?.role === "admin" && (
              <li>
                <Link
                  to="/reports"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    location.pathname === "/reports"
                      ? theme === "dark"
                        ? "bg-emerald-900/30 text-emerald-400"
                        : "bg-teal-100/50 text-teal-600"
                      : theme === "dark"
                      ? "hover:bg-gray-800 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <BarChart2 className="h-6 w-6" />
                  <span className={`${!open && "md:hidden"} font-medium`}>Reports</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
        
        {/* Logout button at bottom */}
        <div className="mt-auto pt-4">
          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <LogOut className="h-6 w-6" />
            <span className={`${!open && "md:hidden"} font-medium`}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leftbar;





