import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Business from "@/models/Business";
import QRCode from "qrcode";

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    const formattedName = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const businessUrl = `https://${formattedName}.aheadbox.com`;

    const qrCodeImage = await QRCode.toDataURL(businessUrl, {
      color: {
        dark: body.themeColor || '#000000',
        light: '#ffffff'
      },
      width: 300
    });

    const newBusiness = await Business.create({
      ...body,
      expiryDate: body.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    });

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

export async function GET() {
  try {
    await connectToDatabase();
    
    const businesses = await Business.find({}).sort({ expiryDate: 1 });
    
    return NextResponse.json({ success: true, data: businesses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 });
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
