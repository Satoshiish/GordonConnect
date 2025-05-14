import React, { useContext } from "react";
import { useTheme } from "../ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import Post from "../Components/Post";
import { AuthContext } from "../authContext";

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl w-full mb-4" />
    ))}
  </div>
);

const EmptyState = ({ theme }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <svg className="w-16 h-16 text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
    <h3 className="font-semibold text-lg mb-1">No bookmarks yet</h3>
    <p className="text-sm text-gray-500 dark:text-gray-300">You haven't saved any posts yet. Start bookmarking your favorite posts!</p>
  </div>
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
    <div
      className={`pt-[50px] p-4 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="max-w-2xl mx-auto relative z-0">
        {/* Title */}
        <div
          className={`p-8 rounded-3xl mb-8 shadow-xl flex flex-col items-center gap-2 ${
            theme === "dark"
              ? "bg-gray-800 shadow-gray-950"
              : "bg-white shadow-gray-200"
          }`}
        >
          <svg className="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h1 className="text-3xl font-extrabold mb-1">Saved Bookmarks</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Your collection of saved posts and discussions. Easily revisit your favorite content anytime.
          </p>
        </div>

        {/* Main Content */}
        <div
          className={`p-6 rounded-2xl shadow-xl ${
            theme === "dark"
              ? "bg-gray-800 shadow-gray-950"
              : "bg-white shadow-gray-200"
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
            <div className="space-y-8">
              {bookmarks.map((post) => {
                const userName = post.ownerName || "Anonymous User";
                return (
                  <div key={post.posts_id} className="hover:shadow-2xl transition-shadow duration-200 rounded-xl">
                    <Post post={{ ...post, name: userName }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
