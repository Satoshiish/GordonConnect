
import React, { useContext, useState } from "react";
import { useTheme } from "../ThemeContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useLocation } from "react-router-dom";
import FacebookTwoToneIcon from "@mui/icons-material/FacebookTwoTone";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import PinterestIcon from "@mui/icons-material/Pinterest";
import TwitterIcon from "@mui/icons-material/Twitter";
import PlaceIcon from "@mui/icons-material/Place";
import LanguageIcon from "@mui/icons-material/Language";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Posts from "../Components/Posts";
import { AuthContext } from "../authContext";
import Update from "../Components/Update";
import { Pencil, XCircle, X } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BadgeCheck, Shield } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://gordonconnect-production-f2bd.up.railway.app/api";

function Profile() {
  const { currentUser } = useContext(AuthContext);
  const [openUpdate, setOpenUpdate] = useState(false);
  const { theme } = useTheme();
  const userId = parseInt(useLocation().pathname.split("/")[2]);
  const [imageModal, setImageModal] = useState({ open: false, src: "", alt: "" });
  const { scrollY } = useScroll();
  const coverScale = useTransform(scrollY, [0, 300], [1, 1.1]);
  const coverOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  console.log("AuthContext Data:", currentUser);
  console.log("Current User ID:", currentUser?.user_id);
  console.log("Profile User ID:", userId);

  if (!currentUser) {
    return (
      <div className="text-center text-lg text-gray-600">Loading user...</div>
    );
  }

  const { isPending, error, data } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/users/find/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: relationshipData } = useQuery({
    queryKey: ["relationship", userId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(
        `/relationships?followedUserId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
  });

  const isFollowing = relationshipData?.users?.includes(currentUser.user_id);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (targetUserId) => {
      const token = localStorage.getItem("token");
      // Check if we're already following this user (use followingList for the modal)
      const isCurrentlyFollowing = followingList.some(u => u.id === targetUserId);

      if (isCurrentlyFollowing) {
        await makeRequest.delete(`/relationships?followedUserId=${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await makeRequest.post(
          "/relationships",
          { followedUserId: targetUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refresh the data
      queryClient.invalidateQueries(["relationship"]);
      queryClient.invalidateQueries(["followers", userId]);
      queryClient.invalidateQueries(["following", userId]);
    },
  });

  // Fetch followers data
  const { data: followersData } = useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/users/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowersList(res.data);
      return res.data;
    },
  });

  // Fetch following data
  const { data: followingData } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await makeRequest.get(`/users/following/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowingList(res.data);
      return res.data;
    },
  });

  const handleFollow = () => mutation.mutate();

  if (isPending) {
    return (
      <div className="text-center text-lg text-gray-600">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">Error loading profile.</div>
    );
  }

  // Deduplicate following list
  const uniqueFollowingList = Array.from(
    new Map(followingList.map(item => [item.id, item])).values()
  );

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} text-gray-900`}>
      {/* Enhanced Cover Photo Section with Parallax */}
      <motion.div 
        style={{ scale: coverScale, opacity: coverOpacity }}
        className="relative w-full h-[180px] sm:h-[240px] md:h-[300px] lg:h-[380px] overflow-hidden cursor-pointer group"
      >
        <img
          src={data?.coverPic ? 
            (data.coverPic.startsWith('http') ? 
              data.coverPic : 
              `${API_BASE_URL}${data.coverPic.startsWith('/') ? data.coverPic : `/${data.coverPic}`}`) 
            : "/default-cover.png"}
          alt="Cover"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          onClick={() => setImageModal({ 
            open: true, 
            src: data?.coverPic ? 
              (data.coverPic.startsWith('http') ? 
                data.coverPic : 
                `${API_BASE_URL}${data.coverPic.startsWith('/') ? data.coverPic : `/${data.coverPic}`}`) 
              : "/default-cover.png", 
            alt: "Cover" 
          })}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent rounded-b-3xl pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          View Cover
        </motion.div>
      </motion.div>

      {/* Profile Info Section */}
      <div className="relative px-2 sm:px-4 md:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 z-10">
        <div className="max-w-5xl mx-auto">
          <div className={`rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 ${theme === "dark" ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-lg shadow-xl border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            {/* Profile content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative"
            >
              <div className="container mx-auto px-2 sm:px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 sm:-mt-24 md:-mt-28 lg:-mt-32 relative z-10">
                  {/* Enhanced Profile Picture */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 mb-4 md:mb-0 relative cursor-pointer group"
                    onClick={() => setImageModal({ open: true, src: data?.profilePic ? 
                      (data.profilePic.startsWith('http') ? 
                        data.profilePic : 
                        `${API_BASE_URL}${data.profilePic.startsWith('/') ? data.profilePic : `/${data.profilePic}`}`) 
                      : "/default-profile.jpg", 
                      alt: "Profile" })}
                  >
                    <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-56 lg:h-56 rounded-full bg-gradient-to-tr from-emerald-400 via-blue-400 to-purple-400 p-1.5 shadow-2xl transform transition-all duration-300 group-hover:shadow-emerald-500/20" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'}}>
                      <img
                        src={data?.profilePic ? 
                          (data.profilePic.startsWith('http') ? 
                            data.profilePic : 
                            `${API_BASE_URL}${data.profilePic.startsWith('/') ? data.profilePic : `/${data.profilePic}`}`) 
                          : "/default-profile.jpg"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </motion.div>

                  {/* Enhanced Info Card with Better Glassmorphism */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                    className={`ml-0 md:ml-6 lg:ml-8 flex-1 rounded-2xl sm:rounded-3xl shadow-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 mt-4 md:mt-0 backdrop-blur-xl border flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 md:gap-8 ${
                      theme === "dark"
                        ? "bg-gray-900/95 border-gray-800/50 text-white"
                        : "bg-white/95 border-gray-200/50 text-gray-900"
                    }`}
                    style={{
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <div className="flex-1 space-y-2 sm:space-y-4">
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2"
                      >
                        {data?.name || "Unknown User"}
                        {data?.role === "admin" && (
                          <span className="inline-flex items-center justify-center relative ml-1" title="Admin">
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse opacity-70"></span>
                            <span className="relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full p-1 border-2 border-emerald-400">
                              <BadgeCheck size={16} className="text-white" />
                            </span>
                          </span>
                        )}
                      </motion.h1>

                      {/* Stats Section */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex gap-4 sm:gap-6 mb-2 sm:mb-4"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowFollowers(true)}
                          className="flex flex-col items-center cursor-pointer group"
                        >
                          <span className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                            {followersList?.length || 0}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors">Followers</span>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowFollowing(true)}
                          className="flex flex-col items-center cursor-pointer group"
                        >
                          <span className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 group-hover:text-emerald-500 transition-colors">
                            {uniqueFollowingList?.length || 0}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors">Following</span>
                        </motion.div>
                      </motion.div>

                      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className={`flex items-center text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"} hover:text-emerald-600 transition-colors`}
                        >
                          <PlaceIcon className="mr-2" />
                          <span>{data?.city || "Unknown"}</span>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className={`flex items-center text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"} hover:text-emerald-600 transition-colors`}
                        >
                          <LanguageIcon className="mr-2" />
                          <a 
                            href={data?.website?.startsWith('http') ? data.website : `https://${data?.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {data?.website || "No website"}
                          </a>
                        </motion.div>
                      </div>

                      {/* Enhanced Social Links */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="flex gap-4 mt-4"
                      >
                        {[
                          { Icon: FacebookTwoToneIcon, color: 'hover:text-blue-600' },
                          { Icon: InstagramIcon, color: 'hover:text-pink-600' },
                          { Icon: TwitterIcon, color: 'hover:text-sky-500' },
                          { Icon: LinkedInIcon, color: 'hover:text-blue-700' },
                          { Icon: PinterestIcon, color: 'hover:text-red-600' },
                        ].map(({ Icon, color }, index) => (
                          <motion.a
                            key={index}
                            href="#"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-3 rounded-full transition-all duration-300 ${
                              theme === "dark"
                                ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            } ${color} shadow-sm hover:shadow-md`}
                          >
                            <Icon fontSize="medium" />
                          </motion.a>
                        ))}
                      </motion.div>
                    </div>

                    {/* Enhanced Action Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
                      className="flex items-center justify-center md:justify-end w-full md:w-auto"
                    >
                      {parseInt(userId) === parseInt(currentUser?.user_id) ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setOpenUpdate(true)}
                          className="flex items-center gap-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-emerald-500/25"
                        >
                          <Pencil size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" /> Update Profile
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleFollow}
                          className={`flex items-center gap-2 px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold shadow-lg text-sm sm:text-base md:text-lg transition-all duration-300 ${
                            isFollowing 
                              ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white hover:shadow-gray-500/25' 
                              : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white hover:shadow-blue-500/25'
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </motion.button>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8"
      >
        <div className="mt-4 sm:mt-6 md:mt-8">
          <Posts userId={userId} />
        </div>
      </motion.div>
      
      {openUpdate && <Update setOpenUpdate={setOpenUpdate} user={data} />}

      {/* Image Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setImageModal({ open: false, src: "", alt: "" })}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setImageModal({ open: false, src: "", alt: "" })}
              className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
            >
              <XCircle size={32} strokeWidth={2.5} />
            </button>
            <img
              src={imageModal.src}
              alt={imageModal.alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Followers Modal */}
      <Transition appear show={showFollowers} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowFollowers(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}>
                  <Dialog.Title as="h3" className={`flex justify-between items-center text-lg font-medium leading-6 mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Followers
                    <button
                      onClick={() => setShowFollowers(false)}
                      className={`p-1 rounded-full transition-colors ${
                        theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </Dialog.Title>
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    {followersList?.length > 0 ? (
                      <div className="space-y-4">
                        {followersList.map((follower) => (
                          <motion.div
                            key={follower.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                            }`}
                          >
                            <img
                              src={follower.profilePic ? 
                                (follower.profilePic.startsWith('http') ? 
                                  follower.profilePic : 
                                  `/upload/${follower.profilePic}`) 
                                : "/default-profile.jpg"}
                              alt={follower.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = "/default-profile.jpg";
                              }}
                            />
                            <div className="flex-1">
                              <h4 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                {follower.name}
                              </h4>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                {follower.city || "No location"}
                              </p>
                            </div>
                            {follower.id !== currentUser?.user_id && (
                              <button
                                onClick={() => mutation.mutate(follower.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  relationshipData?.users?.includes(follower.id)
                                    ? theme === "dark" 
                                      ? "bg-gray-700 text-white hover:bg-gray-600" 
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                                }`}
                              >
                                {relationshipData?.users?.includes(follower.id) ? "Following" : "Follow"}
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-center py-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        No followers yet
                      </p>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Following Modal */}
      <Transition appear show={showFollowing} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowFollowing(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}>
                  <Dialog.Title as="h3" className={`flex justify-between items-center text-lg font-medium leading-6 mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Following
                    <button
                      onClick={() => setShowFollowing(false)}
                      className={`p-1 rounded-full transition-colors ${
                        theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </Dialog.Title>
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    {uniqueFollowingList?.length > 0 ? (
                      <div className="space-y-4">
                        {uniqueFollowingList.map((following) => (
                          <motion.div
                            key={following.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                            }`}
                          >
                            <img
                              src={following.profilePic ? 
                                (following.profilePic.startsWith('http') ? 
                                  following.profilePic : 
                                  `/upload/${following.profilePic}`) 
                                : "/default-profile.jpg"}
                              alt={following.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = "/default-profile.jpg";
                              }}
                            />
                            <div className="flex-1">
                              <h4 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                {following.name}
                              </h4>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                {following.city || "No location"}
                              </p>
                            </div>
                            {following.id !== currentUser?.user_id && (
                              <button
                                onClick={() => mutation.mutate(following.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                                    : "bg-gray-800 text-white hover:bg-gray-700"
                                }`}
                                title="Unfollow"
                                onMouseOver={e => e.currentTarget.textContent = 'Unfollow'}
                                onMouseOut={e => e.currentTarget.textContent = 'Following'}
                              >
                                Following
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-center py-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Not following anyone yet
                      </p>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default Profile;






















