import { useContext, useState } from "react";
import { AuthContext } from "../authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, Send, CheckCircle, Check } from "lucide-react";

const Share = () => {
  const { theme } = useTheme();
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";
  const queryClient = useQueryClient();

  const upload = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await makeRequest.post("/upload", formData);
      return res.data;
    } catch (err) {
      console.log(err);
      return "";
    }
  };

  const mutation = useMutation({
    mutationFn: (newPost) => makeRequest.post("/posts", newPost),
    onMutate: async () => {
      setIsSharing(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setIsSharing(false);
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 1200);
    },
    onSettled: () => {
      setDesc("");
      setFile(null);
    },
  });

  const handleClick = async (e) => {
    e.preventDefault();
    if (!isAdmin || !category) return;
    let imgUrl = "";
    if (file) imgUrl = await upload();
    mutation.mutate({ desc, img: imgUrl, category });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid image file.");
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-xl p-6 transition-all duration-300 ease-in-out ${
        theme === "dark" 
          ? "bg-gray-800/50 text-white" 
          : "bg-white text-gray-900 shadow-sm"
      }`}
    >
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 rounded-xl"
          >
            <CheckCircle size={72} className="text-emerald-500 mb-2 animate-bounceIn" />
            <span className="text-xl font-bold text-white drop-shadow">Posted!</span>
          </motion.div>
        )}
      </AnimatePresence>
      {isAdmin ? (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={currentUser.profilePic ? `/upload/${currentUser.profilePic}` : "/default-profile.jpg"}
              alt="Profile"
              className={`w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 transition-all duration-200 ${
                theme === "dark" ? "ring-emerald-500" : "ring-teal-500"
              }`}
            />
            <div className="flex-1">
              <textarea
                placeholder={`What's on your mind, ${currentUser.name}?`}
                className={`w-full p-3 rounded-xl outline-none resize-none transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-900/50 text-white placeholder-gray-400 focus:bg-gray-900"
                    : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                  }`}
                rows="3"
                onChange={(e) => setDesc(e.target.value)}
                value={desc}
              />
            </div>
          </div>

          {file && (
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                className="w-full max-h-[300px] object-cover rounded-xl"
                alt="Preview"
                src={URL.createObjectURL(file)}
              />
              <button
                onClick={() => setFile(null)}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200
                  ${theme === "dark"
                    ? "bg-gray-900/80 text-white hover:bg-gray-900"
                    : "bg-white/80 text-gray-900 hover:bg-white"
                  }`}
              >
                <X size={20} />
              </button>
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file"
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200
                  ${theme === "dark"
                    ? "text-gray-400 hover:text-emerald-400"
                    : "text-gray-600 hover:text-teal-600"
                  }`}
              >
                <Image size={20} />
                <span className="text-sm font-medium">Add Image</span>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSharing || !desc.trim() || !category}
              onClick={handleClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isSharing
                  ? "bg-gray-400 cursor-not-allowed"
                  : theme === "dark"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
            >
              <Send size={18} />
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </motion.button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setCategory("Student Life")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1 border-2 ${
                  category === "Student Life"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {category === "Student Life" && <Check size={14} className="mr-1" />}
                Student Life
              </button>
              <button
                onClick={() => setCategory("Clubs & Orgs")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1 border-2 ${
                  category === "Clubs & Orgs"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {category === "Clubs & Orgs" && <Check size={14} className="mr-1" />}
                Clubs & Orgs
              </button>
              <button
                onClick={() => setCategory("Academics")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center gap-1 border-2 ${
                  category === "Academics"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {category === "Academics" && <Check size={14} className="mr-1" />}
                Academics
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`text-center py-6 rounded-xl ${
          theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
        }`}>
          <p className="text-sm opacity-70">
            Posting is restricted to <strong>admin users</strong> only.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Share;
