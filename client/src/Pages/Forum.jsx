import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { XCircle, Trash2, Image as ImageIcon, Maximize2, Edit2, Plus, MessageCircle, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';

const BASE_URL = "https://gordon-connect.vercel.app";

const Forum = () => {
  const { theme } = useTheme();
  const { currentUser, canComment } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";

  const [forums, setForums] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newForum, setNewForum] = useState({ title: "", description: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState("");
  const [expandedForums, setExpandedForums] = useState({});
  const [deletingForum, setDeletingForum] = useState(null);
  const [pendingDeleteForum, setPendingDeleteForum] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const queryClient = useQueryClient();

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      let imageUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        const uploadRes = await makeRequest.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = "/upload/" + uploadRes.data;
      }
      const forumData = {
        title: newForum.title,
        description: newForum.description,
        image: imageUrl,
      };
      await makeRequest.post("/forums", forumData);
      fetchForums();
      setNewForum({ title: "", description: "" });
      setSelectedImage(null);
      setImagePreview(null);
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
      toast.success("Forum deleted successfully");
      // Update the forums list by filtering out the deleted forum
      setForums((prev) => prev.filter((forum) => forum.forum_id !== forum_id));
    } catch (err) {
      console.error("Failed to delete forum:", err);
      toast.error(err.response?.data || "Failed to delete forum");
    } finally {
      setDeletingForum(null);
    }
  };

  const handleDeleteComment = async (forum_id, comment_id) => {
    try {
      await makeRequest.delete(`/forums/${forum_id}/comments/${comment_id}`);
      fetchForums();
    } catch (error) {
      setError("Failed to delete comment. Please try again.");
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
    <div className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" : "bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900"} transition-colors`}>
      <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-100"
                }`}>
                  <MessageCircle size={28} className={
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                  } />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                    Community Hub
                  </h1>
                  <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Create engaging discussions and foster community interaction
                  </p>
                </div>
              </div>
              
              {currentUser && currentUser.role !== "guest" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-full font-medium shadow-md transition-all duration-200 whitespace-nowrap"
                >
                  <Plus size={20} />
                  Create New Discussion
                </motion.button>
              )}
            </div>
            
            {/* Forum Guidelines */}
            <div className={`mt-6 p-4 rounded-xl text-sm ${
              theme === "dark" ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-700"
            }`}>
              <p className="flex items-center gap-2">
                <MessageCircle size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                <span>Share your thoughts, ask questions, and connect with other community members.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Toast */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 rounded-xl bg-red-100/90 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-lg backdrop-blur-sm border border-red-200 dark:border-red-800/50 flex items-center gap-3"
          >
            <XCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Create New Discussion Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl p-6 sm:p-8 ${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              } shadow-2xl border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>Create New Discussion</h2>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Share your thoughts with the community</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    theme === "dark" 
                      ? "text-gray-400 hover:text-white hover:bg-gray-800" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <XCircle size={24} strokeWidth={2.5} />
                </motion.button>
              </div>

              <form className="space-y-6" onSubmit={handleCreate}>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>Title</label>
                  <input
                    type="text"
                    placeholder="Enter discussion title"
                    value={newForum.title}
                    onChange={(e) => setNewForum({ ...newForum, title: e.target.value })}
                    className={`w-full p-3 rounded-xl outline-none transition-all duration-200 ${
                      theme === "dark" 
                        ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-2 focus:ring-teal-500" 
                        : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100 focus:ring-2 focus:ring-emerald-400"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>Content</label>
                  <textarea
                    placeholder="Write your discussion content..."
                    value={newForum.description}
                    onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                    className={`w-full p-3 rounded-xl outline-none resize-none transition-all duration-200 ${
                      theme === "dark" 
                        ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-2 focus:ring-teal-500" 
                        : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100 focus:ring-2 focus:ring-emerald-400"
                    }`}
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Add Image <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="forum-image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="forum-image"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                        theme === "dark" 
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ImageIcon size={20} />
                      <span>Choose Image</span>
                    </label>
                    {imagePreview && (
                      <div className="relative w-24 h-24">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-lg"
                        >
                          <XCircle size={20} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>Maximum file size: 5MB. Supported formats: JPG, PNG, GIF</p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      theme === "dark" 
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600"
                        : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
                    } flex items-center gap-2`}
                  >
                    <Plus size={20} />
                    Create Discussion
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Forum Posts */}
        <div className="space-y-8">
          <AnimatePresence>
            {forums.length ? forums.map((forum) => (
              <motion.div
                key={forum.forum_id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ 
                  opacity: deletingForum === forum.forum_id ? 0 : 1,
                  y: deletingForum === forum.forum_id ? -20 : 0,
                  scale: deletingForum === forum.forum_id ? 0.9 : 1
                }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`group rounded-2xl overflow-hidden transition-all duration-300 ${
                  theme === "dark" 
                    ? "bg-gray-800/40 hover:bg-gray-800/60 backdrop-blur-md border border-gray-700/50" 
                    : "bg-white hover:bg-gray-50/80 shadow-lg border border-gray-100"
                } ${deletingForum === forum.forum_id ? "pointer-events-none" : ""}`}
              >
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-full ${
                          theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
                        }`}>
                          <User size={20} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-500 dark:text-teal-400">
                            {forum.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(forum.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <motion.h2
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-2xl font-bold mb-3 cursor-pointer group-hover:text-emerald-500 dark:group-hover:text-teal-400 transition-colors"
                        onClick={() => toggleForumExpansion(forum.forum_id)}
                      >
                        {forum.title}
                      </motion.h2>
                    </div>
                    {/* Show delete button for forum owner or admin */}
                    {(currentUser?.id === forum.user_id || isAdmin) && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPendingDeleteForum(forum.forum_id)}
                        className={`absolute top-4 right-4 p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all`}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </div>

                  {expandedForums[forum.forum_id] && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="overflow-hidden"
                      >
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                          className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
                        >
                          {forum.description}
                        </motion.p>
                        
                        {forum.image && (
                          <div 
                            className="relative h-64 sm:h-80 group cursor-pointer mb-8 rounded-xl overflow-hidden"
                            onClick={() => { 
                              setPreviewImage(forum.image.startsWith("http") ? forum.image : `${BASE_URL}${forum.image}`); 
                              setShowImagePreview(true); 
                            }}
                          >
                            <img
                              src={forum.image.startsWith("http") ? forum.image : `${BASE_URL}${forum.image}`}
                              alt="Forum post"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                              <div className="flex items-center gap-2 text-white">
                                <Maximize2 size={20} />
                                <span className="text-sm font-medium">Click to enlarge</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Comments Section */}
                        <div className={`space-y-6 mt-8 pt-8 border-t ${theme === "dark" ? "border-gray-700/50" : "border-gray-200"}`}>
                          <div className="flex items-center gap-2 mb-6">
                            <MessageCircle size={20} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                            <h3 className="text-lg font-semibold">
                              {forum.comments?.length || 0} {forum.comments?.length <= 1 ? "comment" : "comments"}
                            </h3>
                          </div>

                          <AnimatePresence initial={false}>
                            {forum.comments?.map((comment) => (
                              <motion.div
                                key={comment.comment_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`relative pl-6 border-l-4 rounded-r-xl py-4 px-6 ${
                                  theme === "dark" 
                                    ? "bg-gray-700/30 text-gray-300 border-teal-500" 
                                    : "bg-gray-50 text-gray-800 border-emerald-400"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${
                                      theme === "dark" ? "bg-gray-600/50" : "bg-gray-200"
                                    }`}>
                                      <User size={16} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                                    </div>
                                    <div>
                                      <p className={`text-sm font-medium ${theme === "dark" ? "text-teal-400" : "text-emerald-500"}`}>
                                        {comment.username}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Update delete button to show for comment owner or admin */}
                                  {(currentUser?.id === comment.user_id || isAdmin) && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDeleteComment(forum.forum_id, comment.comment_id)}
                                      className="text-red-500 hover:text-red-700 transition-colors text-xs font-semibold flex items-center gap-1"
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </motion.button>
                                  )}
                                </div>
                                <p className="mt-3 text-base">{comment.comment}</p>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Enhanced Comment Input */}
                          <div className="mt-8">
                            <textarea
                              placeholder={canComment ? "Share your thoughts..." : "Please sign in to comment"}
                              value={newComment[forum.forum_id] || ""}
                              onChange={(e) => setNewComment((prev) => ({ ...prev, [forum.forum_id]: e.target.value }))}
                              disabled={!canComment}
                              className={`w-full p-4 rounded-xl border focus:ring-2 transition-all duration-200 ${
                                theme === "dark" 
                                  ? "bg-gray-700/30 border-gray-600 text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500" 
                                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-emerald-400 focus:border-emerald-400"
                              } ${!canComment ? "opacity-50 cursor-not-allowed" : ""} shadow-inner`}
                              rows={3}
                            />
                            <div className="flex justify-end mt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCommentSubmit(forum.forum_id)}
                                disabled={!newComment[forum.forum_id]?.trim() || !canComment}
                                className={`px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 ${
                                  theme === "dark"
                                    ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600"
                                    : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
                                } transition-all shadow-lg ${!canComment ? "opacity-50 cursor-not-allowed" : ""}`}
                                title={!canComment ? "Please sign in to comment" : ""}
                              >
                                <MessageCircle size={18} />
                                Post Comment
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className={`px-6 py-4 flex items-center justify-between transition-colors ${
                  theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"
                }`}>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle size={16} />
                    <span>{forum.comments?.length || 0} {forum.comments?.length <= 1 ? "comment" : "comments"}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleForumExpansion(forum.forum_id)}
                    className={`flex items-center gap-2 text-sm font-medium transition ${
                      theme === "dark" ? "text-teal-400" : "text-emerald-600"
                    }`}
                  >
                    {expandedForums[forum.forum_id] ? (
                      <>
                        <span>Hide details</span>
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        <span>View details</span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 px-4"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                }`}>
                  <MessageCircle size={32} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                </div>
                <h2 className="text-2xl font-bold mb-4">No discussions yet</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {currentUser && currentUser.role !== "guest"
                    ? "Be the first to start a conversation in our community" 
                    : "Check back later for new discussions"}
                </p>
                {currentUser && currentUser.role !== "guest" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(true)}
                    className={`px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600"
                        : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
                    } transition-all shadow-lg`}
                  >
                    <Plus size={20} />
                    Create First Discussion
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Delete Confirmation Modal */}
        {pendingDeleteForum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-full ${
                  theme === "dark" ? "bg-red-900/30" : "bg-red-100"
                }`}>
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Discussion</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <p className="mb-8 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this discussion? All comments will be permanently removed.
              </p>
              <div className="flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPendingDeleteForum(null)}
                  className={`px-6 py-2.5 rounded-xl font-medium transition ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleDelete(pendingDeleteForum);
                    setPendingDeleteForum(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-medium flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Discussion
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Image Preview Modal */}
        <AnimatePresence>
          {showImagePreview && previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
              onClick={() => setShowImagePreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10"
                >
                  <XCircle size={32} strokeWidth={2.5} />
                </button>
                <div className="max-w-[90vw] max-h-[90vh] overflow-auto flex items-center justify-center">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    style={{ display: 'block' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Forum;






















