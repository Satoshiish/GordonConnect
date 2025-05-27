import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../authContext";
import { makeRequest } from "../axios";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";
import { UserX2, UserPlus, UserCheck, Loader2, RefreshCw, Users, Sparkles, Shield } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://gordonconnect-production-f2bd.up.railway.app/api";

function People() {
    const { currentUser } = useContext(AuthContext);
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isGuest = currentUser?.role === "guest";
    const isAdmin = currentUser?.role === "admin";

    // Fetch only admin users for suggestions
    const { data: suggestions = [], isLoading, refetch, error } = useQuery({
        queryKey: ["admin-suggestions"],
        queryFn: async () => {
            try {
                // Modified to only fetch admin users
                const res = await makeRequest.get("/users/suggestions?adminOnly=true");
                console.log("Admin suggestions response:", res.data);
                
                // Filter to only include admin users if the backend doesn't do it
                const adminUsers = res.data.filter(user => user.role === "admin");
                
                return adminUsers.map((user) => ({
                    ...user,
                    id: user.user_id || user.id,
                }));
            } catch (error) {
                console.error("Error fetching admin suggestions:", error);
                return [];
            }
        },
        retry: 1,
        retryDelay: 1000,
    });

    // Handle refresh button click
    const handleRefreshSuggestions = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Follow mutation
    const followMutation = useMutation({
        mutationFn: async (userId) => {
            await makeRequest.post("/relationships", { followedUserId: userId });
            return userId;
        },
        onSuccess: (userId) => {
            // Remove the followed user from suggestions
            queryClient.setQueryData(["admin-suggestions"], (old) => {
                if (!old) return old;
                return old.filter(user => user.id !== userId);
            });
            
            // Invalidate related queries
            queryClient.invalidateQueries(["friends"]);
            queryClient.invalidateQueries(["relationship"]);
            queryClient.invalidateQueries(["followers"]);
            queryClient.invalidateQueries(["following"]);
        },
    });

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center">
                    <Shield className="mr-2 text-emerald-500" size={24} />
                    Admin Accounts
                </h1>
                <button
                    onClick={handleRefreshSuggestions}
                    className={`p-2 rounded-full transition-all duration-300 ${
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    }`}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <Loader2 size={22} className="animate-spin text-emerald-500" />
                    ) : (
                        <RefreshCw size={22} className="text-emerald-500" />
                    )}
                </button>
            </div>

            <div className={`mb-6 p-4 rounded-xl ${
                theme === "dark" ? "bg-gray-800/60 text-gray-300" : "bg-gray-100 text-gray-700"
            }`}>
                <p className="text-sm">
                    <strong>Note:</strong> Only admin users can create posts on the platform. Follow them to see their updates in your feed.
                </p>
            </div>

            {isLoading ? (
                <div className="text-center py-16">
                    <Loader2 size={40} className="animate-spin mx-auto mb-4 text-emerald-500" />
                    <p className="text-gray-500">Finding admin accounts...</p>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-gray-500 text-center py-16 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <Shield size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg">No admin accounts available to follow at the moment.</p>
                    <p className="text-sm mt-2">Try again later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-4 rounded-xl flex flex-col items-center ${
                                theme === "dark"
                                    ? "bg-gray-800/60 border border-gray-700/50"
                                    : "bg-white border border-gray-200 shadow-md"
                            }`}
                        >
                            <div className="relative">
                                <img
                                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-400 shadow-lg mb-2"
                                    src={user.profilePic ? 
                                        (user.profilePic.startsWith('http') ? 
                                        user.profilePic : 
                                        `${API_BASE_URL}${user.profilePic.startsWith('/') ? user.profilePic : `/${user.profilePic}`}`) 
                                        : "/default-profile.jpg"}
                                    alt={user.name}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full">
                                    <Shield size={16} />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mt-2">{user.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Admin</p>
                            {user.city && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    {user.city}
                                </p>
                            )}
                            <button
                                onClick={() => handleFollowToggle(user.id)}
                                disabled={followMutation.isPending}
                                className={`mt-auto w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                                    theme === "dark"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                }`}
                            >
                                {followMutation.isPending ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        <span>Follow</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default People;
