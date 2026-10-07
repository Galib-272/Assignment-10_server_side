const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Ticket = require("../models/Ticket");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// 1. Instant Pay (mark as paid directly with toast, without external redirect)
router.post("/pay-instant", verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId).populate("ticketId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Generate unique transaction ID
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const txId = `pi_${Date.now().toString(36).toUpperCase()}${randomSuffix}`;

    booking.status = "paid";
    booking.transactionId = txId;
    await booking.save();

    // Check if Payment entry already exists
    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        userId: booking.userId || (req.user && req.user.id) || null,
        userEmail: booking.userEmail || req.user.email,
        amount: booking.totalPrice,
        currency: "bdt",
        transactionId: txId,
        paymentMethod: "instant_pay",
        status: "succeeded",
      });
    } else {
      payment.status = "succeeded";
      payment.transactionId = txId;
      await payment.save();
    }

    return res.json({
      success: true,
      message: "Payment completed successfully",
      booking,
      payment,
      transactionId: txId,
    });
  } catch (error) {
    return res.status(500).json({ message: "Instant payment failed", error: error.message });
  }
});

// 2. Create Stripe Checkout Session (fallback if needed)
router.post("/create-checkout", verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId).populate("ticketId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const ticketTitle = booking.ticketId?.title || "Ticket Booking";

    const isRealStripe =
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder");

    if (isRealStripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "bdt",
              product_data: {
                name: ticketTitle,
                description: `Quantity: ${booking.quantity} seat(s)`,
              },
              unit_amount: Math.round(booking.totalPrice * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${clientUrl}/dashboard/payment/cancel?booking_id=${booking._id}`,
        customer_email: req.user.email,
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user.id || "",
        },
      });

      return res.json({ url: session.url, sessionId: session.id });
    } else {
      const mockTxId = `pi_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      booking.status = "paid";
      booking.transactionId = mockTxId;
      await booking.save();

      await Payment.create({
        bookingId: booking._id,
        userId: booking.userId,
        userEmail: booking.userEmail,
        amount: booking.totalPrice,
        currency: "bdt",
        transactionId: mockTxId,
        paymentMethod: "instant_pay",
        status: "succeeded",
      });

      return res.json({
        url: `${clientUrl}/dashboard/payment/success?session_id=${mockTxId}&booking_id=${booking._id}`,
        sessionId: mockTxId,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Payment creation failed", error: error.message });
  }
});

// 3. Confirm Payment
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const { bookingId, transactionId } = req.body;
    const booking = await Booking.findById(bookingId).populate("ticketId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const txId = transactionId || `pi_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    booking.status = "paid";
    booking.transactionId = txId;
    await booking.save();

    await Payment.create({
      bookingId: booking._id,
      userId: booking.userId,
      userEmail: booking.userEmail,
      amount: booking.totalPrice,
      currency: "bdt",
      transactionId: txId,
      paymentMethod: "instant_pay",
      status: "succeeded",
    });

    return res.json({ message: "Payment confirmed successfully", booking, transactionId: txId });
  } catch (error) {
    return res.status(500).json({ message: "Payment confirmation failed", error: error.message });
  }
});

// Helper to fetch and normalize transactions
async function getTransactionsForUser(user) {
  const role = user.role;
  const userEmail = user.email;

  let payments = [];
  let paidBookings = [];

  if (role === "admin") {
    payments = await Payment.find()
      .populate({ path: "bookingId", populate: { path: "ticketId" } })
      .sort({ createdAt: -1 });

    paidBookings = await Booking.find({ status: "paid" })
      .populate("ticketId")
      .sort({ updatedAt: -1 });
  } else if (role === "vendor") {
    const vendorTickets = await Ticket.find({ vendorEmail: userEmail }).select("_id");
    const ticketIds = vendorTickets.map((t) => t._id);

    paidBookings = await Booking.find({ ticketId: { $in: ticketIds }, status: "paid" })
      .populate("ticketId")
      .sort({ updatedAt: -1 });

    const bookingIds = paidBookings.map((b) => b._id);
    payments = await Payment.find({ bookingId: { $in: bookingIds } })
      .populate({ path: "bookingId", populate: { path: "ticketId" } })
      .sort({ createdAt: -1 });
  } else {
    // Normal user
    payments = await Payment.find({ userEmail })
      .populate({ path: "bookingId", populate: { path: "ticketId" } })
      .sort({ createdAt: -1 });

    paidBookings = await Booking.find({ userEmail, status: "paid" })
      .populate("ticketId")
      .sort({ updatedAt: -1 });
  }

  const map = new Map();

  // Add payments first
  for (const p of payments) {
    const key = p.transactionId || p._id.toString();
    const title =
      p.bookingId?.ticketId?.title ||
      p.bookingId?.title ||
      "Ticket Booking";
    map.set(key, {
      _id: p._id.toString(),
      transactionId: p.transactionId || `pi_${p._id}`,
      ticketTitle: title,
      amount: p.amount,
      date: p.createdAt,
      userEmail: p.userEmail,
      status: p.status || "succeeded",
      paymentMethod: p.paymentMethod || "instant_pay",
    });
  }

  // Add any paid bookings that might not have a separate Payment entry
  for (const b of paidBookings) {
    const txId = b.transactionId || `pi_${b._id.toString().substring(0, 10)}`;
    if (!map.has(txId)) {
      map.set(txId, {
        _id: b._id.toString(),
        transactionId: txId,
        ticketTitle: b.ticketId?.title || "Ticket Booking",
        amount: b.totalPrice,
        date: b.updatedAt || b.createdAt,
        userEmail: b.userEmail,
        status: "succeeded",
        paymentMethod: "instant_pay",
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 4. Combined Transaction History for Dashboard
router.get("/my-transactions", verifyToken, async (req, res) => {
  try {
    const list = await getTransactionsForUser(req.user);
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
  }
});

// 5. Alternate endpoint /my
router.get("/my", verifyToken, async (req, res) => {
  try {
    const list = await getTransactionsForUser(req.user);
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
});

// 6. Admin endpoint /all
router.get("/all", verifyToken, async (req, res) => {
  try {
    const list = await getTransactionsForUser({ ...req.user, role: "admin" });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch all transactions", error: error.message });
  }
});

module.exports = router;
