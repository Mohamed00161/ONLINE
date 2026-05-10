import User from "../Models/User.js";
import cloudinary from "../config/claudinary.js"

// ✅ GET PROFILE
// ✅ GET PROFILE
export const getProfile = async (req, res) => {
  try {
    // Check if req.user exists first to avoid the 'null' error
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized: User context missing" });
    }

    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department, 
      category: user.category,     
      avatar: user.avatar || null, 
      joined: user.createdAt,
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// ✅ UPDATE PROFILE (Cloudinary Version)
// controllers/usercontroller.js
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body; // avatar is the base64 string from frontend
    let imageUrl = "";

    // 1. If user sent a new image, upload it to Cloudinary
    if (avatar && avatar.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(avatar, {
        folder: "fixit_profiles",
      });
      imageUrl = uploadRes.secure_url; // This is the 'https://res.cloudinary...' link
    }

    // 2. Update the user in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { 
        name: name,
        // Only update avatar if a new one was uploaded
        ...(imageUrl && { avatar: imageUrl }) 
      },
      { new: true } // This returns the updated document
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};