import { useContext, useState, useRef } from "react";
import { AuthContext } from "../authContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, Send, CheckCircle, Check, UploadCloud } from "lucide-react";

const Share = () => {
  const { theme } = useTheme();
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();

  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";
  const queryClient = useQueryClient();

  const availableCategories = ["Student Life", "Organization", "Academics", "Campus Services"];

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

  const handleCategoryClick = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else if (selectedCategories.length < 4) {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    if (!isAdmin || selectedCategories.length === 0) return;
    let imgUrl = "";
    if (file) imgUrl = await upload();
    mutation.mutate({ 
      desc, 
      img: imgUrl, 
      category: selectedCategories[0] || null,
      category2: selectedCategories[1] || null,
      category3: selectedCategories[2] || null,
      category4: selectedCategories[3] || null
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid image file.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className={`p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 ${
      theme === "dark" 
        ? "bg-gray-800/80 border border-gray-700/50" 
        : "bg-white border border-gray-200 shadow-md"
    }`}>
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 rounded-3xl"
          >
            <CheckCircle size={56} className="text-emerald-500 mb-2 animate-bounceIn" />
            <span className="text-lg font-bold text-white drop-shadow">Posted!</span>
          </motion.div>
        )}
      </AnimatePresence>
      {isAdmin ? (
        <form onSubmit={handleClick} className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <img
              src={currentUser.profilePic ? 
                (currentUser.profilePic.startsWith('http') ? 
                  currentUser.profilePic : 
                  currentUser.profilePic.startsWith('/upload/') ?
                    currentUser.profilePic :
                    `/upload/${currentUser.profilePic}`) 
                : "/default-profile.jpg"}
              alt="Profile"
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-offset-2 transition-all duration-200 ${
                theme === "dark" ? "ring-emerald-500" : "ring-teal-500"
              }`}
            />
            <div className="flex-1">
              <textarea
                placeholder={`What's on your mind, ${currentUser.name}?`}
                className={`w-full p-2 sm:p-3 rounded-xl sm:rounded-2xl outline-none resize-none text-sm sm:text-base font-medium transition-all duration-200 min-h-[40px] sm:min-h-[48px] max-h-24
                  ${theme === "dark"
                    ? "bg-gray-800/80 text-white placeholder-gray-400 focus:bg-gray-900"
                    : "bg-gray-100/50 text-gray-900 placeholder-gray-500 focus:bg-gray-100"
                  }`}
                onChange={(e) => setDesc(e.target.value)}
                value={desc}
                spellCheck="true"
                wrap="soft"
              />
            </div>
          </div>

          {/* Drag and Drop Image Upload */}
          <div
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-3 transition-all duration-200 cursor-pointer ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20"
                : theme === "dark"
                ? "border-gray-700 bg-gray-800/40 hover:border-emerald-500"
                : "border-gray-300 bg-gray-50 hover:border-emerald-400"
            }`}
            onClick={() => fileInputRef.current.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file"
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!file ? (
              <div className="flex flex-col items-center gap-1">
                <UploadCloud size={28} className="text-emerald-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Drag & drop or click to upload image</span>
              </div>
            ) : (
              <motion.div
                className="relative w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  className="w-full max-h-[180px] object-cover rounded-xl border-2 border-emerald-400 shadow-md"
                  alt="Preview"
                  src={URL.createObjectURL(file)}
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className={`absolute top-2 right-2 p-2 rounded-full bg-white/80 text-gray-900 hover:bg-red-500 hover:text-white shadow transition-all duration-200`}
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold mb-1">Categories (up to 4)</label>
            <div className="flex flex-wrap gap-2 sm:gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  disabled={selectedCategories.length >= 4 && !selectedCategories.includes(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 transition-all duration-200
                    ${selectedCategories.includes(cat)
                      ? cat === 'Student Life'
                        ? 'bg-blue-500 text-white border-blue-500 shadow'
                        : cat === 'Organization'
                        ? 'bg-purple-500 text-white border-purple-500 shadow'
                        : cat === 'Academics'
                        ? 'bg-orange-500 text-white border-orange-500 shadow'
                        : cat === 'Campus Services'
                        ? 'bg-teal-500 text-white border-teal-500 shadow'
                        : 'bg-gray-200 text-gray-700 border-gray-300'
                      : theme === "dark"
                      ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-emerald-600 hover:text-white"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-emerald-400 hover:text-white"
                    }`}
                >
                  {selectedCategories.includes(cat) && <Check size={14} className="mr-1" />}
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {selectedCategories.map((cat) => (
                <span key={cat}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm
                    ${cat === 'Student Life' ? 'bg-blue-100 text-blue-700' :
                      cat === 'Organization' ? 'bg-purple-100 text-purple-700' :
                      cat === 'Academics' ? 'bg-orange-100 text-orange-700' :
                      cat === 'Campus Services' ? 'bg-teal-100 text-teal-700' :
                      'bg-gray-200 text-gray-700'}
                  `}
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Share Button */}
          <div className="flex items-center justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSharing || !desc.trim() || selectedCategories.length === 0}
              type="submit"
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-bold text-base shadow-lg transition-all duration-200
                ${isSharing
                  ? "bg-gray-400 cursor-not-allowed"
                  : theme === "dark"
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                    : "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                }`}
            >
              <Send size={18} />
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </motion.button>
          </div>
        </form>
      ) : (
        <div className={`text-center py-6 rounded-3xl ${
          theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
        }`}>
          <p className="text-base opacity-70">
            Posting is restricted to <strong>admin users</strong> only.
          </p>
        </div>
      )}
    </div>
  );
};

export default Share;






