const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to remote DB: ${error.message}`);
    console.warn("[MongoDB Info] Server will operate gracefully with mock fallback data if MongoDB is unreachable.");
  }
};

module.exports = connectDB;
