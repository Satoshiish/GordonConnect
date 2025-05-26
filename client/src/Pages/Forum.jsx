import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../ThemeContext";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { XCircle, Trash2, Image as ImageIcon, Maximize2, Edit2, Plus, MessageCircle, Clock, User, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();

  const fetchForums = async () => {
    setIsLoading(true);
    try {
      const res = await makeRequest.get("/forums");
      console.log("Forums response:", res.data);
      
      // Ensure forums are sorted by createdAt (newest first)
      const sortedForums = Array.isArray(res.data) 
        ? [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      
      setForums(sortedForums);
    } catch (err) {
      console.error("Failed to fetch forums", err);
      toast.error("Failed to load discussions");
      setForums([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to test the forum API
  const testForumApi = async () => {
    try {
      console.log("Testing forum API...");
      const res = await makeRequest.get("/forums/test");
      console.log("Forum API test response:", res.data);
      toast.success("Forum API is working!");
    } catch (err) {
      console.error("Forum API test failed:", err);
      toast.error("Forum API test failed");
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
      
      // After creating a new forum, fetch all forums again
      fetchForums();
      
      // Reset form
      setNewForum({ title: "", description: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      
      toast.success("Discussion created successfully!");
    } catch (error) {
      console.error("Failed to create forum:", error);
      toast.error("Failed to create discussion. Please try again.");
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
    if (!confirm("Are you sure you want to delete this discussion?")) {
      return;
    }
    
    setDeletingForum(forum_id);
    try {
      console.log("Deleting forum with ID:", forum_id);
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to delete a discussion");
        setDeletingForum(null);
        return;
      }
      
      // Send delete request with token
      await makeRequest.delete(`/forums/${forum_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update UI by removing the deleted forum
      setForums(forums.filter(forum => forum.forum_id !== forum_id));
      toast.success("Discussion deleted successfully");
    } catch (err) {
      console.error("Failed to delete forum:", err);
      toast.error(err.response?.data || "Failed to delete discussion");
    } finally {
      setDeletingForum(null);
    }
  };

  const handleDeleteComment = async (forum_id, comment_id) => {
    try {
      const token = localStorage.getItem("token");
      await makeRequest.delete(`/forums/${forum_id}/comments/${comment_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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
    testForumApi(); // Test the API first
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
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
                <p className="text-gray-500">Loading discussions...</p>
              </div>
            ) : forums.length ? forums.map((forum) => (
              <motion.div
                key={forum.forum_id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ 
                  opacity: deletingForum === forum.forum_id ? 0 : 1,
                  y: deletingForum === forum.forum_id ? -20 : 0,
                  scale: deletingForum === forum.forum_id ? 0.9 : 1
                }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl overflow-hidden shadow-lg ${
                  theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                }`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}>
                        <User size={20} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                      </div>
                      <div>
                        <h3 className="font-medium">{forum.username}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock size={12} />
                          <span>{new Date(forum.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show delete button if user is admin or owner of the post */}
                    {(isAdmin || (currentUser && currentUser.user_id === forum.user_id)) && (
                      <button
                        onClick={() => handleDelete(forum.forum_id)}
                        className={`p-2 rounded-full transition-colors ${
                          theme === "dark" 
                            ? "hover:bg-red-900/30 text-red-400" 
                            : "hover:bg-red-100 text-red-500"
                        }`}
                        title="Delete discussion"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">{forum.title}</h2>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={18} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {forum.comments?.length || 0} comments
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleForumExpansion(forum.forum_id)}
                      className={`flex items-center gap-1 text-sm font-medium ${
                        theme === "dark" ? "text-teal-400" : "text-emerald-500"
                      }`}
                    >
                      {expandedForums[forum.forum_id] ? (
                        <>
                          <ChevronUp size={18} />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={18} />
                          <span>Show more</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="mb-4">
                  <MessageCircle size={40} className="mx-auto text-gray-400" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-gray-600 dark:text-gray-300">No discussions yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to start a discussion!</p>
                
                {currentUser && currentUser.role !== "guest" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(true)}
                    className={`px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-teal-500 via-teal-600 to-teal-500 hover:from-teal-600 hover:via-teal-700 hover:to-teal-600"
                        : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500"
                    } transition-all shadow-lg mx-auto`}
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




























