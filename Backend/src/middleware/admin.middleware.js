export const adminAuth = (req, res, next) => {
  try {
    // Check if user exists (set by protectRoute middleware)
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Authentication required" });
    }

    // Check if user is an admin
    if (req.user.role !== "admin") {
      console.log(
        `Access denied: User ${req.user.userId} with role ${req.user.role} attempted to access admin route`
      );
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    // User is an admin, proceed
    console.log(`Admin access granted: User ${req.user.userId}`);
    next();
  } catch (error) {
    console.error("Error in adminAuth middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
