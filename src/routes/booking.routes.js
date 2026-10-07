const express = require("express");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { verifyToken, verifyVendor } = require("../middlewares/auth");

const router = express.Router();

const mongoose = require("mongoose");
const { findMockTicket } = require("../config/mockCatalogue");

// Customer Book Ticket
router.post("/", verifyToken, async (req, res) => {
  try {
    const { ticketId, quantity, userImage: reqImage, ticketData, ticketTitle } = req.body;
    const qty = Number(quantity) || 1;

    if (!ticketId && !ticketTitle && !ticketData?.title) {
      return res.status(400).json({ message: "Ticket ID or details are required" });
    }

    let ticket = null;
    if (ticketId && mongoose.isValidObjectId(ticketId)) {
      ticket = await Ticket.findById(ticketId);
    }

    // If not found by ObjectId (e.g. mock-9, mock-1, or non-ObjectId ID)
    if (!ticket) {
      const searchTitle = ticketTitle || ticketData?.title || "";
      if (searchTitle) {
        ticket = await Ticket.findOne({ title: searchTitle });
      }
    }

    // If still not found, check mock catalogue or payload ticketData
    if (!ticket) {
      const mock = findMockTicket(ticketId) || (ticketTitle ? findMockTicket(ticketTitle) : null);
      const tData = ticketData || mock || {};
      const defaultVendor = await User.findOne({ role: "vendor" });

      ticket = await Ticket.create({
        title: tData.title || ticketTitle || "Express Ticket",
        from: tData.from || "Mymensingh",
        to: tData.to || "Dhaka",
        transportType: (tData.transportType || "bus").toLowerCase(),
        price: Number(tData.price) || 200,
        departureDate: tData.departureDate ? new Date(tData.departureDate) : new Date(Date.now() + 7 * 86400000),
        quantity: Math.max(50, Number(tData.quantity) || 50),
        description: tData.description || "Express journey with verified transport operators.",
        perks: Array.isArray(tData.perks) && tData.perks.length > 0 ? tData.perks : ["AC", "Comfortable Seating"],
        image: tData.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop",
        vendorId: defaultVendor?._id || undefined,
        vendorEmail: tData.vendorEmail || defaultVendor?.email || "vendor@ticketbari.com",
        vendorName: tData.vendorName || defaultVendor?.name || "Green Line Paribahan",
        verificationStatus: "approved",
        isAdvertised: false,
      });
    }

    if (ticket.quantity < qty) {
      return res.status(400).json({ message: "Insufficient seats available" });
    }

    const totalPrice = ticket.price * qty;

    // Safely handle userId — mock_token users and Google OAuth users may have null id
    const userIdValue = req.user.id && req.user.id !== "dev-user-id" ? req.user.id : undefined;
    const userImage = reqImage || (req.user && req.user.image) || "";

    const booking = await Booking.create({
      ticketId: ticket._id,
      userId: userIdValue,
      userEmail: req.user.email,
      userName: req.user.name || "Customer",
      userImage: userImage,
      vendorId: ticket.vendorId,
      quantity: qty,
      totalPrice,
      status: "pending",
    });

    // Reduce seat count
    ticket.quantity -= qty;
    await ticket.save();

    return res.status(201).json({
      message: "Booking request created successfully",
      booking,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
});

// Customer View My Bookings
router.get("/my", verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const bookings = await Booking.find({ userEmail })
      .populate("ticketId")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
});

// Vendor View Requested Bookings
router.get("/vendor", verifyToken, verifyVendor, async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    // Find all tickets belonging to this vendor
    const vendorTickets = await Ticket.find({ vendorEmail }).select("_id");
    const ticketIds = vendorTickets.map((t) => t._id);

    const bookings = await Booking.find({ ticketId: { $in: ticketIds } })
      .populate("ticketId")
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with user information (name, email, image) from User collection
    const userEmails = [...new Set(bookings.map((b) => b.userEmail).filter(Boolean))];
    const users = await User.find({ email: { $in: userEmails } }).select("name email image").lean();
    const userMap = new Map(users.map((u) => [u.email, u]));

    const enrichedBookings = bookings.map((b) => {
      const u = (b.userEmail && userMap.get(b.userEmail)) || (b.userId && typeof b.userId === "object" ? b.userId : {}) || {};
      const finalName = b.userName || u.name || (b.userId && b.userId.name) || "Customer";
      const finalEmail = b.userEmail || u.email || (b.userId && b.userId.email) || "";
      const finalImage = b.userImage || u.image || (b.userId && b.userId.image) || "";
      return {
        ...b,
        userName: finalName,
        userEmail: finalEmail,
        userImage: finalImage,
        userId: {
          _id: b.userId?._id || b.userId || u._id,
          name: finalName,
          email: finalEmail,
          image: finalImage,
        },
      };
    });

    return res.json(enrichedBookings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vendor bookings", error: error.message });
  }
});

// Vendor Accept or Reject Booking
router.patch("/:id/status", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status: must be accepted or rejected" });
    }

    const booking = await Booking.findById(req.params.id).populate("ticketId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure status is currently pending
    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Cannot change status of a booking that is already ${booking.status}` });
    }

    booking.status = status;
    await booking.save();

    // If rejected, refund the reserved seats back to ticket quantity
    if (status === "rejected" && booking.ticketId) {
      const ticket = await Ticket.findById(booking.ticketId._id);
      if (ticket) {
        ticket.quantity += booking.quantity;
        await ticket.save();
      }
    }

    return res.json({ message: `Booking marked as ${status}`, booking });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update booking status", error: error.message });
  }
});

// Customer Cancel Booking
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to cancel this booking" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Only pending bookings can be cancelled" });
    }

    // Restore tickets
    const ticket = await Ticket.findById(booking.ticketId);
    if (ticket) {
      ticket.quantity += booking.quantity;
      await ticket.save();
    }

    await Booking.findByIdAndDelete(req.params.id);
    return res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel booking", error: error.message });
  }
});

module.exports = router;
