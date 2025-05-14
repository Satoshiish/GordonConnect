import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { XCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Forum = () => {
  const { theme } = useTheme();
  const { currentUser, canComment } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";

  const [forums, setForums] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newForum, setNewForum] = useState({ title: "", description: "" });
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState("");
  const [expandedForums, setExpandedForums] = useState({});
  const [deletingForum, setDeletingForum] = useState(null);
  const [pendingDeleteForum, setPendingDeleteForum] = useState(null);

  const fetchForums = async () => {
    try {
      const res = await makeRequest.get("/forums");
      const sortedForums = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setForums(sortedForums);
    } catch (err) {
      console.error("Failed to fetch forums", err);
      setError("Failed to fetch forums. Please try again.");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await makeRequest.post("/forums", newForum);
      fetchForums();
      setNewForum({ title: "", description: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create forum:", error);
      setError("Failed to create forum. Please try again.");
    }
  };

  const handleCommentSubmit = async (forum_id) => {
    if (!newComment[forum_id]?.trim()) return;
    if (!canComment) {
      setError("Please sign in to comment");
      return;
    }
    try {
      await makeRequest.post(`/forums/${forum_id}/comments`, { comment: newComment[forum_id] });
      setNewComment((prev) => ({ ...prev, [forum_id]: "" }));
      fetchForums();
    } catch (error) {
      console.error("Failed to post comment:", error);
      setError("Failed to post comment. Please try again.");
    }
  };

  const handleDelete = async (forum_id) => {
    setDeletingForum(forum_id);
    try {
      await makeRequest.delete(`/forums/${forum_id}`);
      setTimeout(() => {
        setForums((prev) => prev.filter((forum) => forum.forum_id !== forum_id));
        setDeletingForum(null);
      }, 500);
    } catch (err) {
      console.error("Failed to delete forum:", err);
      setError("Failed to delete forum. Please try again.");
      setDeletingForum(null);
    }
  };

  const toggleForumExpansion = (forum_id) => {
    setExpandedForums((prev) => ({
      ...prev,
      [forum_id]: !prev[forum_id],
    }));
  };

  useEffect(() => {
    fetchForums();
  }, [currentUser]);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100" : "bg-gradient-to-b from-gray-50 to-white text-gray-900"} transition-colors`}>
      <div className="max-w-5xl mx-auto p-6">
        
        {/* Header */}
        <div className={`flex justify-between items-center mb-8 p-6 rounded-2xl ${
          theme === "dark" ? "bg-gray-800/40 backdrop-blur-md border border-gray-700/50" : "bg-white shadow-xl border border-gray-100"
        }`}>
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
              Community Discussions
            </h1>
            <p className="text-sm opacity-90">{isAdmin ? "Create and manage discussion topics" : "Join the conversation"}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className={`px-6 py-2.5 rounded-xl font-medium text-white shadow-lg transform hover:scale-105 transition-all duration-300 ${
                theme === "dark" 
                  ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600" 
                  : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
              }`}
            >
              + New Post
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100/80 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-lg backdrop-blur-sm border border-red-200 dark:border-red-800/50">
            {error}
          </div>
        )}

        {/* New Post Modal */}
        {showForm && isAdmin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 px-4 animate-fadeIn">
            <div className={`relative w-full max-w-2xl p-8 rounded-2xl shadow-2xl transform transition-all animate-scaleIn ${
              theme === "dark" ? "bg-gray-800/90 border border-gray-700/50" : "bg-white border border-gray-100"
            }`}>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
              >
                <XCircle size={32} strokeWidth={2.5} />
              </button>
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                Create New Post
              </h2>
              <form className="space-y-6" onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Post Title"
                  value={newForum.title}
                  onChange={(e) => setNewForum({ ...newForum, title: e.target.value })}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-teal-500 bg-gray-50/50 dark:bg-gray-700/30 shadow-inner"
                  required
                />
                <textarea
                  placeholder="Post Content"
                  value={newForum.description}
                  onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-teal-500 bg-gray-50/50 dark:bg-gray-700/30 shadow-inner"
                  rows={5}
                  required
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500 dark:from-teal-500 dark:via-teal-600 dark:to-teal-500 dark:hover:from-teal-600 dark:hover:via-teal-700 dark:hover:to-teal-600 transition-all shadow-lg"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Forum Posts */}
        <div className="space-y-6">
          <AnimatePresence>
            {forums.length ? forums.map((forum) => (
              <motion.div
                key={forum.forum_id}
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={deletingForum === forum.forum_id ? 
                  { opacity: 0, scale: 0.8, y: -20 } : 
                  { opacity: 1, scale: 1, y: 0 }
                }
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  theme === "dark" ? "bg-gray-800/40 backdrop-blur-md border border-gray-700/50" : "bg-white shadow-lg border border-gray-100"
                } ${deletingForum === forum.forum_id ? "pointer-events-none" : ""}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2
                        className="text-xl font-semibold mb-2 cursor-pointer hover:text-emerald-500 dark:hover:text-teal-400 transition-colors"
                        onClick={() => toggleForumExpansion(forum.forum_id)}
                      >
                        {forum.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Posted by <span className="font-medium text-emerald-500 dark:text-teal-400">{forum.username}</span> • {new Date(forum.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPendingDeleteForum(forum.forum_id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                          theme === "dark" 
                            ? "text-red-400 hover:bg-red-900/30 hover:text-red-300" 
                            : "text-red-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Delete</span>
                      </motion.button>
                    )}
                  </div>

                  {expandedForums[forum.forum_id] && (
                    <>
                      <p className="mt-4 mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">{forum.description}</p>

                      {/* Comments */}
                      <div className={`space-y-4 mt-8 pt-8 border-t ${
                        theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                      }`}>
                        <h3 className="text-lg font-semibold mb-4">Comments ({forum.comments?.length || 0})</h3>
                        
                        {forum.comments?.map((comment) => (
                          <div
                            key={comment.comment_id}
                            className={`pl-6 border-l-4 rounded-r-xl py-4 px-6 ${
                              theme === "dark"
                                ? "bg-gray-700/30 text-gray-300 border-teal-500"
                                : "bg-gray-50 text-gray-800 border-emerald-400"
                            }`}
                          >
                            <p className={`text-sm font-medium mb-2 ${
                              theme === "dark" ? "text-teal-400" : "text-emerald-500"
                            }`}>
                              {comment.username}
                            </p>
                            <p className="text-base">{comment.comment}</p>
                          </div>
                        ))}

                        {/* Add Comment */}
                        <div className="mt-6">
                          <textarea
                            placeholder={canComment ? "Add a comment..." : "Please sign in to comment"}
                            value={newComment[forum.forum_id] || ""}
                            onChange={(e) =>
                              setNewComment((prev) => ({ ...prev, [forum.forum_id]: e.target.value }))
                            }
                            disabled={!canComment}
                            className={`w-full p-3 rounded-xl border focus:ring-2 ${
                              theme === "dark"
                                ? "bg-gray-700/30 border-gray-600 text-white focus:ring-teal-500"
                                : "bg-white border-gray-300 text-gray-800 focus:ring-emerald-400"
                            } ${!canComment ? "opacity-50 cursor-not-allowed" : ""} shadow-inner`}
                            rows={3}
                          />
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => handleCommentSubmit(forum.forum_id)}
                              disabled={!newComment[forum.forum_id]?.trim() || !canComment}
                              className={`px-6 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500 dark:from-teal-500 dark:via-teal-600 dark:to-teal-500 dark:hover:from-teal-600 dark:hover:via-teal-700 dark:hover:to-teal-600 transition-all shadow-lg ${
                                !canComment ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title={!canComment ? "Please sign in to comment" : ""}
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className={`px-6 py-4 text-right transition-colors ${
                  theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"
                }`}>
                  <button
                    onClick={() => toggleForumExpansion(forum.forum_id)}
                    className={`text-sm font-medium hover:underline transition ${
                      theme === "dark" ? "text-teal-400" : "text-emerald-600"
                    }`}
                  >
                    {expandedForums[forum.forum_id] ? "Hide details" : "View details"}
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20">
                <p className="text-2xl font-medium mb-4">No posts yet</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500 dark:from-teal-500 dark:via-teal-600 dark:to-teal-500 dark:hover:from-teal-600 dark:hover:via-teal-700 dark:hover:to-teal-600 transition-all shadow-lg"
                  >
                    Create the first post
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {pendingDeleteForum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-sm w-full border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">Delete Forum</h2>
              <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to delete this forum? This action cannot be undone.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setPendingDeleteForum(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(pendingDeleteForum);
                    setPendingDeleteForum(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;