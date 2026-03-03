import User from "../Models/User.js";
import cloudinary from "../config/claudinary.js"

// ✅ GET PROFILE
export const getProfile = async (req, res) => {
  try {
    // 1. Find user and exclude password
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Build the avatar URL
    // If user.avatar is stored in DB as a full Cloudinary URL, use it.
    // If it's just a public_id, you'd need to format it, but usually, 
    // it's best to store the full URL.
    const profileAvatar = user.avatar ? user.avatar : null;

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: profileAvatar, 
      joined: user.createdAt,
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Error fetching profile from database" });
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