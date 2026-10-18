
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

// User schema
const User = mongoose.model("User", {
  name: String,
  email: String
});

// Create user
app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB, then start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
