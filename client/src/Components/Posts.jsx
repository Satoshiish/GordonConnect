import React, { useState, useContext, useEffect } from "react";
import Post from "./Post";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { Loader2 } from "lucide-react";
import { AuthContext } from "../authContext";

const Posts = ({ userId = null }) => {  
  const { theme } = useTheme();
  const { currentUser } = useContext(AuthContext);
  const [userInterests, setUserInterests] = useState([]);
  const categoryTabs = [
    { label: "All", value: "" },
    { label: "Student Life", value: "Student Life" },
    { label: "Organization", value: "Organization" },
    { label: "Academics", value: "Academics" },
    { label: "Campus Services", value: "Campus Services" },
  ];
  const [category, setCategory] = useState("");

  const { isPending, error, data } = useQuery({
    queryKey: userId ? ["posts", userId, category] : ["posts", category],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");  
        let url = userId ? `/posts?userId=${userId}` : "/posts";
        if (category) url += (url.includes("?") ? "&" : "?") + `anyCategory=${encodeURIComponent(category)}`;
        
        const config = {};
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
        
        const res = await makeRequest.get(url, config);
        return res.data;
      } catch (error) {
        console.error("Error fetching posts:", error);
        return []; // Return empty array to prevent error state
      }
    },
    enabled: userId !== undefined,
    retry: 2,
    retryDelay: 1000,
  });

   if (isPending) {
    return (
      <>
        {/* Category Filter Tabs */}
        <div className="mb-5 flex gap-2 flex-wrap">
          {categoryTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`px-5 py-2 rounded-full font-semibold shadow-sm border-2 transition
                ${theme === "dark"
                  ? category === tab.value
                    ? tab.label === "All"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : tab.label === "Student Life"
                        ? "bg-blue-900 text-blue-200 border-blue-800"
                        : tab.label === "Organization"
                          ? "bg-purple-900 text-purple-200 border-purple-800"
                          : tab.label === "Academics"
                            ? "bg-orange-900 text-orange-200 border-orange-800"
                            : tab.label === "Campus Services"
                              ? "bg-teal-900 text-teal-200 border-teal-800"
                              : "bg-gray-800 text-white border-gray-700"
                    : tab.label === "All"
                      ? "bg-transparent text-emerald-400 border-emerald-800 hover:bg-emerald-900/30"
                      : tab.label === "Student Life"
                        ? "bg-transparent text-blue-300 border-blue-800 hover:bg-blue-900/30"
                        : tab.label === "Organization"
                          ? "bg-transparent text-purple-300 border-purple-800 hover:bg-purple-900/30"
                          : tab.label === "Academics"
                            ? "bg-transparent text-orange-300 border-orange-800 hover:bg-orange-900/30"
                            : tab.label === "Campus Services"
                              ? "bg-transparent text-teal-300 border-teal-800 hover:bg-teal-900/30"
                              : "bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800/30"
                : category === tab.value
                  ? tab.label === "All"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : tab.label === "Student Life"
                      ? "bg-blue-500 text-white border-blue-500"
                      : tab.label === "Organization"
                        ? "bg-purple-500 text-white border-purple-500"
                        : tab.label === "Academics"
                          ? "bg-orange-500 text-white border-orange-500"
                          : tab.label === "Campus Services"
                            ? "bg-teal-500 text-white border-teal-500"
                            : "bg-emerald-500 text-white border-emerald-500"
                  : tab.label === "All"
                    ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    : tab.label === "Student Life"
                      ? "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                      : tab.label === "Organization"
                        ? "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
                        : tab.label === "Academics"
                          ? "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                          : tab.label === "Campus Services"
                            ? "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                            : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${
            theme === "dark" ? "text-emerald-500" : "text-teal-500"
          }`} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Category Filter Tabs */}
        <div className="mb-5 flex gap-2 flex-wrap">
          {categoryTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`px-5 py-2 rounded-full font-semibold shadow-sm border-2 transition
                ${theme === "dark"
                  ? category === tab.value
                    ? tab.label === "All"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : tab.label === "Student Life"
                        ? "bg-blue-900 text-blue-200 border-blue-800"
                        : tab.label === "Organization"
                          ? "bg-purple-900 text-purple-200 border-purple-800"
                          : tab.label === "Academics"
                            ? "bg-orange-900 text-orange-200 border-orange-800"
                            : tab.label === "Campus Services"
                              ? "bg-teal-900 text-teal-200 border-teal-800"
                              : "bg-gray-800 text-white border-gray-700"
                    : tab.label === "All"
                      ? "bg-transparent text-emerald-400 border-emerald-800 hover:bg-emerald-900/30"
                      : tab.label === "Student Life"
                        ? "bg-transparent text-blue-300 border-blue-800 hover:bg-blue-900/30"
                        : tab.label === "Organization"
                          ? "bg-transparent text-purple-300 border-purple-800 hover:bg-purple-900/30"
                          : tab.label === "Academics"
                            ? "bg-transparent text-orange-300 border-orange-800 hover:bg-orange-900/30"
                            : tab.label === "Campus Services"
                              ? "bg-transparent text-teal-300 border-teal-800 hover:bg-teal-900/30"
                              : "bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800/30"
                  : category === tab.value
                    ? tab.label === "All"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : tab.label === "Student Life"
                        ? "bg-blue-500 text-white border-blue-500"
                        : tab.label === "Organization"
                          ? "bg-purple-500 text-white border-purple-500"
                          : tab.label === "Academics"
                            ? "bg-orange-500 text-white border-orange-500"
                            : tab.label === "Campus Services"
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-emerald-500 text-white border-emerald-500"
                    : tab.label === "All"
                      ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      : tab.label === "Student Life"
                        ? "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                        : tab.label === "Organization"
                          ? "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
                          : tab.label === "Academics"
                            ? "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                            : tab.label === "Campus Services"
                              ? "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                              : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={`text-center py-10 rounded-2xl mt-4 ${
          theme === "dark" ? "bg-gray-800/60" : "bg-gray-50"
        }`}>
          <p className="text-base opacity-70">
            Something went wrong. Please try again later.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Category Filter Tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {categoryTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={`px-5 py-2 rounded-full font-semibold shadow-sm border-2 transition
              ${theme === "dark"
                ? category === tab.value
                  ? tab.label === "All"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : tab.label === "Student Life"
                      ? "bg-blue-900 text-blue-200 border-blue-800"
                      : tab.label === "Organization"
                        ? "bg-purple-900 text-purple-200 border-purple-800"
                        : tab.label === "Academics"
                          ? "bg-orange-900 text-orange-200 border-orange-800"
                          : tab.label === "Campus Services"
                            ? "bg-teal-900 text-teal-200 border-teal-800"
                            : "bg-gray-800 text-white border-gray-700"
                  : tab.label === "All"
                    ? "bg-transparent text-emerald-400 border-emerald-800 hover:bg-emerald-900/30"
                    : tab.label === "Student Life"
                      ? "bg-transparent text-blue-300 border-blue-800 hover:bg-blue-900/30"
                      : tab.label === "Organization"
                        ? "bg-transparent text-purple-300 border-purple-800 hover:bg-purple-900/30"
                        : tab.label === "Academics"
                          ? "bg-transparent text-orange-300 border-orange-800 hover:bg-orange-900/30"
                          : tab.label === "Campus Services"
                            ? "bg-transparent text-teal-300 border-teal-800 hover:bg-teal-900/30"
                            : "bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800/30"
                : category === tab.value
                  ? tab.label === "All"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : tab.label === "Student Life"
                      ? "bg-blue-500 text-white border-blue-500"
                      : tab.label === "Organization"
                        ? "bg-purple-500 text-white border-purple-500"
                        : tab.label === "Academics"
                          ? "bg-orange-500 text-white border-orange-500"
                          : tab.label === "Campus Services"
                            ? "bg-teal-500 text-white border-teal-500"
                            : "bg-emerald-500 text-white border-emerald-500"
                  : tab.label === "All"
                    ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    : tab.label === "Student Life"
                      ? "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                      : tab.label === "Organization"
                        ? "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
                        : tab.label === "Academics"
                          ? "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                          : tab.label === "Campus Services"
                            ? "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                            : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {(!data || !data.length) ? (
        <div className={`text-center py-10 rounded-2xl mt-4 ${
          theme === "dark" ? "bg-gray-800/60" : "bg-gray-50"
        }`}>
          <p className="text-base opacity-70">
            No posts available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((post, index) => (
            <div key={post.id ? `${post.id}-${post.createdAt}` : index}>
              {post.post_type === 'recommended' && (
                <div className={`mb-2 px-4 py-2 rounded-lg ${
                  theme === "dark" 
                    ? "bg-blue-900/30 text-blue-300 border border-blue-800" 
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  <p className="text-sm font-medium">
                    {post.city && post.city === currentUser?.city 
                      ? "From your city" 
                      : post.category && userInterests?.includes(post.category)
                        ? `Matches your interest in ${post.category}`
                        : "Recommended for you"}
                  </p>
                </div>
              )}
              <Post post={post} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Posts;





