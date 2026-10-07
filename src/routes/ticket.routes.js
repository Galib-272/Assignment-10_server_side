const express = require("express");
const Ticket = require("../models/Ticket");
const { verifyToken, verifyVendor } = require("../middlewares/auth");

const router = express.Router();

// Get Advertised Tickets (Homepage - max 6)
router.get("/advertised", async (req, res) => {
  try {
    const tickets = await Ticket.find({
      verificationStatus: "approved",
      isAdvertised: true,
    })
      .sort({ updatedAt: -1 })
      .limit(6);

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch advertised tickets", error: error.message });
  }
});

const mongoose = require("mongoose");
const User = require("../models/User");
const { findMockTicket, mockTicketsList } = require("../config/mockCatalogue");

// Get Latest Tickets (Homepage - 8 cards)
router.get("/latest", async (req, res) => {
  try {
    let tickets = await Ticket.find({ verificationStatus: "approved" })
      .sort({ createdAt: -1 })
      .limit(8);

    // If fewer than 6 tickets in DB, seed mock tickets into DB so they have real ObjectIds
    if (tickets.length < 6) {
      const defaultVendor = await User.findOne({ role: "vendor" });
      for (const m of mockTicketsList) {
        const exists = await Ticket.findOne({ title: m.title });
        if (!exists) {
          await Ticket.create({
            ...m,
            vendorId: defaultVendor?._id || undefined,
            vendorEmail: defaultVendor?.email || "vendor@ticketbari.com",
            vendorName: defaultVendor?.name || "Green Line Paribahan",
            verificationStatus: "approved",
            departureDate: new Date(Date.now() + 7 * 86400000),
          });
        }
      }
      tickets = await Ticket.find({ verificationStatus: "approved" })
        .sort({ createdAt: -1 })
        .limit(8);
    }

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch latest tickets", error: error.message });
  }
});

// Get Vendor's own tickets (Vendor Dashboard)
router.get("/my", verifyToken, verifyVendor, async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    const tickets = await Ticket.find({ vendorEmail }).sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vendor tickets", error: error.message });
  }
});

// Alias for /vendor
router.get("/vendor", verifyToken, verifyVendor, async (req, res) => {
  try {
    const vendorEmail = req.user.email;
    const tickets = await Ticket.find({ vendorEmail }).sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vendor tickets", error: error.message });
  }
});

// Vendor Toggle Own Ticket Advertisement
router.patch("/advertise/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { isAdvertised } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Vendors can only advertise their own tickets; admins can advertise any
    if (req.user.role !== "admin" && ticket.vendorEmail !== req.user.email) {
      return res.status(403).json({ message: "You can only advertise your own tickets" });
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


// Get All Approved Tickets with Filtering, Search, Sort & Pagination
router.get("/", async (req, res) => {
  try {
    const {
      search,
      from,
      to,
      transportType,
      minPrice,
      maxPrice,
      departureDate,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const query = { verificationStatus: "approved" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { from: { $regex: search, $options: "i" } },
        { to: { $regex: search, $options: "i" } },
      ];
    }

    if (from) query.from = { $regex: from, $options: "i" };
    if (to) query.to = { $regex: to, $options: "i" };
    if (transportType) query.transportType = transportType.toLowerCase();

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (departureDate) {
      const startOfDay = new Date(departureDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(departureDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.departureDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (sort === "price-asc" || sort === "asc" || sort === "low-to-high") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc" || sort === "desc" || sort === "high-to-low") {
      sortOption = { price: -1 };
    } else if (sort === "date-asc") {
      sortOption = { departureDate: 1 };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.json({
      tickets,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
});

// Get Single Ticket by ID
router.get("/:id", async (req, res) => {
  try {
    let ticket = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      ticket = await Ticket.findById(req.params.id);
    }
    if (!ticket) {
      const mock = findMockTicket(req.params.id);
      if (mock) {
        ticket = await Ticket.findOne({ title: mock.title });
        if (!ticket) {
          const defaultVendor = await User.findOne({ role: "vendor" });
          ticket = await Ticket.create({
            ...mock,
            vendorId: defaultVendor?._id || undefined,
            vendorEmail: defaultVendor?.email || "vendor@ticketbari.com",
            vendorName: defaultVendor?.name || "Green Line Paribahan",
            verificationStatus: "approved",
            departureDate: new Date(Date.now() + 7 * 86400000),
          });
        }
      }
    }
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching ticket", error: error.message });
  }
});

// Vendor Create Ticket
router.post("/", verifyToken, verifyVendor, async (req, res) => {
  try {
    const {
      title,
      from,
      to,
      transportType,
      price,
      departureDate,
      quantity,
      description,
      perks,
      image,
    } = req.body;

    if (!title || !from || !to || !transportType || !price || !departureDate || !quantity) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Only set vendorId if it's a real MongoDB ObjectId
    const mongoose = require("mongoose");
    const isValidObjectId = req.user.id && mongoose.Types.ObjectId.isValid(req.user.id);

    const newTicket = await Ticket.create({
      title,
      from,
      to,
      transportType: transportType.toLowerCase(),
      price: Number(price),
      departureDate: new Date(departureDate),
      quantity: Number(quantity),
      description: description || "",
      perks: Array.isArray(perks) ? perks : [],
      image: image || "",
      ...(isValidObjectId ? { vendorId: req.user.id } : {}),
      vendorEmail: req.user.email,
      vendorName: req.user.name || "Vendor",
      verificationStatus: "pending",
      isAdvertised: false,
    });

    return res.status(201).json({
      message: "Ticket created and submitted for verification",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ message: error.message || "Failed to create ticket", error: error.message });
  }
});

// Vendor Update Ticket
router.patch("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Ensure only the owner vendor or admin can update
    if (ticket.vendorEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to edit this ticket" });
    }

    const allowedUpdates = [
      "title",
      "from",
      "to",
      "transportType",
      "price",
      "departureDate",
      "quantity",
      "description",
      "perks",
      "image",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        ticket[field] = req.body[field];
      }
    });

    const updated = await ticket.save();
    return res.json({ message: "Ticket updated successfully", ticket: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update ticket", error: error.message });
  }
});

// Vendor Delete Ticket
router.delete("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.vendorEmail !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this ticket" });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    return res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete ticket", error: error.message });
  }
});

module.exports = router;
