const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    transportType: {
      type: String,
      required: true,
      enum: ["bus", "train", "plane", "launch"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    perks: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    vendorEmail: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
      default: "Vendor",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isAdvertised: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ verificationStatus: 1, isAdvertised: 1 });
ticketSchema.index({ from: "text", to: "text", title: "text" });

module.exports = mongoose.model("Ticket", ticketSchema);
