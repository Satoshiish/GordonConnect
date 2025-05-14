import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext } from "react";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";
import { UserX2, UserPlus, UserCheck } from "lucide-react";

function People() {
    const { currentUser } = useContext(AuthContext);
    const { theme } = useTheme();
    const queryClient = useQueryClient();

    const isGuest = currentUser?.role === "guest";

    // Fetch suggestions
    const { data: suggestions = [] } = useQuery({
        queryKey: ["suggestions"],
        queryFn: async () => {
        const res = await makeRequest.get("/users/suggestions");
        return res.data.map((user) => ({
            ...user,
            id: user.user_id,
        }));
        },
    });

    const followMutation = useMutation({
        mutationFn: async (userId) => {
        const user = suggestions.find((u) => u.id === userId);
        if (user?.isFollowing) {
            await makeRequest.delete(`/relationships?followedUserId=${userId}`);
        } else {
            await makeRequest.post("/relationships", { followedUserId: userId });
        }
        },
        onSuccess: () => {
        queryClient.invalidateQueries(["suggestions"]);
        },
    });

    const handleFollowToggle = (userId) => {
        followMutation.mutate(userId);
    };

    const handleDismiss = (userId) => {
        queryClient.setQueryData(["suggestions"], (old) =>
        old?.filter((u) => u.id !== userId)
        );
    };

    return (
        <div
        className={`min-h-screen px-4 py-8 transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
        >
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Suggestions For You</h1>

            {isGuest ? (
            <div className="text-gray-500 text-center">
                No suggestions for you, you're just a guest.
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {suggestions.map((user) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.03 }}
                    className={`relative p-6 rounded-2xl shadow-lg border transition-all duration-300 group
                    ${theme === "dark"
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                        : "bg-white border-gray-200 hover:bg-gray-50"}
                    `}
                >
                    {/* Dismiss Button */}
                    <button
                        onClick={() => handleDismiss(user.id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors z-10"
                        title="Dismiss"
                    >
                        <UserX2 size={18} />
                    </button>
                    <div className="flex flex-col items-center gap-3">
                        <img
                            className="w-20 h-20 rounded-full object-cover border-4 shadow-md mb-2"
                            src={user.profilePic ? `/upload/${user.profilePic}` : "/default-profile.jpg"}
                            alt={user.name}
                        />
                        <div className="text-center">
                            <p className="font-semibold text-lg">{user.name}</p>
                            {user.username && (
                                <p className="text-xs text-gray-400">@{user.username}</p>
                            )}
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleFollowToggle(user.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium mt-2 transition-all duration-200
                                ${user.isFollowing
                                    ? theme === "dark"
                                        ? "bg-emerald-700 text-white hover:bg-emerald-600"
                                        : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                    : theme === "dark"
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "bg-teal-500 hover:bg-teal-600 text-white"
                                }`}
                            title={user.isFollowing ? "Unfollow" : "Follow"}
                        >
                            {user.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                            {user.isFollowing ? "Following" : "Follow"}
                        </motion.button>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}

export default People;