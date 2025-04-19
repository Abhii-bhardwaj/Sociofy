import { useEffect } from "react";
import { usePostStore } from "../../../store/usePostStore";
import PostCard from "../../PostCard"; // Adjust path as needed

const SavedPosts = () => {
  const { posts, fetchSavedPosts } = usePostStore();

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  const handleEditPost = (postData) => {
    console.log("Editing post:", postData); // Placeholder for edit logic
    // Add your edit post logic here (e.g., open a modal with postData)
  };

  return (
    <div className="p-4 w-full bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-base-content">Saved Posts</h2>
      {posts.length === 0 ? (
        <p className="text-base-content/60">No saved posts yet.</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              images={post.postImage || []}
              userId={post.user._id}
              userImage={post.user.profilePic || "/default-user.jpg"}
              userName={post.user.username || "Unknown"}
              time={new Date(post.createdAt).toLocaleString()}
              content={post.caption || ""}
              postId={post._id}
              onEdit={handleEditPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;
