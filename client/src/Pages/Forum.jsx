import React, { useContext, useState } from "react";
import { useTheme } from "../ThemeContext";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { XCircle, Trash2, Image as ImageIcon, Maximize2, Edit2, Plus, MessageCircle, Clock, User, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { Link } from "react-router-dom";

const BASE_URL = "https://gordon-connect.vercel.app";

const Forum = () => {
  const { theme } = useTheme();
  const { currentUser, canComment } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [newForum, setNewForum] = useState({ title: "", description: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [expandedForums, setExpandedForums] = useState({});
  const [pendingDeleteForum, setPendingDeleteForum] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch forums using React Query
  const { data: forums = [], isLoading, error } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const res = await makeRequest.get("/forums");
      console.log("Forums response:", res.data);
      
      if (!Array.isArray(res.data)) {
        console.error("Invalid forum data format:", res.data);
        return [];
      }
      
      // Sort forums by createdAt (newest first)
      return [...res.data].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    },
    staleTime: 60000, // 1 minute
    retry: 1
  });

  // Create forum mutation
  const createForumMutation = useMutation({
    mutationFn: async (forumData) => {
      const res = await makeRequest.post("/forums", forumData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch forums query
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      
      // Reset form
      setNewForum({ title: "", description: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      
      toast.success("Discussion created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create forum:", error);
      toast.error("Failed to create discussion. Please try again.");
    }
  });

  // Delete forum mutation
  const deleteForumMutation = useMutation({
    mutationFn: async (forum_id) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to delete a discussion");
      }
      
      const res = await makeRequest.delete(`/forums/${forum_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch forums query
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      toast.success("Discussion deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete forum:", error);
      toast.error(error.response?.data || "Failed to delete forum");
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ forum_id, comment }) => {
      const res = await makeRequest.post(`/forums/${forum_id}/comments`, { comment });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch forums query
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
    onError: (error) => {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment. Please try again.");
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ forum_id, comment_id }) => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to delete a comment");
      }
      
      const res = await makeRequest.delete(`/forums/${forum_id}/comments/${comment_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch forums query
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete comment:", error);
      toast.error(error.response?.data || "Failed to delete comment");
    }
  });

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
      
      createForumMutation.mutate(forumData);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const handleCommentSubmit = (forum_id) => {
    if (!newComment[forum_id]?.trim()) return;
    if (!canComment) {
      toast.error("Please sign in to comment");
      return;
    }
    
    addCommentMutation.mutate({ 
      forum_id, 
      comment: newComment[forum_id] 
    });
    
    // Clear the comment input
    setNewComment((prev) => ({ ...prev, [forum_id]: "" }));
  };

  const handleDelete = (forum_id) => {
    if (!confirm("Are you sure you want to delete this discussion?")) {
      return;
    }
    
    deleteForumMutation.mutate(forum_id);
  };

  const handleDeleteComment = (forum_id, comment_id) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    deleteCommentMutation.mutate({ forum_id, comment_id });
  };

  const toggleForumExpansion = (forum_id) => {
    setExpandedForums((prev) => ({
      ...prev,
      [forum_id]: !prev[forum_id],
    }));
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" : "bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900"} transition-colors`}>
      <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
        {/* Header Card */}
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
          </div>
        </motion.div>

        {/* Forum Posts */}
        <div className="space-y-8">
          <AnimatePresence>
            {isLoading ? (
              <div className="text-center py-16">
                <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
                <p className="text-gray-500">Loading discussions...</p>
              </div>
            ) : forums.length ? forums.map((forum) => {
              // Check if current user can delete this forum
              const canDelete = isAdmin || (currentUser && currentUser.user_id === forum.user_id);
              
              return (
                <motion.div
                  key={forum.forum_id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ 
                    opacity: deleteForumMutation.isPending && deleteForumMutation.variables === forum.forum_id ? 0 : 1,
                    y: deleteForumMutation.isPending && deleteForumMutation.variables === forum.forum_id ? -20 : 0,
                    scale: deleteForumMutation.isPending && deleteForumMutation.variables === forum.forum_id ? 0.9 : 1
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
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(forum.forum_id)}
                          disabled={deleteForumMutation.isPending}
                          className={`p-2 rounded-full transition-colors ${
                            theme === "dark" 
                              ? "hover:bg-red-900/30 text-red-400" 
                              : "hover:bg-red-100 text-red-500"
                          } ${deleteForumMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Delete discussion"
                        >
                          {deleteForumMutation.isPending && deleteForumMutation.variables === forum.forum_id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2">{forum.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{forum.description}</p>
                    
                    {/* Show forum image if available */}
                    {forum.image && (
                      <div className="mt-4 relative">
                        <img 
                          src={`${BASE_URL}${forum.image}`} 
                          alt={forum.title}
                          className="w-full h-auto rounded-xl object-cover max-h-96"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                          }}
                        />
                      </div>
                    )}
                    
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
                  
                  {/* Comments section */}
                  {expandedForums[forum.forum_id] && (
                    <div className={`p-6 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                      <h3 className="font-bold mb-4">Comments</h3>
                      
                      {/* Comment list */}
                      <div className="space-y-4 mb-6">
                        {forum.comments && forum.comments.length > 0 ? (
                          forum.comments.map((comment) => {
                            // Check if current user can delete this comment
                            const canDeleteComment = isAdmin || (currentUser && currentUser.user_id === comment.user_id);
                            
                            return (
                              <div 
                                key={comment.comment_id} 
                                className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-1.5 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"}`}>
                                      <User size={16} className={theme === "dark" ? "text-teal-400" : "text-emerald-500"} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-teal-400" : "text-emerald-500"}`}>
                                          {comment.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                          <Clock size={12} />
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-sm">{comment.comment}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Show delete button if user is admin or comment owner */}
                                  {canDeleteComment && (
                                    <button
                                      onClick={() => handleDeleteComment(forum.forum_id, comment.comment_id)}
                                      disabled={deleteCommentMutation.isPending}
                                      className={`p-2 rounded-full transition-colors ${
                                        theme === "dark" 
                                          ? "hover:bg-red-900/30 text-red-400" 
                                          : "hover:bg-red-100 text-red-500"
                                      } ${deleteCommentMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Delete comment"
                                    >
                                      {deleteCommentMutation.isPending && deleteCommentMutation.variables?.comment_id === comment.comment_id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={18} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                        )}
                      </div>
                      
                      {/* Comment input */}
                      <div className="mt-6">
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
                  )}
                </motion.div>
              );
            }) : (
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



























