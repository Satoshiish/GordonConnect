import React from "react";
import { useTheme } from "../ThemeContext";
import Stories from "../Components/Stories";
import Posts from "../Components/Posts";
import Share from "../Components/Share";

function Home() {
  const { theme } = useTheme();

  return (
    <div className={`w-full ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="space-y-6">
        {/* Share Component */}
        <Share />
        
        {/* Posts Component */}
        <Posts />
      </div>
    </div>
  );
}

export default Home;
