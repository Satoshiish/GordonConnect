import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useContext, useState, useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import Leftbar from "./Components/Leftbar";
import Navbar from "./Components/Navbar";
import Auth from "./Pages/Auth";
import Bookmarks from "./Pages/Bookmarks";
import Events from "./Pages/Events";
import Forum from "./Pages/Forum";
import Home from "./Pages/Home";
import People from "./Pages/People";
import Profile from "./Pages/Profile";
import Register from "./Pages/Register";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { AuthContext, AuthContextProvider } from "./authContext";
import Reports from "./Pages/Reports";
import { Toaster } from 'react-hot-toast';

function Layout() {
  const { theme } = useTheme();
  const queryClient = new QueryClient();
  const [open, setOpen] = useState(true); // Default to open on web view
  
  // Set sidebar open by default only on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setOpen(true);
      } else {
        setOpen(false);
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <Navbar open={open} setOpen={setOpen} />
        <div className="flex pt-16 w-full min-h-[calc(100vh-4rem)]">
          <Leftbar open={open} setOpen={setOpen} />
          <main
            className={`flex-1 p-2 sm:p-4 md:p-6 lg:p-8 transition-all duration-200 ml-0 md:ml-16 ${
              open ? "md:ml-64" : "md:ml-16"
            } ${
              theme === "dark" ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  
  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route Component (for auth pages)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // For the register route, allow admins to access it even when logged in
  if (window.location.pathname === "/register" && currentUser?.role === "admin") {
    return children;
  }
  
  // For other public routes, redirect logged-in users to home
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/profile/:id", element: <Profile /> },
      { path: "/forum", element: <Forum /> },
      { path: "/events", element: <Events /> },
      { path: "/bookmarks", element: <Bookmarks /> },
      { path: "/people", element: <People /> },
      { 
        path: "/reports", 
        element: (
          <AdminRoute>
            <Reports />
          </AdminRoute>
        ) 
      },
      { 
        path: "/register", 
        element: (
          <AdminRoute>
            <Register adminMode={true} />
          </AdminRoute>
        ) 
      },
    ],
  },
  {
    path: "/auth",
    element: (
      <PublicRoute>
        <Auth />
      </PublicRoute>
    ),
  },
  {
    path: "/public/register",
    element: (
      <PublicRoute>
        <Register adminMode={false} />
      </PublicRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoute>
        <ResetPassword />
      </PublicRoute>
    ),
  },
  { path: "*", element: <Navigate to="/auth" replace /> },
]);

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AuthContextProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthContextProvider>
    </>
  );
}

export default App;













