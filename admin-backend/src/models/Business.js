import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    instaLink: { type: String },
    instaPriority: { type: Number, default: 5 },
    googleReviewLink: { type: String },
    googleReviewPriority: { type: Number, default: 2 },
    whatsappLink: { type: String },
    whatsappPriority: { type: Number, default: 3 },
    phoneNumber: { type: String },
    phonePriority: { type: Number, default: 4 },
    customLink: { type: String },
    customLinkPriority: { type: Number, default: 9 },
    logoBase64: { type: String },
    logoUrl: { type: String },
    themeColor: { type: String, default: "#000000" },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    subscriptionPlan: { type: String, enum: ["Basic", "Standard", "Premium"], default: "Basic" },
    locationLink: { type: String },
    locationLinkPriority: { type: Number, default: 1 },
    googleMapsLink: { type: String },
    googleMapsPriority: { type: Number, default: 2 },
    zomatoLink: { type: String },
    zomatoPriority: { type: Number, default: 6 },
    swiggyLink: { type: String },
    swiggyPriority: { type: Number, default: 7 },
    upiId: { type: String },
    upiPriority: { type: Number, default: 8 },
    customTemplate: { type: String },
  },
  { timestamps: true }
);

const Business = mongoose.models.Business || mongoose.model("Business", BusinessSchema);

export default Business;