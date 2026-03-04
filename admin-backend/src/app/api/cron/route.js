import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    const now = new Date();
    
    const result = await Business.updateMany(
      { 
        expiryDate: { $lt: now },
        isActive: true 
      },
      { 
        $set: { isActive: false } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.modifiedCount 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}