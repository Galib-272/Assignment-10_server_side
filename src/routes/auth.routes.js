const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET || "super_secret_jwt_key_ticketbari_2026_exclusive",
    { expiresIn: "7d" }
  );
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const assignedRole = role === "vendor" ? "vendor" : "user";
    const newUser = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const token = generateToken(newUser);
    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Google OAuth Sync
router.post("/google", async (req, res) => {
  try {
    const { email, name, image } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        image: image || "",
        role: "user",
      });
    }

    const token = generateToken(user);
    return res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "OAuth failed", error: error.message });
  }
});

// Get Current User Profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.json({ ...req.user, isFraud: false });
    }
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      isFraud: user.isFraud || false,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

module.exports = router;
