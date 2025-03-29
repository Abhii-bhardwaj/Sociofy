import React, { useState, useEffect } from "react";
import PostCard from "./PostCard";
import SidePost from "./SidePost";
import CreatePost from "../modal/CreatePost"; // ✅ CreatePost import kiya
import useSidebarStore from "../store/useSidebarStore";
import { usePostStore } from "../store/usePostStore";

const MainContent = () => {
  const { isSidebarOpen } = useSidebarStore();
  const { posts, fetchPosts } = usePostStore();
  const [editPost, setEditPost] = useState(null); // ✅ State for edit mode

  useEffect(() => {
    fetchPosts(); // Page load pe posts fetch karo
  }, [fetchPosts]);

  // ✅ Handler for edit post
  const handleEditPost = (postData) => {
    setEditPost(postData); // Edit mode ke liye post data set karo
  };

  return (
    <div
      className={`flex flex-col lg:flex-row h-screen bg-base-100 overflow-auto px-2 md:px-8 transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : "md:ml-0"
      }`}>
      {/* Edit/Create Post Modal */}
      <CreatePost
        isOpen={!!editPost}
        onClose={() => setEditPost(null)}
        postToEdit={editPost}
      />

      {/* Left Section - Posts */}
      <div
        className={`w-full lg:w-3/5 p-4 overflow-y-auto scrollbar-hide h-screen transition-all duration-300 ${
          isSidebarOpen ? "md:w-2/3" : "md:w-full"
        }`}>
        <div className="space-y-4 mb-2 last:mb-16">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post._id}
                userId={post.user?._id}
                postId={post._id}
                images={post.postImage || []}
                userImage={post.user?.profilePic || "default-user-image.jpg"}
                userName={post.user?.username || "Unknown"}
                time={new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                content={post.caption}
                onEdit={handleEditPost} // ✅ Pass onEdit prop to PostCard
              />
            ))
          ) : (
            <p className="text-base-content/60">No posts available.</p>
          )}
        </div>
      </div>

      {/* Right Section - Side Posts */}
      <div className="hidden lg:block lg:w-2/5 p-4 overflow-y-auto scrollbar-hide h-full bg-base-100 m-auto border-l-4 border-base-300">
        <div className="space-y-4">
          <SidePost
            image="https://storage.googleapis.com/a1aa/image/55gR71C6xAAb4OBtMyDPDmumdrADOgzgIz-r8R17hAg.jpg"
            title="Side Post Title"
            content="This is a side post content."
          />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
