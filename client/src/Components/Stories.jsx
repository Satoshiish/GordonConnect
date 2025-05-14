import React, { useContext } from "react"; // ✅ Import useContext
import { AuthContext } from "../authContext"; // ✅ Ensure correct path

function Stories() {
  const { currentUser } = useContext(AuthContext); // ✅ Now useContext is defined

  const stories = [
    {
      id: 1,
      name: "John Doe",
      img: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/new-post-instagram-story-template-design-90026d9192e278b0731d7c7fd2a00c84_screen.jpg?ts=1637012761"
    },
    {
      id: 2,
      name: "Jane Doe",
      img: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/new-post-instagram-story-template-design-90026d9192e278b0731d7c7fd2a00c84_screen.jpg?ts=1637012761"
    },
    {
      id: 3,
      name: "Alice Smith",
      img: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/new-post-instagram-story-template-design-90026d9192e278b0731d7c7fd2a00c84_screen.jpg?ts=1637012761"
    },
    {
      id: 4,
      name: "Bob Johnson",
      img: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/new-post-instagram-story-template-design-90026d9192e278b0731d7c7fd2a00c84_screen.jpg?ts=1637012761"
    },
  ];

  return (
    <div className="stories flex gap-[10px] h-60 mb-[30px] relative z-0">
      {/* User's Story */}
      <div className="story flex-[1] rounded-xl overflow-hidden relative">
        <img
          className="w-full rounded-xl h-full object-cover"
          src={currentUser?.profilePic ? "/upload/" + currentUser.profilePic : "/default-profile.jpg"}
          alt=""
        />
        <button className="absolute bottom-12 left-2.5 text-white font-medium bg-blue-500 border-none rounded-full h-8 w-8 flex items-center justify-center shadow-lg cursor-pointer">
          +
        </button>
        <span className="absolute bottom-2.5 left-2.5 text-white font-medium">
          {currentUser?.name}
        </span>
      </div>

      {/* Other Stories */}
      {stories.map((story) => (
        <div key={story.id} className="story flex-[1] rounded-xl overflow-hidden relative">
          <img className="w-full h-full object-cover" src={story.img} alt="" />
          <span className="absolute bottom-2.5 left-2.5 text-white font-medium">
            {story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
export default Stories;
