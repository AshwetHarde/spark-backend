import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ["google_reviews", "whatsapp", "map", "phone", "swiggy", "zomato", "instagram", "email", "upi", "custom_link"]
  },
  order: { type: Number, required: true },
  enabled: { type: Boolean, default: true },
  customData: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const BusinessSchema = new mongoose.Schema(
  {
    // Profile
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    location: { type: String },
    logo: { type: String },
    
    // Contact
    phone: { type: String },
    email: { type: String },
    
    // Plan
    plan: { 
      type: String, 
      enum: ["Basic", "Standard", "Premium"], 
      default: "Basic" 
    },
    planExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
    
    // Smart Social Fields (store minimal data, build URLs dynamically)
    googleReviewId: { type: String }, // Just the Place ID
    mapLink: { type: String }, // Google Maps URL
    instagramUsername: { type: String }, // Just the username (no @)
    
    // Direct Links
    whatsappNumber: { type: String },
    whatsappMessage: { type: String, default: "Hello {businessName}, i saw your profile on spark" },
    swiggyLink: { type: String },
    zomatoLink: { type: String },
    upiId: { type: String },
    customLink: { 
      type: mongoose.Schema.Types.Mixed,
      default: { url: "", label: "", icon: "" }
    },
    
    // Cards Configuration
    cards: [CardSchema]
  },
  { timestamps: true }
);

BusinessSchema.pre('save', function(next) {
  if (!this.cards || this.cards.length === 0) {
    const allCards = [
      { type: "google_reviews", order: 1, enabled: true },
      { type: "whatsapp", order: 2, enabled: true },
      { type: "map", order: 3, enabled: true },
      { type: "phone", order: 4, enabled: true },
      { type: "instagram", order: 5, enabled: false },
      { type: "swiggy", order: 6, enabled: false },
      { type: "zomato", order: 7, enabled: false },
      { type: "email", order: 8, enabled: false },
      { type: "upi", order: 9, enabled: false },
      { type: "custom_link", order: 10, enabled: false }
    ];
    
    if (this.plan === "Basic") {
      this.cards = allCards.filter(c => ["google_reviews", "whatsapp", "map", "phone"].includes(c.type));
    } else if (this.plan === "Standard") {
      this.cards = allCards.filter(c => ["google_reviews", "whatsapp", "map", "phone", "swiggy", "zomato", "instagram", "email"].includes(c.type));
    } else {
      this.cards = allCards;
    }
  }
  next();
});

// Instance methods to build smart URLs
BusinessSchema.methods.getGoogleReviewUrl = function() {
  if (!this.googleReviewId) return null;
  return `https://search.google.com/local/writereview?placeid=${this.googleReviewId}`;
};

BusinessSchema.methods.getInstagramUrl = function() {
  if (!this.instagramUsername) return null;
  const username = this.instagramUsername.replace(/^@/, '');
  return `https://instagram.com/${username}`;
};

BusinessSchema.methods.getWhatsAppUrl = function() {
  if (!this.whatsappNumber) return null;
  const number = this.whatsappNumber.replace(/\D/g, '');
  const message = (this.whatsappMessage || "Hello {businessName}, i saw your profile on spark").replace(/{businessName}/g, this.name);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const Business = mongoose.models.Business || mongoose.model("Business", BusinessSchema);

export default Business;