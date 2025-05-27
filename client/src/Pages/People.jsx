import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";
import { UserX2, UserPlus, UserCheck, Loader2, RefreshCw, Users, Sparkles } from "lucide-react";
import { formatImageUrl } from "../utils/imageUtils";

function People() {
    const { currentUser } = useContext(AuthContext);
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isGuest = currentUser?.role === "guest";

    // Fetch suggestions with algorithm
    const { data: suggestions = [], isLoading, refetch, error } = useQuery({
        queryKey: ["suggestions"],
        queryFn: async () => {
            console.log("Token being sent:", localStorage.getItem("token"));
            try {
                const res = await makeRequest.get("/users/suggestions");
                console.log("Suggestions response:", res.data);
                return res.data.map((user) => ({
                    ...user,
                    id: user.user_id || user.id,
                }));
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                // Return empty array instead of throwing to prevent error state
                return [];
            }
        },
        retry: 1,
        retryDelay: 1000,
    });

    // Add error handling in the component
    useEffect(() => {
        if (error) {
            console.error("Suggestions query error:", error);
        }
    }, [error]);

    const followMutation = useMutation({
        mutationFn: async (userId) => {
            await makeRequest.post("/relationships", { followedUserId: userId });
            return userId; // Return the userId for use in onSuccess
        },
        onSuccess: (userId) => {
            // Remove the followed user from suggestions
            queryClient.setQueryData(["suggestions"], (old) => {
                if (!old) return old;
                return old.filter(user => user.id !== userId);
            });
            
            // Also invalidate other related queries
            queryClient.invalidateQueries(["friends"]);
            queryClient.invalidateQueries(["relationship"]);
            queryClient.invalidateQueries(["followers"]);
            queryClient.invalidateQueries(["following"]);
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

    const handleRefreshSuggestions = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 600); // Minimum animation time
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            {/* Enhanced Header Card */}
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
                                <Sparkles size={28} className={
                                    theme === "dark" ? "text-emerald-400" : "text-emerald-600"
                                } />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                                    Discover People
                                </h1>
                                <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                    Connect with people based on your interests and location
                                </p>
                            </div>
                        </div>
                        
                        {!isGuest && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRefreshSuggestions}
                                disabled={isLoading || isRefreshing}
                                className="px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md transition-all bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                            >
                                <RefreshCw 
                                    size={18} 
                                    className={`${isRefreshing ? "animate-spin" : ""}`} 
                                />
                                Refresh Suggestions
                            </motion.button>
                        )}
                    </div>
                    
                    {/* Algorithm Explanation */}
                    <div className={`mt-6 p-4 rounded-xl text-sm ${
                        theme === "dark" ? "bg-gray-700/50 text-gray-300" : "bg-gray-50 text-gray-700"
                    }`}>
                        <p className="flex items-center gap-2">
                            <Sparkles size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-500"} />
                            <span>Our algorithm suggests people based on your interests, location, and community engagement.</span>
                        </p>
                    </div>
                </div>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="relative z-10">
                    <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                    }`}>
                        Suggestions For You
                    </h2>
                    <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        People you might want to connect with
                    </p>
                </div>
            </div>
            
            {isGuest ? (
                <div className="text-gray-500 text-center py-16 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <Users size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg">No suggestions for you, you're just a guest.</p>
                </div>
            ) : isLoading ? (
                <div className="text-center py-16">
                    <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
                    <p className="text-gray-500">Finding people for you...</p>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-gray-500 text-center py-16 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <Users size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg">No suggestions available at the moment.</p>
                    <p className="text-sm mt-2">Try again later or explore categories.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {suggestions.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            whileHover={{ scale: 1.035 }}
                            className={`relative p-7 rounded-3xl shadow-2xl border transition-all duration-300 group
                            ${theme === "dark"
                                ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                : "bg-white border-gray-200 hover:bg-gray-50"}
                            `}
                        >
                            {/* Dismiss Button */}
                            <button
                                onClick={() => handleDismiss(user.id)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors z-10 shadow"
                                title="Dismiss"
                            >
                                <UserX2 size={16} />
                            </button>
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-400 shadow-lg mb-2"
                                    src={formatImageUrl(user.profilePic)}
                                    alt={user.name}
                                />
                                <div className="text-center">
                                    <p className="font-semibold text-lg mb-0.5">{user.name}</p>
                                    {user.username && (
                                        <p className="text-xs text-gray-400">@{user.username}</p>
                                    )}
                                    {user.city && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {user.city}
                                        </p>
                                    )}
                                    
                                    {/* Recommendation Reason */}
                                    <div className={`mt-2 px-3 py-1 rounded-full text-xs inline-block ${
                                        theme === "dark" ? "bg-gray-700 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                                    }`}>
                                        {user.reason || "Suggested for you"}
                                    </div>
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleFollowToggle(user.id)}
                                    disabled={followMutation.isLoading && followMutation.variables === user.id}
                                    className={`mt-2 w-full py-2 rounded-full flex items-center justify-center gap-2 transition-all ${
                                        user.isFollowing
                                            ? theme === "dark"
                                                ? "bg-gray-700 text-white"
                                                : "bg-gray-200 text-gray-800"
                                            : "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                                    }`}
                                >
                                    {followMutation.isLoading && followMutation.variables === user.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : user.isFollowing ? (
                                        <UserCheck size={18} />
                                    ) : (
                                        <UserPlus size={18} />
                                    )}
                                    {user.isFollowing ? "Following" : "Follow"}
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default People;
