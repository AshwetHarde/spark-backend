import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Business from "@/models/Business";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "ddpoxp7xi",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to delete Cloudinary image
async function deleteCloudinaryImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes("cloudinary")) return;
  
  try {
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete Cloudinary image:", error);
  }
}

// Helper to generate slug
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// Helper to extract Instagram username from input
function extractInstagramUsername(input) {
  if (!input) return "";
  input = input.trim();
  if (input.includes('instagram.com/')) {
    const match = input.match(/instagram\.com\/([^/?#]+)/);
    if (match) return match[1];
  }
  return input.replace(/^@/, '');
}

// Helper to extract Google Place ID from input
function extractGooglePlaceId(input) {
  if (!input) return "";
  input = input.trim();
  if (input.includes('placeid=')) {
    const match = input.match(/placeid=([^&]+)/);
    if (match) return match[1];
  }
  return input;
}

// POST - Create new business
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Generate slug from name if not provided
    const slug = body.slug || generateSlug(body.name);
    
    // Check if slug already exists
    const existing = await Business.findOne({ slug });
    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: "Business with this name/slug already exists" 
      }, { status: 409 });
    }
    
    // Generate QR code with correct URL format
    const businessUrl = `https://spark.aheadbox.com/${slug}`;
    const qrCodeImage = await QRCode.toDataURL(businessUrl, {
      color: { dark: '#000000', light: '#ffffff' },
      width: 300
    });

    // Create business document bypassing all validation
    const businessData = {
      name: body.name,
      slug,
      description: body.description || "",
      location: body.location || "",
      logo: body.logo || "",
      phone: body.phone || "",
      email: body.email || "",
      plan: body.plan || "Basic",
      planExpiry: body.planExpiry ? new Date(body.planExpiry) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      googleReviewId: extractGooglePlaceId(body.googleReviewId),
      mapLink: body.mapLink || "",
      instagramUsername: extractInstagramUsername(body.instagramUsername),
      whatsappNumber: body.whatsappNumber || body.phone?.replace(/\D/g, '') || "",
      whatsappMessage: body.whatsappMessage || `Hello ${body.name}, i saw your profile on spark`,
      swiggyLink: body.swiggyLink || "",
      zomatoLink: body.zomatoLink || "",
      upiId: body.upiId || "",
      customLink: body.customLink && typeof body.customLink === 'object' ? {
        url: body.customLink.url || "",
        label: body.customLink.label || "",
        icon: body.customLink.icon || ""
      } : { url: "", label: "", icon: "" },
      cards: body.cards || [],
      isActive: body.isActive !== false
    };

    // Use native MongoDB insert to bypass all validation
    const mongoose = await connectToDatabase();
    const result = await mongoose.connection.collection('businesses').insertOne(businessData);
    const newBusiness = { ...businessData, _id: result.insertedId };

    return NextResponse.json({ 
      success: true, 
      data: newBusiness,
      qrCode: qrCodeImage,
      url: businessUrl
    }, { status: 201 });  

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET - Get all businesses or check slug
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    
    // If slug param provided, check availability
    if (slug) {
      const existing = await Business.findOne({ slug });
      return NextResponse.json({ available: !existing }, { status: 200 });
    }
    
    const businesses = await Business.find({}).sort({ planExpiry: 1 });
    
    return NextResponse.json({ success: true, data: businesses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update business
export async function PUT(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 });
    }

    // Process smart fields if provided
    if (updateData.instagramUsername !== undefined) {
      updateData.instagramUsername = extractInstagramUsername(updateData.instagramUsername);
    }
    if (updateData.googleReviewId !== undefined) {
      updateData.googleReviewId = extractGooglePlaceId(updateData.googleReviewId);
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedBusiness }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete business
export async function DELETE(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 });
    }

    // Find business first to get image URLs
    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    // Delete associated Cloudinary images
    if (business.logo) {
      await deleteCloudinaryImage(business.logo);
    }
    
    // Delete QR code image if it exists
    if (business.qrCode) {
      await deleteCloudinaryImage(business.qrCode);
    }

    // Delete the business from database
    const deletedBusiness = await Business.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Business and associated images deleted successfully" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
