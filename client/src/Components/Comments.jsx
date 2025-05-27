import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../authContext";
import { useTheme } from "../ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

const Comments = ({ postId }) => {
  const { currentUser, canComment } = useContext(AuthContext);
  const { theme } = useTheme();
  const [desc, setDesc] = useState("");

  const queryClient = useQueryClient();

  // ✅ Debugging: Log postId before fetching
  useEffect(() => {
    console.log("Fetching comments for postId:", postId);
  }, [postId]);

  // ✅ Fetch comments
  const { data, isPending, error } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!postId) {
        console.error("Error: postId is missing!");
        return [];
      }
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/comments?postId=${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Received comments from API:", res.data);
      return res.data;
    },
    enabled: !!postId,
  });

  // ✅ Add new comment
  const mutation = useMutation({
    mutationFn: async (newComment) => {
      const token = localStorage.getItem("token");
      return makeRequest.post("/comments", newComment, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setDesc(""); // Clear input after successful submission
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      const token = localStorage.getItem("token");
      return makeRequest.delete(`/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const handleClick = async (e) => {
    e.preventDefault();

    if (!desc.trim()) {
      console.error("Error: Comment cannot be empty!");
      return;
    }

    if (!postId) {
      console.error("Error: postId is missing!");
      return;
    }

    if (!canComment) {
      console.error("Error: Guest users cannot comment!");
      return;
    }

    console.log("Submitting comment with postId:", postId);
    mutation.mutate({ desc, postId });
    setDesc("");
  };

  return (
    <div
      className={`shadow-md rounded-lg p-5 transition-all duration-300 ease-in-out
        ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }
      `}
    >
      {/* Comment Input */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={currentUser.profilePic ? 
            (currentUser.profilePic.startsWith('http') ? 
              currentUser.profilePic : 
              currentUser.profilePic.startsWith('/upload/') ?
                currentUser.profilePic :
                `/upload/${currentUser.profilePic}`) 
            : "/default-profile.jpg"}
          alt="User Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <input
          type="text"
          placeholder={canComment ? "Write a comment..." : "Please sign in to comment"}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={!canComment || mutation.isPending}
          className={`w-full p-2 rounded-md outline-none transition
            ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-900"
            }
            ${!canComment ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        <button
          onClick={handleClick}
          disabled={!canComment || mutation.isPending}
          className={`px-3 py-1.5 rounded-lg transition-colors
            ${canComment 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {mutation.isPending ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-2 space-y-4">
        {error ? (
          <p className="text-red-500 text-sm">
            Something went wrong! Please try again.
          </p>
        ) : isPending ? (
          <p className="text-gray-500 text-sm">Loading comments...</p>
        ) : data?.length > 0 ? (
          <AnimatePresence initial={false}>
            {data.map((comment) => (
              <motion.div
                key={comment.comments_id}
                initial={{ opacity: 0, scale: 0.95, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 40 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 p-3 rounded-lg shadow-sm
                  ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"}
                `}
              >
                <img
                  src={"/upload/" + comment.profilePic}
                  alt="User Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{comment.name}</span>
                    {(currentUser?.userId === comment.userId || currentUser?.role === "admin") && (
                      <button
                        onClick={() => deleteMutation.mutate(comment.comments_id)}
                        className="ml-2 text-red-500 hover:text-red-700 transition-colors text-xs font-semibold"
                        title="Delete comment"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs block mb-1">{moment(comment.createdAt).fromNow()}</span>
                  <p className="text-sm">{comment.desc}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className="text-gray-500 text-sm">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
};

export default Comments;
