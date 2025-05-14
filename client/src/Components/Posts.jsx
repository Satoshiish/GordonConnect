import React, { useState } from "react";
import Post from "./Post";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { Loader2 } from "lucide-react";

const Posts = ({ userId = null }) => {  
  const { theme } = useTheme();
  const categoryTabs = [
    { label: "All", value: "" },
    { label: "Student Life", value: "Student Life" },
    { label: "Clubs & Orgs", value: "Clubs & Orgs" },
    { label: "Academics", value: "Academics" },
  ];
  const [category, setCategory] = useState("");
  const { isPending, error, data } = useQuery({
    queryKey: userId ? ["posts", userId, category] : ["posts", category],
    queryFn: async () => {
      const token = localStorage.getItem("token");  
      let url = userId ? `/posts?userId=${userId}` : "/posts";
      if (category) url += (url.includes("?") ? "&" : "?") + `category=${encodeURIComponent(category)}`;
      const res = await makeRequest.get(url, {  
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: userId !== undefined,
  });

   if (isPending) {
    return (
      <>
        {/* Category Filter Tabs */}
        <div className="mb-6 flex gap-3">
          {categoryTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`px-4 py-2 rounded-full font-semibold transition
                ${category === tab.value
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 underline"
                  : "bg-gray-100 text-gray-700"
                }`}
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
        <div className="mb-6 flex gap-3">
          {categoryTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`px-4 py-2 rounded-full font-semibold transition
                ${category === tab.value
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 underline"
                  : "bg-gray-100 text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={`text-center py-12 rounded-xl ${
          theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
        }`}>
          <p className="text-sm opacity-70">
            Something went wrong. Please try again later.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Category Filter Tabs */}
      <div className="mb-6 flex gap-3">
        {categoryTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={`px-4 py-2 rounded-full font-semibold transition
              ${category === tab.value
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 underline"
                : "bg-gray-100 text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {(!data || !data.length) ? (
        <div className={`text-center py-12 rounded-xl ${
          theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
        }`}>
          <p className="text-sm opacity-70">
            No posts available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((post, index) => (
            <div key={post.id ? `${post.id}-${post.createdAt}` : index}>
              {post.post_type === 'recommended' && (
                <div className={`mb-2 px-4 py-2 rounded-lg ${
                  theme === "dark" 
                    ? "bg-blue-900/30 text-blue-300 border border-blue-800" 
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  <p className="text-sm font-medium">
                    Recommended for you
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
