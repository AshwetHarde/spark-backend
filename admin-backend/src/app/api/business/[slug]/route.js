import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET(request, { params }) {
  try {
    const mongoose = await connectToDatabase();
    
    const { slug } = await params;
    
    // Use native MongoDB to get all raw data without Mongoose filtering
    const business = await mongoose.connection.collection('businesses').findOne({ slug: slug.toLowerCase() });

    if (!business) {
      return NextResponse.json({ success: false, message: "Business not found" }, { status: 404 });
    }

    const isExpired = business.planExpiry ? new Date(business.planExpiry) < new Date() : false;

    if (!business.isActive || isExpired) {
      return NextResponse.json({ 
        success: true, 
        active: false, 
        message: "Plan has expired" 
      }, { status: 200 });
    }

    // Get raw cards config from database
    const rawCards = business.cards?.map(card => ({
      type: card.type,
      order: card.order,
      enabled: card.enabled
    }))?.sort((a, b) => a.order - b.order) || [];

    // Build processed cards with URLs
    const processedCards = business.cards
      ?.filter(card => card.enabled)
      ?.sort((a, b) => a.order - b.order)
      ?.map(card => {
        const cardData = { type: card.type, order: card.order };
        
        switch(card.type) {
          case "map":
            // Only include map if mapLink exists and is not empty
            if (!business.mapLink || business.mapLink.trim() === "") return null;
            cardData.url = business.mapLink;
            break;
          case "google_reviews":
            // Handle both full URL and just place ID
            if (business.googleReviewId) {
              if (business.googleReviewId.includes('search.google.com')) {
                cardData.url = business.googleReviewId;
              } else {
                cardData.url = `https://search.google.com/local/writereview?placeid=${business.googleReviewId}`;
              }
            } else {
              cardData.url = null;
            }
            break;
          case "whatsapp":
            const waNumber = business.whatsappNumber || business.phone?.replace(/\D/g, '');
            const waMessage = encodeURIComponent(business.whatsappMessage || "Hi, I visited your store and would like to connect.");
            cardData.url = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : null;
            break;
          case "instagram":
            // Handle both full URL and just username
            if (business.instagramUsername) {
              if (business.instagramUsername.includes('instagram.com')) {
                cardData.url = business.instagramUsername;
              } else {
                cardData.url = `https://instagram.com/${business.instagramUsername.replace(/^@/, '')}`;
              }
            } else {
              cardData.url = null;
            }
            break;
          case "zomato":
            cardData.url = business.zomatoLink || null;
            break;
          case "swiggy":
            cardData.url = business.swiggyLink || null;
            break;
          case "upi":
            cardData.url = business.upiId ? `upi://pay?pa=${business.upiId}` : null;
            break;
          case "custom_link":
            cardData.url = business.customLink?.url || null;
            break;
          case "phone":
            cardData.url = business.phone ? `tel:${business.phone}` : null;
            break;
          case "email":
            cardData.url = business.email ? `mailto:${business.email}` : null;
            break;
        }
        
        return cardData;
      })?.filter(card => card && card.url) || [];

    return NextResponse.json({ 
      success: true, 
      active: true,
      id: business._id,
      slug: business.slug,
      name: business.name,
      description: business.description || "",
      logo: business.logo || "",
      
      // === Contact ===
      address: business.location || "",
      phone: business.phone || "",
      ...(business.plan !== "Basic" && { email: business.email || "" }),
      map: business.mapLink || "",
      
      // === Plan ===
      plan: business.plan || "Basic",
      planExpiry: business.planExpiry || null,
      
      // === Social ===
      social: (() => {
        const social = {};
        
        // Instagram
        if (business.instagramUsername) {
          social.instagram = business.instagramUsername.includes('instagram.com') 
            ? business.instagramUsername 
            : `https://instagram.com/${business.instagramUsername.replace(/^@/, '')}`;
        }
        
        // WhatsApp
        const waNumber = business.whatsappNumber || business.phone?.replace(/\D/g, '');
        if (waNumber) {
          social.whatsapp = {
            number: waNumber,
            message: business.whatsappMessage || "Hi, I'm interested in your business."
          };
        }
        
        // Google Review
        if (business.googleReviewId) {
          social.googleReview = business.googleReviewId.includes('search.google.com')
            ? business.googleReviewId
            : `https://search.google.com/local/writereview?placeid=${business.googleReviewId}`;
        }
        
        // Zomato
        if (business.zomatoLink) social.zomato = business.zomatoLink;
        
        // Swiggy
        if (business.swiggyLink) social.swiggy = business.swiggyLink;
        
        // UPI
        if (business.upiId) social.upiId = business.upiId;
        
        // Remove empty social fields
        Object.keys(social).forEach(key => {
          if (!social[key]) delete social[key];
        });
        
        return social;
      })(),
      
      // === Cards (display order) ===
      cards: processedCards
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
