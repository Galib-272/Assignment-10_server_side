const express = require("express");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");

const router = express.Router();

// Apply admin protection to all routes in this file
router.use(verifyToken, verifyAdmin);

// Get All Tickets for Admin
router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
});

// Update Ticket Verification Status (Approve / Reject)
router.patch("/tickets/:id/status", async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    if (!["approved", "rejected", "pending"].includes(verificationStatus)) {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.verificationStatus = verificationStatus;
    // If rejected, ensure it cannot be advertised
    if (verificationStatus === "rejected") {
      ticket.isAdvertised = false;
    }

    await ticket.save();
    return res.json({ message: `Ticket status updated to ${verificationStatus}`, ticket });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update ticket status", error: error.message });
  }
});

// Toggle Ticket Advertisement (Max 6 tickets)
router.patch("/tickets/:id/advertise", async (req, res) => {
  try {
    const { isAdvertised } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (isAdvertised) {
      if (ticket.verificationStatus !== "approved") {
        return res.status(400).json({ message: "Only approved tickets can be advertised" });
      }

      const currentAdvCount = await Ticket.countDocuments({
        isAdvertised: true,
        verificationStatus: "approved",
      });

      if (currentAdvCount >= 6) {
        return res.status(400).json({ message: "Maximum 6 tickets can be advertised simultaneously" });
      }
    }

    ticket.isAdvertised = Boolean(isAdvertised);
    await ticket.save();

    return res.json({
      message: ticket.isAdvertised ? "Ticket advertised on homepage" : "Ticket removed from ads",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update advertisement status", error: error.message });
  }
});

// Delete Ticket
router.delete("/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete ticket", error: error.message });
  }
});

// Get All Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

// Update User Role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "vendor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user role", error: error.message });
  }
});

module.exports = router;
