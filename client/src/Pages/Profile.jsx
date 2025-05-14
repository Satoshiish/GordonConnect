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
import { Pencil, XCircle } from "lucide-react";

function Profile() {
  const { currentUser } = useContext(AuthContext);
  const [openUpdate, setOpenUpdate] = useState(false);
  const { theme } = useTheme();
  const userId = parseInt(useLocation().pathname.split("/")[2]);
  const [imageModal, setImageModal] = useState({ open: false, src: "", alt: "" });

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
    mutationFn: async () => {
      const token = localStorage.getItem("token");

      if (isFollowing) {
        await makeRequest.delete(`/relationships?followedUserId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await makeRequest.post(
          "/relationships",
          { followedUserId: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["relationship"]);
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

  return (
    <div
      className={`profile ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      } min-h-screen`}
    >
      {/* Cover Photo Section with Overlay */}
      <div className="relative w-full h-[320px] md:h-[380px] cursor-pointer group">
        <img
          src={data?.coverPic && data.coverPic.trim() !== "" ? "/upload/" + data.coverPic : "/default-cover.png"}
          alt="Cover"
          className="w-full h-full object-cover group-hover:brightness-90 transition"
          onClick={() => setImageModal({ open: true, src: data?.coverPic && data.coverPic.trim() !== "" ? "/upload/" + data.coverPic : "/default-cover.png", alt: "Cover" })}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent rounded-b-3xl pointer-events-none" />
        <div className="absolute top-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">View Cover</div>
      </div>

      {/* Profile Header Section */}
      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-32 md:-mt-36 relative z-10">
            {/* Profile Picture with Ring */}
            <div className="flex-shrink-0 mb-4 md:mb-0 relative cursor-pointer group" onClick={() => setImageModal({ open: true, src: data?.profilePic ? "/upload/" + data.profilePic : "/default-profile.jpg", alt: "Profile" })}>
              <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-emerald-400 via-blue-400 to-purple-400 p-1 shadow-2xl" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'}}>
                <img
                  src={data?.profilePic ? "/upload/" + data.profilePic : "/default-profile.jpg"}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-200 hover:scale-105 bg-white dark:bg-gray-900"
                  style={{ zIndex: 2 }}
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">View Photo</div>
              </div>
            </div>
            {/* Info Card with Glassmorphism */}
            <div className="ml-0 md:ml-8 flex-1 bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl px-8 py-8 mt-4 md:mt-0 backdrop-blur-lg border border-white/30 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-6" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)'}}>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                  {data?.name || "Unknown User"}
                </h1>
                <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
                  <div className="flex items-center text-base opacity-80">
                    <PlaceIcon className="mr-1" />
                    <span>{data?.city || "Unknown"}</span>
                  </div>
                  <div className="flex items-center text-base opacity-80">
                    <LanguageIcon className="mr-1" />
                    <a 
                      href={data?.website?.startsWith('http') ? data.website : `https://${data?.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {data?.website || "No website"}
                    </a>
                  </div>
                </div>
                {/* Social Links */}
                <div className="flex gap-4 mt-2">
                  {[
                    FacebookTwoToneIcon,
                    InstagramIcon,
                    TwitterIcon,
                    LinkedInIcon,
                    PinterestIcon,
                  ].map((Icon, index) => (
                    <a
                      key={index}
                      href="#"
                      className={`p-3 rounded-full transition-all duration-200 shadow-sm
                        ${theme === "dark"
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-100"}
                        hover:scale-110`}
                      style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)' }}
                    >
                      <Icon fontSize="medium" />
                    </a>
                  ))}
                </div>
              </div>
              {/* Action Button */}
              <div className="flex items-center justify-end w-full md:w-auto">
                {parseInt(userId) === parseInt(currentUser?.user_id) ? (
                  <button
                    onClick={() => setOpenUpdate(true)}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-lg text-lg transition-all duration-200"
                  >
                    <Pencil size={22} /> Update Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold shadow-lg text-lg transition-all duration-200
                      ${isFollowing 
                        ? 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-8">
          <Posts userId={userId} />
        </div>
      </div>
      
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
    </div>
  );
}

export default Profile;