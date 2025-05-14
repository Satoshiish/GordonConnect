import React from "react";
import { useTheme } from "../ThemeContext";
import Stories from "../Components/Stories";
import Posts from "../Components/Posts";
import Share from "../Components/Share";

function Home() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Share and Posts Section */}
      <div className="space-y-6">
        <Share />
        <Posts />
      </div>
    </div>
  );
}

export default Home;
