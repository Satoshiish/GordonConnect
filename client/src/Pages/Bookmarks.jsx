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
    <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`mb-8 rounded-3xl shadow-xl overflow-hidden relative ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -inset-[10px] bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          </div>
          
          <div className="relative p-6 sm:p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${
                theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-100"
              }`}>
                <BookmarkIcon size={28} className={
                  theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                } />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                  Your Bookmarks
                </h1>
                <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Posts and content you've saved for later
                </p>
              </div>
            </div>
            
            {!canBookmark && (
              <div className={`mt-6 p-4 rounded-xl text-sm ${
                theme === "dark" ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-700"
              }`}>
                <p className="flex items-center gap-2">
                  <AlertCircle size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                  <span>Please sign in to view and manage your bookmarks.</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Main Content */}
        <div
          className={`p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl backdrop-blur-xl border ${
            theme === "dark"
              ? "bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-700/50"
              : "bg-gradient-to-r from-white to-gray-50/90 border-gray-100"
          }`}
        >
          {!canBookmark ? (
            <div
              className={`p-6 rounded-xl border text-center ${
                theme === "dark"
                  ? "bg-gray-750 border-gray-700 text-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <h3 className="font-medium mb-1">Please sign in to view bookmarks</h3>
              <p className="text-sm">Bookmarks are only available to registered users.</p>
            </div>
          ) : isLoading ? (
            <Skeleton />
          ) : error ? (
            <p className="text-red-500">Failed to load bookmarks.</p>
          ) : bookmarks.length === 0 ? (
            <EmptyState theme={theme} />
          ) : (
            <AnimatePresence>
              <div className="space-y-8">
                {bookmarks.map((post, idx) => {
                  const userName = post.ownerName || "Anonymous User";
                  return (
                    <motion.div
                      key={post.posts_id}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.97 }}
                      transition={{ duration: 0.4, delay: idx * 0.07, ease: 'easeOut' }}
                      className="hover:shadow-2xl transition-shadow duration-200 rounded-xl"
                    >
                      <Post post={{ ...post, name: userName }} />
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
