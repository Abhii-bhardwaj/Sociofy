// scripts/capitalizeFullNames.js
import mongoose from "mongoose";
import User from "./src/models/user.model.js";
import { connectDB } from "./src/lib/db.js"; // Assuming you have a DB connection file

// Function to capitalize fullName
const capitalizeFullName = (fullName) => {
  return fullName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Main function to update all users
async function updateFullNames() {
  try {
    // Connect to DB
    await connectDB();
    console.log("Connected to database");

    // Fetch all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Update each user's fullName
    for (const user of users) {
      const currentFullName = user.fullName;
      const capitalizedFullName = capitalizeFullName(currentFullName);

      if (currentFullName !== capitalizedFullName) {
        user.fullName = capitalizedFullName;
        await user.save();
        console.log(
          `Updated ${user.username}: ${currentFullName} → ${capitalizedFullName}`
        );
      } else {
        console.log(
          `${user.username} already has capitalized fullName: ${currentFullName}`
        );
      }
    }

    console.log("All fullNames updated successfully!");
  } catch (error) {
    console.error("Error updating fullNames:", error.message);
  } finally {
    // Close DB connection
    mongoose.connection.close();
  }
}

// Run the script
updateFullNames();
