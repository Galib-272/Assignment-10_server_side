const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// Create Stripe Checkout Session
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

    if (booking.status !== "accepted") {
      return res.status(400).json({ message: "Payment is only available for accepted bookings" });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const ticketTitle = booking.ticketId?.title || "Ticket Booking";

    // Check if real Stripe key is provided (starts with sk_test_ or sk_live_ and not placeholder)
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
              unit_amount: Math.round(booking.totalPrice * 100), // in poisha/cents
            },
            quantity: 1,
          },
        ],
        success_url: `${clientUrl}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: `${clientUrl}/dashboard/payment/cancel?booking_id=${booking._id}`,
        customer_email: req.user.email,
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user.id,
        },
      });

      return res.json({ url: session.url, sessionId: session.id });
    } else {
      // Graceful simulated checkout URL for demonstration
      const mockTxId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      
      // Update booking to paid for demo test
      booking.status = "paid";
      booking.transactionId = mockTxId;
      await booking.save();

      // Create payment log
      await Payment.create({
        bookingId: booking._id,
        userId: booking.userId,
        userEmail: booking.userEmail,
        amount: booking.totalPrice,
        currency: "bdt",
        transactionId: mockTxId,
        paymentMethod: "stripe_card",
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

// Confirm Payment
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const { bookingId, transactionId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "paid";
    booking.transactionId = transactionId || `TXN-${Date.now()}`;
    await booking.save();

    return res.json({ message: "Payment confirmed successfully", booking });
  } catch (error) {
    return res.status(500).json({ message: "Payment confirmation failed", error: error.message });
  }
});

// User's Payment History
router.get("/my", verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userEmail: req.user.email })
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payment history", error: error.message });
  }
});

module.exports = router;
