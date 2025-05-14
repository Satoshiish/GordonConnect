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
import { Image as ImageIcon, XCircle, Heart, HeartOff, Bookmark as BookmarkIcon, BookmarkMinus, MessageCircle, Share2, MoreVertical } from 'lucide-react';

const Post = ({ post }) => {
  const { theme } = useTheme();
  const [commentOpen, setCommentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

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

  const totalLikes = data.totalLikes || 0;
  const isLiked = data.userLiked > 0;
  const isBookmarked = bookmarkData.userBookmarked > 0;

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
    onSuccess: () => queryClient.invalidateQueries(["likes", post.posts_id]),
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

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 1 }}
      animate={isDeleting ? { scale: 0.7, opacity: 0 } : { scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={`rounded-xl shadow-lg mb-8 border transition-all duration-300
        ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}
    >
      <div className="p-6">
        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <img
              className="h-14 w-14 rounded-full object-cover border-2 border-emerald-400 shadow"
              src={post.profilePic ? `/upload/${post.profilePic}` : "/default-profile.jpg"}
              alt="Profile"
            />
            <div className="flex flex-col">
              <Link to={`/profile/${post.userId}`} className="hover:underline font-semibold">
                {post.name || "Unknown User"}
              </Link>
              <span className="text-xs text-gray-400 mt-1">{moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
          {!isGuest && (
            <motion.div whileHover={{ scale: 1.15 }} className="relative cursor-pointer text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical />
              {menuOpen && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-full right-0 mt-2 px-4 py-2 rounded-md shadow-md transition-all duration-300 z-10
                    ${theme === "dark" ? "bg-red-700 text-white hover:bg-red-600" : "bg-red-500 text-white hover:bg-red-600"}`}
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete Post
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* Category Badge */}
        {post.category && (
          <div className="mt-3 mb-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm
                ${post.category === 'Student Life' ? 'bg-blue-100 text-blue-700' :
                  post.category === 'Clubs & Orgs' ? 'bg-purple-100 text-purple-700' :
                  post.category === 'Academics' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-gray-200 text-gray-700'}
              `}
            >
              {post.category}
            </span>
          </div>
        )}

        {/* Post Content */}
        <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <p className="text-lg leading-relaxed mb-3">{post.desc || "No description available."}</p>
          {post.img && (
            <motion.div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
              <img
                src={`/upload/${post.img}`}
                alt="Post"
                className="w-full max-h-[400px] object-cover rounded-lg shadow transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                <ImageIcon className="text-white w-10 h-10" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-4 items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => likeMutation.mutate()}
              disabled={!canLike}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200
                ${!canLike ? "opacity-50 cursor-not-allowed" : ""}
                ${isLiked ? (theme === "dark" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-600") : (theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500")}`}
              title={!canLike ? "Please sign in to like posts" : (isLiked ? "Unlike" : "Like")}
            >
              {isLiked ? <Heart className="w-5 h-5 fill-emerald-500" /> : <HeartOff className="w-5 h-5" />}
              <span className="text-sm font-medium">{totalLikes}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCommentOpen((prev) => !prev)}
              disabled={!canComment}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200
                ${!canComment ? "opacity-50 cursor-not-allowed" : ""}
                ${theme === "dark" ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              title={!canComment ? "Please sign in to comment" : "Comments"}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => bookmarkMutation.mutate()}
              disabled={!canBookmark}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200
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
              className="overflow-hidden mt-6"
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
                src={`/upload/${post.img}`}
                alt="Post Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Post;
