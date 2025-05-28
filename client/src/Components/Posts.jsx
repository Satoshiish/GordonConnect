import React, { useState, useContext, useEffect, useRef } from "react";
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

  const { isPending, error, data, refetch } = useQuery({
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
        
        console.log("Fetching posts with URL:", url);
        const res = await makeRequest.get(url, config);
        return res.data || [];
      } catch (error) {
        console.error("Error fetching posts:", error);
        console.error("Error details:", error.response?.data || "No additional details");
        
        // Show more detailed error in console for debugging
        if (error.response?.data) {
          console.error("Server error:", error.response.data);
        }
        
        // Throw the error to trigger the error UI
        throw error;
      }
    },
    enabled: userId !== undefined,
    retry: 2,
    retryDelay: 1000,
  });

  if (isPending) {
    return (
      <>
        {/* Category Filter Tabs with Legend */}
        <div className="mb-5">
          {/* Category Legend */}
          <div className={`mb-3 p-3 rounded-lg flex flex-wrap gap-3 items-center ${
            theme === "dark" ? "bg-gray-800/70 border border-gray-700" : "bg-gray-50 border border-gray-200"
          }`}>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Categories:
            </span>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-emerald-600" : "bg-emerald-500"}`}></div>
                <span className="text-xs">All</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-blue-900" : "bg-blue-500"}`}></div>
                <span className="text-xs">Student Life</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-purple-900" : "bg-purple-500"}`}></div>
                <span className="text-xs">Organization</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-orange-900" : "bg-orange-500"}`}></div>
                <span className="text-xs">Academics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-teal-900" : "bg-teal-500"}`}></div>
                <span className="text-xs">Campus Services</span>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
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
                      : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-gray-100"
                    : category === tab.value
                      ? tab.label === "All"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : tab.label === "Student Life"
                          ? "bg-blue-500 text-white border-blue-500"
                          : tab.label === "Organization"
                            ? "bg-purple-500 text-white border-purple-500"
                            : tab.label === "Academics"
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`flex justify-center items-center py-20 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="font-medium">Loading posts...</span>
        </div>
      </>
    );
  }

  if (error) {
    console.error("Query error state:", error);
    return (
      <>
        {/* Category tabs component */}
        <div className="mb-5">
          {/* Category Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
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
                      : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-gray-100"
                    : category === tab.value
                      ? tab.label === "All"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : tab.label === "Student Life"
                          ? "bg-blue-500 text-white border-blue-500"
                          : tab.label === "Organization"
                            ? "bg-purple-500 text-white border-purple-500"
                            : tab.label === "Academics"
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`text-center py-10 rounded-xl ${theme === "dark" ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-500"}`}>
          <p className="font-medium">Failed to load posts</p>
          <p className="text-sm mt-1 opacity-80">
            {error.response?.data?.message || error.message || "An unknown error occurred"}
          </p>
          <button 
            onClick={() => refetch()} 
            className={`mt-3 px-4 py-2 rounded-lg ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Category Filter Tabs with Legend */}
      <div className="mb-5">
        {/* Category Legend */}
        <div className={`mb-3 p-3 rounded-lg flex flex-wrap gap-3 items-center ${
          theme === "dark" ? "bg-gray-800/70 border border-gray-700" : "bg-gray-50 border border-gray-200"
        }`}>
          <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            Categories:
          </span>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-emerald-600" : "bg-emerald-500"}`}></div>
              <span className="text-xs">All</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-blue-900" : "bg-blue-500"}`}></div>
              <span className="text-xs">Student Life</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-purple-900" : "bg-purple-500"}`}></div>
              <span className="text-xs">Organization</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-orange-900" : "bg-orange-500"}`}></div>
              <span className="text-xs">Academics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme === "dark" ? "bg-teal-900" : "bg-teal-500"}`}></div>
              <span className="text-xs">Campus Services</span>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
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
                    : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-gray-100"
                  : category === tab.value
                    ? tab.label === "All"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : tab.label === "Student Life"
                        ? "bg-blue-500 text-white border-blue-500"
                        : tab.label === "Organization"
                          ? "bg-purple-500 text-white border-purple-500"
                          : tab.label === "Academics"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-teal-500 text-white border-teal-500"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
            >
              {tab.label}
            </button>
          ))}
        </div>
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











