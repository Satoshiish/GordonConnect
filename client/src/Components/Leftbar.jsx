import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useContext } from "react";
import { AuthContext } from "../authContext";
import { MessageSquare, Calendar, Bookmark, Users, BarChart2, LogOut, Home, User, UserPlus } from "lucide-react";

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

  const menuItems = [
    { path: "/", label: "Home", icon: <Home className="h-6 w-6" /> },
    { path: `/profile/${currentUser?.user_id}`, label: "Profile", icon: <User className="h-6 w-6" /> },
    { path: "/forum", label: "Forum", icon: <MessageSquare className="h-6 w-6" /> },
    { path: "/events", label: "Events", icon: <Calendar className="h-6 w-6" /> },
    { path: "/bookmarks", label: "Bookmarks", icon: <Bookmark className="h-6 w-6" /> },
    { path: "/people", label: "People", icon: <Users className="h-6 w-6" /> },
    ...(currentUser?.role === "admin" ? [
      { path: "/reports", label: "Reports", icon: <BarChart2 className="h-6 w-6" /> },
      { path: "/register", label: "Register User", icon: <UserPlus className="h-6 w-6" /> }
    ] : [])
  ];

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
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center md:justify-${open ? "start" : "center"} gap-3 p-3 rounded-xl transition-all duration-200 ${
                    location.pathname === item.path
                      ? theme === "dark"
                        ? "bg-emerald-900/30 text-emerald-400"
                        : "bg-teal-100/50 text-teal-600"
                      : theme === "dark"
                      ? "hover:bg-gray-800/70 text-gray-300 hover:text-gray-100"
                      : "hover:bg-gray-100/70 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  <span className={`font-medium ${!open && "md:hidden"}`}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button at bottom */}
        <div className="mt-auto pt-4">
          <button
            onClick={logout}
            className={`flex w-full items-center md:justify-${open ? "start" : "center"} gap-3 p-3 rounded-xl transition-all duration-200 ${
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <LogOut className="h-6 w-6" />
            <span className={`font-medium ${!open && "md:hidden"}`}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leftbar;










