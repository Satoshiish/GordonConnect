import React, { useContext } from "react";
import { useTheme } from "../ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import Post from "../Components/Post";
import { AuthContext } from "../authContext";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkIcon, AlertCircle } from "lucide-react";

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl w-full mb-4" />
    ))}
  </div>
);

const EmptyState = ({ theme }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center py-12"
  >
    <svg className="w-16 h-16 text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
    <h3 className="font-semibold text-lg mb-1">No bookmarks yet</h3>
    <p className="text-sm text-gray-500 dark:text-gray-300">You haven't saved any posts yet. Start bookmarking your favorite posts!</p>
  </motion.div>
);

const Bookmarks = () => {
  const { theme } = useTheme();
  const { currentUser, isGuest, canBookmark } = useContext(AuthContext);

  const {
    data: bookmarks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get("/bookmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: canBookmark,
  });

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className={`mb-6 p-4 rounded-xl ${
          theme === "dark" 
            ? "bg-gray-800 border border-gray-700" 
            : "bg-white border border-gray-200"
        }`}>
          <h1 className="text-2xl font-bold mb-2">Your Bookmarks</h1>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Access your saved posts here
          </p>
        </div>
        
        {/* Bookmarks list */}
        <div className={`space-y-4 ${theme === "dark" ? "divide-gray-800" : "divide-gray-200"}`}>
          {!canBookmark ? (
            <div className={`p-6 rounded-xl border text-center ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-gray-300"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}>
              <h3 className="font-medium mb-1">Please sign in to view bookmarks</h3>
              <p className="text-sm">Bookmarks are only available to registered users.</p>
            </div>
          ) : isLoading ? (
            <div className={`flex justify-center items-center py-20 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="font-medium">Loading bookmarks...</span>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className={`p-6 rounded-xl border text-center ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-gray-300"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}>
              <h3 className="font-medium mb-1">No bookmarks yet</h3>
              <p className="text-sm">Start saving posts you want to revisit later.</p>
            </div>
          ) : (
            bookmarks.map(bookmark => (
              <div key={bookmark.id} className={`p-4 rounded-xl border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              } transition-colors`}>
                {/* Bookmark content */}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
