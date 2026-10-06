require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Ticket = require("./models/Ticket");
const Booking = require("./models/Booking");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // Ensure default users exist without deleting other users
    let admin = await User.findOne({ email: "admin@ticketbari.com" });
    if (!admin) {
      admin = await User.create({
        name: "System Admin",
        email: "admin@ticketbari.com",
        password: "admin123",
        role: "admin",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      });
    }

    let vendor1 = await User.findOne({ email: "vendor@ticketbari.com" });
    if (!vendor1) {
      vendor1 = await User.create({
        name: "Green Line Paribahan",
        email: "vendor@ticketbari.com",
        password: "vendor123",
        role: "vendor",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      });
    }

    let user1 = await User.findOne({ email: "user@ticketbari.com" });
    if (!user1) {
      user1 = await User.create({
        name: "Tanvir Ahmed",
        email: "user@ticketbari.com",
        password: "user123",
        role: "user",
        image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop",
      });
    }

    // Reset tickets & bookings with fresh sample data
    await Ticket.deleteMany({});
    await Booking.deleteMany({});

    // 2. Create Initial Tickets
    const tickets = await Ticket.create([
      {
        title: "Dhaka to Cox's Bazar Express Sleeper",
        from: "Dhaka",
        to: "Cox's Bazar",
        transportType: "bus",
        price: 1800,
        departureDate: new Date("2026-11-20T22:30:00Z"),
        quantity: 36,
        description: "Luxury sleeper coach with reclining ergonomic seats, onboard WiFi, and refreshments.",
        perks: ["AC", "WiFi", "Reclining Seats", "Complimentary Water"],
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: true,
      },
      {
        title: "Dhaka to Chittagong AC Train (Subarna)",
        from: "Dhaka",
        to: "Chittagong",
        transportType: "train",
        price: 750,
        departureDate: new Date("2026-12-10T07:00:00Z"),
        quantity: 120,
        description: "Fast intercity air-conditioned express train with panoramic window views and dining car access.",
        perks: ["AC", "Dining Car", "Power Outlets", "Spacious Legroom"],
        image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: true,
      },
      {
        title: "Dhaka to Saidpur Domestic Flight",
        from: "Dhaka",
        to: "Saidpur",
        transportType: "plane",
        price: 3800,
        departureDate: new Date("2026-12-05T14:00:00Z"),
        quantity: 50,
        description: "Rapid domestic direct flight. Quick 50-minute travel with baggage allowance included.",
        perks: ["In-flight Snack", "20kg Baggage", "Priority Boarding"],
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: true,
      },
      {
        title: "Dhaka to Barisal VIP Cabin Steamer",
        from: "Dhaka",
        to: "Barisal",
        transportType: "launch",
        price: 2200,
        departureDate: new Date("2026-11-28T20:00:00Z"),
        quantity: 24,
        description: "Overnight luxury river cruise in a private VIP cabin with double bed and en-suite washroom.",
        perks: ["VIP Cabin", "River View Balcony", "Breakfast Included"],
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: true,
      },
      {
        title: "Dhaka to Sylhet Green Deluxe",
        from: "Dhaka",
        to: "Sylhet",
        transportType: "bus",
        price: 900,
        departureDate: new Date("2026-11-25T08:00:00Z"),
        quantity: 40,
        description: "Comfortable morning coach through the scenic hills of Sylhet with charging ports.",
        perks: ["AC", "Charging Ports", "Entertainment Screen"],
        image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: true,
      },
      {
        title: "Chittagong to Cox's Bazar Coastal Express",
        from: "Chittagong",
        to: "Cox's Bazar",
        transportType: "train",
        price: 350,
        departureDate: new Date("2026-12-15T09:00:00Z"),
        quantity: 150,
        description: "Newly inaugurated coastal train journey straight to Cox's Bazar iconic oyster station.",
        perks: ["AC", "Large Windows", "Comfortable Seating"],
        image: "https://images.unsplash.com/photo-1721222339587-41f46a42fb11?q=80&w=800&auto=format&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: false,
      },
      {
        title: "Dhaka to Rajshahi Silk City Express",
        from: "Dhaka",
        to: "Rajshahi",
        transportType: "train",
        price: 520,
        departureDate: new Date("2026-11-18T14:30:00Z"),
        quantity: 90,
        description: "Regular intercity express traversing the Jamuna Multipurpose Bridge.",
        perks: ["Snack Service", "Air Conditioned"],
        image: "https://images.unsplash.com/photo-1568514328861-5465017e40fc?q=80&w=800&auto=format&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: false,
      },
      {
        title: "Dhaka to Jessore Novoair Direct",
        from: "Dhaka",
        to: "Jessore",
        transportType: "plane",
        price: 2800,
        departureDate: new Date("2026-12-08T11:00:00Z"),
        quantity: 45,
        description: "Fast morning domestic flight connecting Dhaka to south-western industrial hubs.",
        perks: ["Snacks", "Quick Check-in"],
        image: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=600&h=400&fit=crop",
        vendorId: vendor1._id,
        vendorEmail: vendor1.email,
        vendorName: vendor1.name,
        verificationStatus: "approved",
        isAdvertised: false,
      },
    ]);

    // 3. Create Sample Bookings for User
    await Booking.create([
      {
        ticketId: tickets[0]._id,
        userId: user1._id,
        userEmail: user1.email,
        userName: user1.name,
        vendorId: vendor1._id,
        quantity: 2,
        totalPrice: 3600,
        status: "accepted",
      },
      {
        ticketId: tickets[1]._id,
        userId: user1._id,
        userEmail: user1.email,
        userName: user1.name,
        vendorId: vendor1._id,
        quantity: 1,
        totalPrice: 750,
        status: "pending",
      },
    ]);

    console.log("Database seeded successfully with users, tickets, and bookings!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
