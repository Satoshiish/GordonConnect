import React, { useContext } from "react";
import { useTheme } from "../ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { AuthContext } from "../authContext";

function Rightbar() {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  // Check if the user is a guest
  const isGuest = currentUser?.role === "guest";

  // SUGGESTIONS
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

  // FOLLOW / UNFOLLOW
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

  // FRIENDS
  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await makeRequest.get("/users/friends");
      return res.data.map((f) => ({
        ...f,
        id: f.user_id,
      }));
    },
  });

  return (
    <div
      className={`rightbar flex-3 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar shadow-lg px-4 py-6 w-16 sm:w-64 md:w-72 lg:w-80 transition-all duration-300 ease-in-out flex-col hidden sm:block
      ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Suggestions */}
      <Section title="Suggestions For You" theme={theme}>
        {isGuest ? (
          <p className="text-gray-500">No suggestions for you, you're just a guest.</p>
        ) : (
          suggestions.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              theme={theme}
              buttons={
                <>
                  <button
                    onClick={() => handleFollowToggle(user.id)}
                    className={`px-2 sm:px-3 py-1 text-white rounded-md text-[10px] sm:text-xs md:text-sm transition ${
                      user.isFollowing
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={() => handleDismiss(user.id)}
                    className="bg-red-500 px-2 sm:px-3 py-1 text-white rounded-md text-[10px] sm:text-xs md:text-sm hover:bg-red-600 transition"
                  >
                    Dismiss
                  </button>
                </>
              }
            />
          ))
        )}
      </Section>

      {/* Friends */}
      <Section title="Friends" theme={theme}>
        {!isGuest ? (
          friends.map((friend) => (
            <UserCard
              key={friend.id}
              user={friend}
              activity="is your friend"
              time={friend.since}
              theme={theme}
            />
          ))
        ) : (
          <p className="text-gray-500">You have no friends yet.</p>
        )}
      </Section>
    </div>
  );
}

const Section = ({ title, children, theme }) => (
  <div className="container p-4 font-medium">
    <div
      className={`item p-4 rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-50"
      }`}
    >
      <span className="text-lg md:text-base sm:text-sm font-semibold">
        {title}
      </span>
      {children}
    </div>
  </div>
);

const UserCard = ({ user, activity, time, buttons, theme }) => (
  <div className="user flex items-center justify-between gap-2 sm:gap-3 my-4 flex-wrap">
    <div className="userInfo flex items-center gap-2 sm:gap-3">
      <img
        className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover"
        src={user.profilePic || "https://via.placeholder.com/40"}
        alt={user.name}
      />
      <p className="text-xs sm:text-sm">
        <span className="font-semibold">{user.name}</span> {activity}
      </p>
    </div>
    {time ? (
      <span
        className={`text-[10px] sm:text-xs ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {time}
      </span>
    ) : (
      <div className="buttons flex items-center gap-1 sm:gap-2">{buttons}</div>
    )}
  </div>
);

export default Rightbar;
