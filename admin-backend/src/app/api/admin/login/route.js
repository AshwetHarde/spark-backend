import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // Add detailed logging for debugging
    console.log("Login attempt started");

    await connectToDatabase();
    console.log("Database connected successfully");

    const { username, password } = await request.json();
    console.log("Request body parsed:", { username });

    const admin = await Admin.findOne({ username });
    console.log("Admin lookup result:", admin ? "found" : "not found");

    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Generate proper JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key";
    console.log("JWT Secret available:", !!jwtSecret);

    const token = jwt.sign(
      { userId: admin._id, username: admin.username },
      jwtSecret,
      { expiresIn: "24h" }
    );

    console.log("JWT token generated successfully");

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token: token
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}
