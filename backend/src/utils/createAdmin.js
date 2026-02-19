import mongoose from "mongoose";
import { User } from "../models/User.js";
import dotenv from "dotenv";
import { hashPassword } from "./auth.js";

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Fixed: hashPassword usage
    const hashedPassword = await hashPassword("password");

    const adminUser = new User({
      name: "Admin",
      email: "admin@campusconnect.com",
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdminUser();
