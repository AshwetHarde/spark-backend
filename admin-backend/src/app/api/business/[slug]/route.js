import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { slug } = await params;
    
    const searchName = slug.replace(/-/g, ' ');

    const business = await Business.findOne({ 
      name: { $regex: new RegExp(`^${searchName}$`, 'i') } 
    });

    if (!business) {
      return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
    }

    const isExpired = new Date(business.expiryDate) < new Date();

    if (!business.isActive || isExpired) {
      return NextResponse.json({ 
        success: true, 
        active: false, 
        message: "Plan has expired" 
      }, { status: 200 });
    }

    const plan = business.subscriptionPlan;
    
    const links = [
      {
        id: "location",
        label: "Location",
        url: business.locationLink,
        priority: business.locationLinkPriority || 1,
        icon: "mapPin",
        availableIn: ["Basic", "Standard", "Premium"]
      },
      {
        id: "googleMaps",
        label: "Google Maps",
        url: business.googleMapsLink,
        priority: business.googleMapsPriority || 2,
        icon: "map",
        availableIn: ["Basic", "Standard", "Premium"]
      },
      {
        id: "googleReview",
        label: "Google Review",
        url: business.googleReviewLink,
        priority: business.googleReviewPriority || 3,
        icon: "star",
        availableIn: ["Basic", "Standard", "Premium"]
      },
      {
        id: "call",
        label: "Call Us",
        url: business.phoneNumber ? `tel:${business.phoneNumber}` : null,
        priority: business.phonePriority || 4,
        icon: "phone",
        availableIn: ["Basic", "Standard", "Premium"]
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        url: business.whatsappLink,
        priority: business.whatsappPriority || 5,
        icon: "messageCircle",
        availableIn: ["Basic", "Standard", "Premium"]
      }
    ];

    if (plan !== "Basic") {
      links.push({
        id: "instagram",
        label: "Instagram",
        url: business.instaLink,
        priority: business.instaPriority || 6,
        icon: "instagram",
        availableIn: ["Standard", "Premium"]
      });
    }

    if (plan === "Standard" || plan === "Premium") {
      links.push(
        {
          id: "zomato",
          label: "Zomato",
          url: business.zomatoLink,
          priority: business.zomatoPriority || 7,
          icon: "utensils",
          availableIn: ["Standard", "Premium"]
        },
        {
          id: "swiggy",
          label: "Swiggy",
          url: business.swiggyLink,
          priority: business.swiggyPriority || 8,
          icon: "truck",
          availableIn: ["Standard", "Premium"]
        }
      );
    }

    if (plan === "Premium") {
      links.push(
        {
          id: "upi",
          label: "Pay via UPI",
          url: business.upiId ? `upi://pay?pa=${business.upiId}` : null,
          priority: business.upiPriority || 9,
          icon: "wallet",
          availableIn: ["Premium"]
        },
        {
          id: "custom",
          label: "Custom Link",
          url: business.customLink,
          priority: business.customLinkPriority || 10,
          icon: "link",
          availableIn: ["Premium"]
        }
      );
    }

    links.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({ 
      success: true, 
      active: true,
      plan: {
        name: plan,
        expiryDate: business.expiryDate,
        isExpired: false
      },
      business: {
        name: business.name,
        logoBase64: business.logoBase64,
        logoUrl: business.logoUrl,
        customTemplate: plan === "Premium" ? business.customTemplate : null
      },
      links: links.filter(link => link.url)
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
