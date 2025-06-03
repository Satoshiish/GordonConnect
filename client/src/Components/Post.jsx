import React, { useContext, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import Comments from "../Components/Comments";
import moment from "moment";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { AuthContext } from "../authContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FavoriteBorderOutlined,
  FavoriteOutlined,
  BookmarkBorderOutlined,
  BookmarkOutlined,
  TextsmsOutlined,
  ShareOutlined,
  MoreHoriz,
} from "@mui/icons-material";
import { toast } from 'react-hot-toast';
import { 
  Image as ImageIcon, 
  XCircle, 
  Heart, 
  HeartOff, 
  Bookmark as BookmarkIcon, 
  BookmarkMinus, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Loader2, 
  Flag, 
  ExternalLink, 
  ChevronDown, 
  AlertTriangle,
  Check,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://gordonconnect-production-f2bd.up.railway.app/api";

// Function to detect and format links in text
const detectLinks = (text, theme) => {
  if (!text) return "No description available.";
  
  // Combined regex for URLs, Facebook links, and email addresses
  const linkRegex = /(?:https?:\/\/[^\s]+|www\.[^\s]+|fb\.com\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  
  // Split the text by the link pattern
  const parts = text.split(linkRegex);
  
  // Find all matches
  const matches = text.match(linkRegex) || [];
  
  // If no links found, return the original text
  if (matches.length === 0) {
    return text;
  }
  
  // Create result array
  const result = [];
  
  // Interleave parts and matches
  for (let i = 0; i < parts.length; i++) {
    // Add text part if it exists
    if (parts[i]) {
      result.push(<span key={`text-${i}`}>{parts[i]}</span>);
    }
    
    // Add link if it exists
    if (matches && i < matches.length) {
      const link = matches[i];
      
      // Determine link type and format accordingly
      const isEmail = link.includes('@') && !link.includes('://') && !link.includes('fb.com/');
      const isFacebookLink = link.toLowerCase().includes('fb.com/');
      
      let href;
      if (isEmail) {
        href = `mailto:${link}`;
      } else if (link.startsWith('http')) {
        href = link;
      } else if (link.startsWith('www.')) {
        href = `https://${link}`;
      } else if (isFacebookLink) {
        href = `https://${link}`;
      } else {
        href = `https://${link}`;
      }
      
      result.push(
        <a 
          key={`link-${i}`}
          href={href}
          target={isEmail ? "_self" : "_blank"}
          rel={isEmail ? "" : "noopener noreferrer"}
          className={`inline-flex items-center gap-1 font-medium underline ${
            isFacebookLink 
              ? (theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500")
              : isEmail
                ? (theme === "dark" ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-500")
                : (theme === "dark" ? "text-emerald-400 hover:text-emerald-300" : "text-teal-600 hover:text-teal-500")
          }`}
        >
          {link}
          {!isEmail && <ExternalLink size={14} />}
        </a>
      );
    }
  }
  
  return result;
};

const Post = ({ post }) => {
  const { theme } = useTheme();
  const [commentOpen, setCommentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const { currentUser, canLike, canComment, canBookmark } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const isGuest = currentUser?.role === "guest";

  const { isPending, data = {} } = useQuery({
    queryKey: ["likes", post.posts_id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/likes?postId=${post.posts_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!post.posts_id,
  });

  const { isPending: bookmarkPending, data: bookmarkData = {} } = useQuery({
    queryKey: ["bookmarks", post.posts_id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/bookmarks?postId=${post.posts_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!post.posts_id,
  });

  const { data: commentData = [] } = useQuery({
    queryKey: ["comments", post.posts_id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/comments?postId=${post.posts_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!post.posts_id,
  });

  const totalLikes = data.totalLikes || 0;
  const isLiked = data.userLiked > 0;
  const isBookmarked = bookmarkData.userBookmarked > 0;
  const commentCount = commentData.length || 0;
  const commentLabel = commentCount === 1 ? "comment" : commentCount === 0 ? "comment" : "comments";

  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      isLiked
        ? await makeRequest.delete(`/likes?postId=${post.posts_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await makeRequest.post(
            "/likes",
            { postId: post.posts_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["likes", post.posts_id]);
      queryClient.refetchQueries(["likes", post.posts_id]);
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      isBookmarked
        ? await makeRequest.delete(`/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { postId: post.posts_id },
          })
        : await makeRequest.post(
            "/bookmarks",
            { postId: post.posts_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
    },
    onSuccess: () =>
      queryClient.invalidateQueries(["bookmarks", post.posts_id]),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      console.log("Deleting post with ID:", post.posts_id);
      console.log("Using token (first 10 chars):", token ? token.substring(0, 10) + "..." : "No token");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      if (!post.posts_id) {
        throw new Error("Post ID is missing");
      }
      
      return await makeRequest.delete(`/posts/${post.posts_id}`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
    },
    onMutate: async () => {
      setIsDeleting(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      setIsDeleting(false);
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      console.error("Error details:", error.response?.data);
      setIsDeleting(false);
      toast.error(error.response?.data || "Failed to delete post");
    }
  });

  // Add state for predefined report reasons
  const [reportReasons] = useState([
    "Contains inaccurate or outdated information",
    "Irrelevant to my program or department",
    "Not clearly explained or confusing",
    "Unprofessional tone or wording",
    "Too many repetitive posts",
    "Announced too late or last-minute",
    "Disrespectful or inconsiderate messaging",
    "Not accessible (e.g., unclear for PWDs or non-English speakers)",
    "Fails to follow official GC communication standards",
    "Triggers anxiety or unnecessary pressure",
    "Unfair to certain groups or students",
    "Violates school values or community standards"
  ]);

  const handleReport = async () => {
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason for reporting.");
      return;
    }
    
    setReportLoading(true);
    try {
      // Join multiple reasons with a separator
      const reasonText = selectedReasons.join(" | ");
      
      await makeRequest.post("/reports", {
        user_id: currentUser?.id || currentUser?.user_id || null,
        post_id: post.posts_id,
        reason: reasonText,
      });
      
      toast.success("Report submitted. Thank you!");
      setShowReportModal(false);
      setSelectedReasons([]);
      setAlreadyReported(true);
    } catch (err) {
      console.error("Report submission error:", err);
      
      if (err.response?.data?.error?.toLowerCase().includes("duplicate")) {
        setAlreadyReported(true);
        toast.error("You have already reported this post.");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  const openReportModal = () => {
    if (alreadyReported) {
      toast.error("You have already reported this post.");
      return;
    }
    setShowReportModal(true);
  };

  // Function to toggle a reason in the selected list
  const toggleReason = (reason) => {
    setSelectedReasons(prev => 
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  return (
    <>
      {post && !post.deleted && (post.visible === undefined || post.visible === 1) ? (
        <motion.div
          initial={{ scale: 0.97, opacity: 1 }}
          animate={isDeleting ? { scale: 0.7, opacity: 0 } : { scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={`rounded-3xl shadow-2xl mb-8 border transition-all duration-300 overflow-hidden
            ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}
        >
          <div className="p-4 sm:p-5 md:p-7">
            {/* User Info */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-2 gap-2">
              <div className="flex gap-3 items-center">
                <img
                  className="h-12 w-12 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
                  src={post.profilePic ? 
                    (post.profilePic.startsWith('http') ? 
                      post.profilePic : 
                      `${API_BASE_URL}${post.profilePic.startsWith('/') ? post.profilePic : `/${post.profilePic}`}`) 
                    : "/default-profile.jpg"}
                  alt="Profile"
                />
                <div className="flex flex-col">
                  <Link to={`/profile/${post.userId}`} className="hover:underline font-semibold text-base">
                    {post.name || "Unknown User"}
                  </Link>
                  <span className="text-xs text-gray-400 mt-0.5">{moment(post.createdAt).fromNow()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Existing menu for delete, etc. */}
                {!isGuest && (
                  <motion.div whileHover={{ scale: 1.12 }} className="relative cursor-pointer text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
                    <MoreVertical />
                    {menuOpen && (
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        className={`absolute top-full right-0 mt-2 px-4 py-2 rounded-xl shadow-lg transition-all duration-300 z-10
                          ${theme === "dark" ? "bg-red-700 text-white hover:bg-red-600" : "bg-red-500 text-white hover:bg-red-600"}`}
                        onClick={() => deleteMutation.mutate()}
                      >
                        Delete Post
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Category Badges */}
            {(post.category || post.category2 || post.category3 || post.category4) && (
              <div className="mt-2 mb-2 flex gap-2 flex-wrap">
                {[post.category, post.category2, post.category3, post.category4].filter(Boolean).map((cat) => (
                  <span
                    key={cat}
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm border
                      ${cat === 'Student Life' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        cat === 'Organization' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                        cat === 'Academics' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                        cat === 'Campus Services' ? 'bg-teal-100 text-teal-700 border-teal-300' :
                        'bg-gray-200 text-gray-700 border-gray-300'}
                    `}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Post Content */}
            <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {/* Replace the regular paragraph with this to handle links */}
              <div className="text-base leading-relaxed mb-3 whitespace-pre-wrap break-words">
                {detectLinks(post.desc, theme) || "No description available."}
              </div>
              
              {/* Keep the original image code */}
              {post.img && (
                <motion.div className="relative group cursor-pointer mt-2" onClick={() => setShowImageModal(true)}>
                  <img
                    src={post.img ? 
                      (post.img.startsWith('http') ? 
                        post.img : 
                        `${API_BASE_URL}${post.img.startsWith('/') ? post.img : `/${post.img}`}`) 
                      : ""}
                    alt="Post"
                    className="w-full max-h-[340px] object-cover rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                    <ImageIcon className="text-white w-8 h-8" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex gap-3 items-center">
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => likeMutation.mutate()}
                  disabled={!canLike || likeMutation.isLoading}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 font-medium
                    ${!canLike || likeMutation.isLoading ? "opacity-50 cursor-not-allowed" : ""}
                    ${isLiked ? (theme === "dark" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-600") : (theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500")}`}
                  title={!canLike ? "Please sign in to like posts" : (isLiked ? "Unlike" : "Like")}
                >
                  {likeMutation.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isLiked ? (
                    <Heart className="w-5 h-5 fill-emerald-500" />
                  ) : (
                    <HeartOff className="w-5 h-5" />
                  )}
                  <span className="text-sm">{totalLikes}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCommentOpen((prev) => !prev)}
                  disabled={!canComment}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 font-medium
                    ${!canComment ? "opacity-50 cursor-not-allowed" : ""}
                    ${theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                  title={!canComment ? "Please sign in to comment" : "Comments"}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{commentCount} {commentLabel}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={!canBookmark}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 font-medium
                    ${!canBookmark ? "opacity-50 cursor-not-allowed" : ""}
                    ${isBookmarked ? "bg-yellow-100 text-yellow-500" : (theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500")}`}
                  title={!canBookmark ? "Please sign in to bookmark posts" : (isBookmarked ? "Remove Bookmark" : "Bookmark")}
                >
                  {isBookmarked ? (
                    <BookmarkIcon
                      className="w-5 h-5 fill-yellow-500"
                      stroke="currentColor"
                    />
                  ) : (
                    <BookmarkMinus className="w-5 h-5" />
                  )}
                </motion.button>
                {/* Report Icon beside bookmark, disabled for guests */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={openReportModal}
                  disabled={isGuest}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 font-medium text-gray-500 hover:text-red-500 ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isGuest ? 'Please sign in to report posts' : 'Report this post'}
                >
                  <Flag className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {commentOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-5"
                >
                  <Comments postId={post.posts_id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Image Modal */}
          <AnimatePresence>
            {showImageModal && post.img && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
                onClick={() => setShowImageModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative max-w-3xl w-full"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
                  >
                    <XCircle size={32} strokeWidth={2.5} />
                  </button>
                  <img
                    src={post.img ? 
                      (post.img.startsWith('http') ? 
                        post.img : 
                        `${API_BASE_URL}${post.img.startsWith('/') ? post.img : `/${post.img}`}`) 
                      : ""}
                    alt="Post Preview"
                    className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-lg"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Modal */}
          <AnimatePresence>
            {showReportModal && (
              <ReportModal 
                setShowReportModal={setShowReportModal}
                reportLoading={reportLoading}
                alreadyReported={alreadyReported}
                handleReport={handleReport}
                toggleReason={toggleReason}
                selectedReasons={selectedReasons}
              />
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div
          className={`${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          } rounded-xl shadow-sm border ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          } p-5 mb-5 flex items-center justify-center`}
        >
          <p className="text-gray-500 dark:text-gray-400 py-8">
            This post is no longer available.
          </p>
        </div>
      )}
    </>
  );
};

// Report modal component
const ReportModal = ({ setShowReportModal, reportLoading, alreadyReported, handleReport, toggleReason, selectedReasons }) => {
  const { theme } = useTheme();
  
  // Define comprehensive report categories with subcategories
  const reportCategories = [
    {
      id: 'inappropriate',
      label: 'Inappropriate Content',
      icon: 'alert-triangle',
      reasons: [
        "Sexual content",
        "Nudity or pornography",
        "Violence or graphic content",
        "Hate speech or symbols",
        "Promotes illegal activities"
      ]
    },
    {
      id: 'harassment',
      label: 'Harassment or Bullying',
      icon: 'message-square-off',
      reasons: [
        "Targeted harassment",
        "Threatening language",
        "Cyberbullying",
        "Encouraging others to harass"
      ]
    },
    {
      id: 'misinformation',
      label: 'False Information',
      icon: 'ban',
      reasons: [
        "Contains inaccurate or outdated information",
        "Misleading content",
        "Health misinformation",
        "Manipulated media"
      ]
    },
    {
      id: 'spam',
      label: 'Spam or Misleading',
      icon: 'mail',
      reasons: [
        "Repetitive posting",
        "Fake engagement",
        "Scams or fraud",
        "Misleading claims or clickbait"
      ]
    },
    {
      id: 'intellectual',
      label: 'Intellectual Property',
      icon: 'copyright',
      reasons: [
        "Copyright infringement",
        "Trademark violation",
        "Unauthorized use of content"
      ]
    },
    {
      id: 'privacy',
      label: 'Privacy Violation',
      icon: 'eye-off',
      reasons: [
        "Shares personal information without consent",
        "Doxxing",
        "Impersonation"
      ]
    },
    {
      id: 'academic',
      label: 'Academic Integrity',
      icon: 'graduation-cap',
      reasons: [
        "Cheating or plagiarism",
        "Selling academic materials",
        "Unauthorized sharing of exam content"
      ]
    },
    {
      id: 'campus',
      label: 'Campus Policy Violation',
      icon: 'building',
      reasons: [
        "Violates school values or community standards",
        "Fails to follow official GC communication standards",
        "Unfair to certain groups or students",
        "Triggers anxiety or unnecessary pressure"
      ]
    },
    {
      id: 'other',
      label: 'Something Else',
      icon: 'more-horizontal',
      reasons: [
        "Not accessible (e.g., unclear for PWDs)",
        "Announced too late or last-minute",
        "Irrelevant to my program or department",
        "Other concern not listed"
      ]
    }
  ];

  // Get icon component based on name
  const getIcon = (iconName) => {
    const icons = {
      'alert-triangle': AlertTriangle,
      'message-square-off': MessageSquare,
      'ban': AlertCircle,
      'mail': MessageCircle,
      'copyright': AlertCircle,
      'eye-off': Eye,
      'graduation-cap': BookmarkIcon,
      'building': Flag,
      'more-horizontal': MoreVertical
    };
    
    const IconComponent = icons[iconName] || AlertTriangle;
    return <IconComponent size={18} />;
  };

  // Handle category selection
  const selectCategory = (category) => {
    setSelectedCategory(category);
    setReportReason(""); // Clear any previously selected reason
  };

  // Handle reason selection
  const selectReason = (reason) => {
    setReportReason(reason);
  };

  // Handle back button to return to categories
  const handleBack = () => {
    setSelectedCategory(null);
    setReportReason("");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#1a2235] text-white rounded-3xl overflow-visible shadow-2xl relative">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-900/40">
              <Flag size={20} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold">Report Content</h2>
          </div>
          <p className="text-gray-300 text-sm mt-2 ml-9">Let us know what concerns you about this post.</p>
        </div>
        
        {/* Content */}
        <div className="p-6 pt-3 overflow-y-auto max-h-[60vh] scrollbar scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-emerald-500/50 scrollbar-track-gray-800/50 hover:scrollbar-thumb-emerald-500/70">
          {!selectedCategory ? (
            // Step 1: Show categories
            <>
              <label className="block text-gray-200 mb-3 font-medium">
                Please select a category:
              </label>
              <div className="space-y-2">
                {reportCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => selectCategory(category)}
                    className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-full bg-gray-700">
                        {getIcon(category.icon)}
                      </div>
                      <span>{category.label}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Step 2: Show reasons within selected category
            <>
              <div className="flex items-center mb-4">
                <button 
                  onClick={handleBack}
                  className="p-2 rounded-full hover:bg-gray-700 mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-gray-700">
                    {getIcon(selectedCategory.icon)}
                  </div>
                  <span className="font-medium">{selectedCategory.label}</span>
                </div>
              </div>
              
              <label className="block text-gray-200 mb-3 font-medium">
                Please select a specific reason:
              </label>
              <div className="space-y-2">
                {selectedCategory.reasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => selectReason(reason)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${
                      reportReason === reason 
                        ? "bg-blue-900/50 border border-blue-500" 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <span>{reason}</span>
                    {reportReason === reason && (
                      <Check size={18} className="text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-3 flex justify-end gap-3">
          <button
            onClick={() => setShowReportModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={() => handleReport(reportReason)}
            disabled={!reportReason || reportLoading || alreadyReported}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              !reportReason || reportLoading || alreadyReported
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {reportLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : alreadyReported ? (
              "Already Reported"
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;











































