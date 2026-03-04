import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "ddpoxp7xi",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    console.log("Environment check:", { 
      api_key: !!process.env.CLOUDINARY_API_KEY, 
      api_secret: !!process.env.CLOUDINARY_API_SECRET, 
      api_key_start: process.env.CLOUDINARY_API_KEY?.substring(0, 4), 
      api_secret_start: process.env.CLOUDINARY_API_SECRET?.substring(0, 4) 
    });
    
    // Validate Cloudinary config
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary credentials");
      return NextResponse.json(
        { success: false, error: "Server configuration error: Missing Cloudinary credentials" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Uploading file:", {
      name: file.name, 
      type: file.type, 
      size: file.size,
      isFile: file instanceof File
    });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max for compression)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudinary using upload_stream with buffer
    // Forces 300x300 square, aggressive compression, auto format (WebP/AVIF)
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "logo",
          resource_type: "image",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "auto" },
            { quality: "auto:low", fetch_format: "auto" },
            { flags: "force_strip" },
          ],
          public_id: `logo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log("Cloudinary upload success:", result.secure_url);

    // Return shorter URL format with proper extension
    const shortUrl = result.secure_url;

    return NextResponse.json({
      success: true,
      url: shortUrl,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
