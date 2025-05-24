import axios from "axios";
import { createContext, useEffect, useState } from "react";

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

        // Verify token with backend
        const res = await axios.get("http://localhost:8800/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data) {
          const userData = { ...res.data, token };
          setCurrentUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          logout();
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (inputs) => {
    try {
      const res = await axios.post(
        "http://localhost:8800/api/auth/login",
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
      const res = await axios.post(
        "http://localhost:8800/api/auth/register",
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

  const updateUser = (updatedData) => {
    setCurrentUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  const isAdmin = () => currentUser?.role === "admin";
  const isGuest = () => currentUser?.role === "guest";

  // Permission check functions
  const canComment = () => !isGuest();
  const canLike = () => !isGuest();
  const canBookmark = () => !isGuest();
  const canPost = () => !isGuest();
  const canEdit = () => !isGuest() && (isAdmin() || currentUser?.id === currentUser?.id);
  const canDelete = () => !isGuest() && (isAdmin() || currentUser?.id === currentUser?.id);

  const loginAsGuest = () => {
    const guestUser = {
      username: "Guest",
      email: "",
      role: "guest",
      id: "guest_" + Date.now(),
    };
    setCurrentUser(guestUser);
    localStorage.setItem("user", JSON.stringify(guestUser));
    localStorage.removeItem("token");
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
        isAdmin: isAdmin(),
        isGuest: isGuest(),
        loginAsGuest,
        logout,
        canComment: canComment(),
        canLike: canLike(),
        canBookmark: canBookmark(),
        canPost: canPost(),
        canEdit: canEdit(),
        canDelete: canDelete(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
