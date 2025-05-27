import React, { useContext, useState } from "react";
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
import { Image as ImageIcon, XCircle, Heart, HeartOff, Bookmark as BookmarkIcon, BookmarkMinus, MessageCircle, Share2, MoreVertical, Loader2, Flag, ExternalLink } from 'lucide-react';
import { formatImageUrl } from "../utils/imageUtils";

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
  const [reportReason, setReportReason] = useState("");
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
      if (post.posts_id) {
        await makeRequest.delete(`/posts/${post.posts_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onMutate: async () => {
      setIsDeleting(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["posts"]);
      setIsDeleting(false);
    },
  });

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting.");
      return;
    }
    setReportLoading(true);
    try {
      await makeRequest.post("/reports", {
        user_id: currentUser?.id || currentUser?.user_id || null,
        post_id: post.posts_id,
        reason: reportReason,
      });
      toast.success("Report submitted. Thank you!");
      setShowReportModal(false);
      setReportReason("");
      setAlreadyReported(true);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error && err.response.data.error.toLowerCase().includes("duplicate")) {
        setAlreadyReported(true);
      } else {
        toast.error("Failed to submit report.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  return (
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
              className="w-10 h-10 rounded-full object-cover"
              src={formatImageUrl(post.profilePic)}
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
                src={formatImageUrl(post.img)}
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
              onClick={() => {
                if (isGuest) return;
                setShowReportModal(true);
              }}
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
                src={formatImageUrl(post.img)}
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
              className="w-full max-w-lg rounded-3xl p-8 bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 relative"
            >
              <button
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl transition"
                onClick={() => setShowReportModal(false)}
                aria-label="Close"
              >
                <XCircle size={28} strokeWidth={2.5} />
              </button>
              <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Report Post</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Fill in the details to report this post to the admin.</p>
              {alreadyReported ? (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-red-100/90 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-lg border border-red-200 dark:border-red-800/50"
                >
                  <XCircle size={48} className="mb-2" />
                  <p className="text-lg font-semibold mb-2">You have already reported this post.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thank you for helping us keep the community safe.</p>
                </motion.div>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300" htmlFor="report-reason">Reason</label>
                  <textarea
                    id="report-reason"
                    className="w-full p-4 rounded-xl border-0 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-6 shadow-sm focus:ring-2 focus:ring-emerald-400 transition resize-none"
                    rows={4}
                    placeholder="Please describe the reason for reporting this post..."
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    disabled={reportLoading}
                  />
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      onClick={() => setShowReportModal(false)}
                      disabled={reportLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow"
                      onClick={handleReport}
                      disabled={reportLoading}
                    >
                      {reportLoading ? "Reporting..." : "Report"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Post;


