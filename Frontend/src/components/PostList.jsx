import { useState, useEffect } from "react";
import axios from "../lib/axios";

const PostsList = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    axios.get(`/api/posts?page=${page}`).then((res) => setPosts(res.data));
  }, [page]);

  return (
    <div className="bg-base-100">
      {posts.map((post) => (
        <div key={post._id}>{post.content}</div>
      ))}
      <button onClick={() => setPage(page + 1)} className="btn btn-primary">
        Load More
      </button>
    </div>
  );
};

export default PostsList;
