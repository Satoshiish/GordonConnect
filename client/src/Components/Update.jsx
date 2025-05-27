import React, { useState } from "react";
import { makeRequest } from "../axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../ThemeContext";
import { XCircle } from "lucide-react";

const Update = ({ setOpenUpdate, user }) => {
  const [cover, setCover] = useState(null);
  const [profile, setProfile] = useState(null);
  const [texts, setTexts] = useState({
    name: user.name || "",
    city: user.city || "",
    website: user.website || "",
  });

  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const upload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      
      // Include token in the request headers
      const res = await makeRequest.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });
      
      // Return just the filename as received from the server
      return res.data;
    } catch (err) {
      console.error("Upload Error:", err);
      return null;
    }
  };

  const handleChange = (e) => {
    setTexts((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const mutation = useMutation({
    mutationFn: (userData) => makeRequest.put("/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("Update failed:", error);
    },
  });

  const handleClick = async (e) => {
    e.preventDefault();
    const coverUrl = cover ? await upload(cover) : user.coverPic;
    const profileUrl = profile ? await upload(profile) : user.profilePic;

    mutation.mutate({
      ...texts,
      coverPic: coverUrl || user.coverPic,
      profilePic: profileUrl || user.profilePic,
    });

    setOpenUpdate(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
      <div
        className={`relative p-6 md:p-10 rounded-2xl shadow-2xl w-[95%] max-w-lg border border-white/20 backdrop-blur-lg
          ${theme === "dark" ? "bg-gray-900/90 text-white" : "bg-white/90 text-gray-900"}`}
      >
        <button
          onClick={() => setOpenUpdate(false)}
          className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-emerald-500 hover:text-white shadow-lg transition-all duration-200 z-10 text-3xl"
          aria-label="Close"
        >
          <XCircle size={32} strokeWidth={2.5} />
        </button>
        <h2 className="text-3xl font-bold mb-6 text-center">Update Profile</h2>
        <form className="space-y-5">
          {/* Cover Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Cover Photo</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-emerald-400 rounded-lg p-3 cursor-pointer bg-emerald-50/40 hover:bg-emerald-100/60 transition">
                <span className="text-xs text-emerald-700 mb-1">Drag & drop or click to select</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files[0])}
                  className="hidden"
                />
                {cover ? (
                  <img src={URL.createObjectURL(cover)} alt="Cover Preview" className="mt-2 w-full h-32 object-cover rounded-md shadow" />
                ) : user.coverPic ? (
                  <img src={`/upload/${user.coverPic}`} alt="Current Cover" className="mt-2 w-full h-32 object-cover rounded-md opacity-60" />
                ) : null}
              </label>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Profile Photo</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg p-3 cursor-pointer bg-blue-50/40 hover:bg-blue-100/60 transition">
                <span className="text-xs text-blue-700 mb-1">Drag & drop or click to select</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfile(e.target.files[0])}
                  className="hidden"
                />
                {profile ? (
                  <img src={URL.createObjectURL(profile)} alt="Profile Preview" className="mt-2 w-16 h-16 object-cover rounded-full shadow" />
                ) : user.profilePic ? (
                  <img src={`/upload/${user.profilePic}`} alt="Current Profile" className="mt-2 w-16 h-16 object-cover rounded-full opacity-60" />
                ) : (
                  <img src="/default-profile.jpg" alt="Default Profile" className="mt-2 w-16 h-16 object-cover rounded-full opacity-60" />
                )}
              </label>
            </div>
          </div>

          {/* Text Inputs */}
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={texts.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={texts.city}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
          />
          <input
            type="text"
            name="website"
            placeholder="Website"
            value={texts.website}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
          />

          <button
            onClick={handleClick}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-lg"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default Update;
