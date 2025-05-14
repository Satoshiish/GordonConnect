import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import React, { useContext, useState } from "react";
import { BsBoxArrowRight } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../authContext";
import { useTheme } from "../ThemeContext";
import { ChevronDown } from "lucide-react";

function Leftbar({ open, setOpen }) {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const navigate = useNavigate();

  const userId = currentUser?.id || currentUser?.user_id || currentUser?._id;

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/auth");
  };

  const Menus = [
    {
      icon: <ForumOutlinedIcon />,
      title: "Forum",
      path: "/forum",
    },
    {
      icon: <EventAvailableOutlinedIcon />,
      title: "Events",
      path: "/events",
    },
    {
      icon: <BookmarkBorderOutlinedIcon />,
      title: "Bookmarks",
      path: "/bookmarks",
    },
    {
      icon: <PeopleAltOutlinedIcon />,
      title: "Suggestions For You",
      path: "/people",
    },
  ];

  return (
    <div className="flex">
      <div
        className={`h-[calc(100vh-4rem)] sticky top-16 overflow-hidden transition-all duration-300 ease-in-out
          ${open ? "w-72" : "w-20"}
          ${theme === "dark" 
            ? "bg-gray-900/95 border-r border-gray-800 text-gray-300" 
            : "bg-white/95 border-r border-gray-200 text-gray-600"}`}
      >
        <div className="flex flex-col h-full p-4">
          {/* User Profile */}
          <Link
            to={`/profile/${userId}`}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-gray-800/50" 
                : "hover:bg-gray-100/50"}`}
          >
            <div className="relative w-10 h-10">
              <img
                src={currentUser?.profilePic && currentUser.profilePic.trim() !== "" ? `/upload/${currentUser.profilePic}` : "/default-profile.jpg"}
                alt="User"
                className={`w-full h-full rounded-full object-cover ring-2 ring-offset-2 transition-all duration-200 ${
                  theme === "dark" ? "ring-emerald-500" : "ring-teal-500"
                }`}
              />
            </div>
            {open && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {currentUser?.name || "My Profile"}
                </span>
                <span className="text-xs opacity-70">View Profile</span>
              </div>
            )}
          </Link>

          {/* Divider */}
          {open && (
            <hr className={`my-6 ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`} />
          )}

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-2">
            {Menus.map((menu, index) => (
              <React.Fragment key={index}>
                <Link
                  to={menu.path || "#"}
                  onClick={() => menu.submenu && setSubmenuOpen(!submenuOpen)}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    ${menu.spacing ? "mt-4" : ""}
                    ${theme === "dark" 
                      ? "hover:bg-gray-800/50 hover:text-emerald-400" 
                      : "hover:bg-gray-100/50 hover:text-teal-600"}
                    ${!open ? "justify-center" : ""}`}
                >
                  <span className={`text-xl transition-colors duration-200
                    ${theme === "dark" 
                      ? "group-hover:text-emerald-400" 
                      : "group-hover:text-teal-600"}`}
                  >
                    {menu.icon}
                  </span>
                  {open && (
                    <span className="flex-1 text-sm font-medium">{menu.title}</span>
                  )}
                  {menu.submenu && open && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200
                        ${submenuOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {/* Submenu */}
                {menu.submenu && open && (
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out
                      ${submenuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <ul className="pl-12 pt-2 space-y-1">
                      {menu.submenuItems.map((submenuItem, idx) => (
                        <li
                          key={idx}
                          className={`cursor-pointer p-2 rounded-lg text-sm transition-all duration-200
                            ${theme === "dark" 
                              ? "hover:bg-gray-800/50 hover:text-emerald-400" 
                              : "hover:bg-gray-100/50 hover:text-teal-600"}`}
                        >
                          {submenuItem.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Divider */}
          {open && (
            <hr className={`my-6 ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`} />
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              ${theme === "dark" 
                ? "hover:bg-red-500/10 hover:text-red-400" 
                : "hover:bg-red-100/50 hover:text-red-600"}
              ${!open ? "justify-center" : ""}`}
          >
            <BsBoxArrowRight className="text-xl" />
            {open && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Leftbar;