import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();
    
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ 
        error: "ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set" 
      }, { status: 500 });
    }
    
    // Check existing admin
    const existingAdmin = await Admin.findOne({ username: adminUsername });
    
    if (existingAdmin) {
      // Update password to match current env var
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      
      return NextResponse.json({ 
        message: "Admin password updated to match current env vars",
        username: adminUsername
      });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await Admin.create({ 
      username: adminUsername, 
      password: hashedPassword 
    });

    return NextResponse.json({ 
      message: "Admin created successfully!",
      username: adminUsername
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
