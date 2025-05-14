import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import Leftbar from "./Components/Leftbar";
import Navbar from "./Components/Navbar";
import Auth from "./pages/Auth";
import Bookmarks from "./pages/Bookmarks";
import Events from "./pages/Events";
import Forum from "./pages/Forum";
import Home from "./pages/Home";
import People from "./pages/People";
import Profile from "./pages/Profile";
import Register from "./Pages/Register";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { AuthContext, AuthContextProvider } from "./authContext";

function Layout() {
  const { theme } = useTheme();
  const queryClient = new QueryClient();
  const [open, setOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <Navbar open={open} setOpen={setOpen} />
        <div className="flex pt-16">
          <Leftbar open={open} setOpen={setOpen} />
          <main
            className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-200 ${
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
  
  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If no user is logged in, redirect to auth page
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in, render the protected content
  return children;
};

// Public Route Component (for auth and register pages)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  
  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // If user is already logged in, redirect to home
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  // If no user is logged in, show the auth/register page
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
    path: "/register",
    element: (
      <PublicRoute>
        <Register />
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
    <AuthContextProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthContextProvider>
  );
}

export default App;
