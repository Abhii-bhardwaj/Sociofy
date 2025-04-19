import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import {
  FileText,
  Trash2,
  Search,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/admin/posts");

      // Handle the response which contains { posts, total, page, pages }
      if (response.data && Array.isArray(response.data.posts)) {
        setPosts(response.data.posts);
        setTotalPosts(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.pages || 1);
      } else {
        console.error("API didn't return the expected format:", response.data);
        setPosts([]); // Set to empty array as fallback
        toast.error("Received invalid data format from server");
        setError("Received invalid data format from server");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]); // Set to empty array on error
      toast.error("Failed to load posts");
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setDeleteLoading(postId);
      await axiosInstance.delete(`/admin/posts/${postId}`);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post._id !== postId)
      );
      setTotalPosts((prev) => prev - 1); // Decrease total post count
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Make sure we have an array before filtering
  const safePostsArray = Array.isArray(posts) ? posts : [];

  const filteredPosts = safePostsArray.filter(
    (post) =>
      post.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) // Added caption field
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6 p-6 bg-base-100 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-base-content">Manage Posts</h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search posts..."
              className="input input-bordered w-full pl-10 h-10 text-sm focus:outline-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchPosts}
            className="btn btn-square btn-sm btn-ghost"
            title="Refresh posts">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center h-64 w-full">
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-sm text-base-content/60">Loading posts...</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <div className="flex-1">
            <p>{error}</p>
          </div>
          <div className="flex-none">
            <button onClick={fetchPosts} className="btn btn-sm btn-outline">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="divider my-2"></div>
          <div className="stats shadow w-full mb-4">
            <div className="stat">
              <div className="stat-title">Total Posts</div>
              <div className="stat-value text-primary">
                {searchTerm ? filteredPosts.length : totalPosts}
              </div>
              <div className="stat-desc">
                {searchTerm
                  ? "Matching search criteria"
                  : `Page ${currentPage} of ${totalPages}`}
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-base-200 rounded-lg border border-base-300">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-base-content/30" />
                <h3 className="font-semibold text-lg">No posts found</h3>
                <p className="text-base-content/60 text-sm max-w-md">
                  {searchTerm
                    ? "Try adjusting your search terms or clear the search field"
                    : "There are no posts available at the moment"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredPosts.map((post, index) => (
                <div
                  key={post._id || index}
                  className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="card-body p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img
                              src={post.user?.profilePic || "/placeholder.jpeg"}
                              alt={post.user?.fullName || "User"}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">
                            {post.user?.fullName || "Unknown User"}
                          </div>
                          <div className="text-sm opacity-60">
                            @{post.user?.username || "unknown"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge badge-outline text-xs">
                          {post.createdAt
                            ? formatDate(post.createdAt)
                            : "Unknown date"}
                        </span>
                        <div className="dropdown dropdown-end">
                          <button
                            className="btn btn-error btn-outline btn-sm"
                            onClick={() => handleDeletePost(post._id)}
                            disabled={deleteLoading === post._id || !post._id}>
                            {deleteLoading === post._id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="divider my-2"></div>

                    <div className="mt-1">
                      <p className="whitespace-pre-line text-base-content">
                        {post.caption || post.text || "No content"}
                      </p>
                      {post.img && (
                        <div className="mt-4">
                          <img
                            src={post.img}
                            alt="Post"
                            className="rounded-lg max-h-80 object-cover w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-between items-center mt-4 pt-2 border-t border-base-300">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1 text-base-content/70">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">
                            {post.likes?.length || 0} likes
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-base-content/70">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-sm">
                            {post.replies?.length || 0} replies
                          </span>
                        </div>
                        {post.isFlagged && (
                          <div className="badge badge-warning">Flagged</div>
                        )}
                      </div>
                      <div className="text-xs text-base-content/50">
                        ID: {post._id || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagePosts;
