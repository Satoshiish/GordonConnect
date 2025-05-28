import { createContext, useEffect, useState } from "react";
import { makeRequest } from "./axios";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (!token || !storedUser) {
          logout();
          return;
        }

        // Parse the stored user data
        const userData = JSON.parse(storedUser);
        
        // Set the user immediately from localStorage to prevent flashing
        setCurrentUser(userData);
        
        // Then verify with backend in background
        try {
          const res = await makeRequest.get("/auth/verify", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // If verification successful, update with latest user data
          if (res.data && res.data.user_id) {
            const updatedUserData = { ...res.data, token };
            setCurrentUser(updatedUserData);
            localStorage.setItem("user", JSON.stringify(updatedUserData));
          }
        } catch (verifyError) {
          console.error("Token verification failed:", verifyError);
          // Only logout if there's a clear auth error (401/403)
          if (verifyError.response && 
              (verifyError.response.status === 401 || 
               verifyError.response.status === 403)) {
            logout();
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line
  }, []);

  const login = async (inputs) => {
    try {
      const res = await makeRequest.post(
        "/auth/login",
        inputs,
        {
          withCredentials: true,
        }
      );
      const userData = res.data;
      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      return userData;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const register = async (inputs) => {
    try {
      const res = await makeRequest.post(
        "/auth/register",
        inputs,
        {
          withCredentials: true,
        }
      );
      const userData = res.data;
      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      return userData;
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  const updateUser = (updatedUserData) => {
    // Make sure we're updating the current user
    if (!currentUser) return;
    
    // Create a new user object with the updated data
    const updatedUser = {
      ...currentUser,
      ...updatedUserData
    };
    
    console.log("Updating current user in context:", updatedUser);
    
    // Update the current user in state
    setCurrentUser(updatedUser);
    
    // Also update in localStorage to persist across page refreshes
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const isAdmin = () => currentUser?.role === "admin";
  const isGuest = () => currentUser?.role === "guest";
  const isRegularUser = () => currentUser && !isAdmin() && !isGuest();

  // Permission check functions
  const canPost = () => !isGuest();
  const canComment = () => !isGuest();
  const canLike = () => !isGuest();
  const canBookmark = () => !isGuest();
  const canEdit = (ownerId) => !isGuest() && (isAdmin() || currentUser?.id === ownerId);
  const canDelete = (ownerId) => !isGuest() && (isAdmin() || currentUser?.id === ownerId);

  // Add this function to generate a guest token
  const generateGuestToken = () => {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const loginAsGuest = () => {
    const guestToken = generateGuestToken();
    const guestUser = {
      username: "Guest",
      email: "",
      role: "guest",
      id: guestToken,
    };
    setCurrentUser(guestUser);
    localStorage.setItem("user", JSON.stringify(guestUser));
    localStorage.setItem("token", guestToken); // Store the guest token
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        updateUser,
        isAdmin,
        isGuest,
        isRegularUser,
        loginAsGuest,
        logout,
        canComment,
        canLike,
        canBookmark,
        canPost,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
