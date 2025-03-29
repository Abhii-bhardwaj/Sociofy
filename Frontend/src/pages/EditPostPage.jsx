import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostStore } from "../store/usePostStore";
import toast from "react-hot-toast";

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, updatePost } = usePostStore();
  const [postData, setPostData] = useState({ content: "" });

  useEffect(() => {
    const post = posts.find((p) => p.id === id);
    if (post) setPostData(post);
  }, [id, posts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePost(id, postData);
    toast.success("Post updated!");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <form className="w-full max-w-lg p-6 shadow-md" onSubmit={handleSubmit}>
        <textarea
          className="textarea textarea-bordered w-full"
          value={postData.content}
          onChange={(e) =>
            setPostData({ ...postData, content: e.target.value })
          }
        />
        <button type="submit" className="btn btn-primary mt-4">
          Update Post
        </button>
      </form>
    </div>
  );
};

export default EditPostPage;
