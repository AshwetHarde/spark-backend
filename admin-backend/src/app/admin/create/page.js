"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiStar, FiMessageCircle, FiMapPin, FiPhone, FiInstagram, FiTruck, FiCoffee, 
  FiMail, FiCreditCard, FiLink, FiUpload, FiCheck, FiX, FiArrowLeft, FiArrowRight,
  FiPlus, FiTrash2, FiGrid, FiLayers, FiSmartphone, FiExternalLink, FiPower
} from "react-icons/fi";

const PLAN_OPTIONS = [
  { value: "Basic", label: "Basic", color: "bg-gray-600", icon: FiGrid },
  { value: "Standard", label: "Standard", color: "bg-blue-600", icon: FiLayers },
  { value: "Premium", label: "Premium", color: "bg-purple-600", icon: FiStar },
];

const ALL_CARDS = [
  { type: "google_reviews", label: "Google Reviews", icon: FiStar, desc: "Collect customer reviews" },
  { type: "whatsapp", label: "WhatsApp", icon: FiMessageCircle, desc: "Direct messaging" },
  { type: "map", label: "Location Map", icon: FiMapPin, desc: "Show directions" },
  { type: "phone", label: "Call Button", icon: FiPhone, desc: "One-tap calling" },
  { type: "instagram", label: "Instagram", icon: FiInstagram, desc: "Social profile" },
  { type: "swiggy", label: "Swiggy", icon: FiTruck, desc: "Food delivery" },
  { type: "zomato", label: "Zomato", icon: FiCoffee, desc: "Restaurant profile" },
  { type: "email", label: "Email", icon: FiMail, desc: "Send emails" },
  { type: "upi", label: "UPI Payment", icon: FiCreditCard, desc: "Accept payments" },
  { type: "custom_link", label: "Custom Link", icon: FiLink, desc: "Any website" },
];

const LINK_FIELDS = [
  { key: "googleReviewId", label: "Google Reviews", icon: FiStar, placeholder: "Place ID or full URL", desc: "e.g., ChIJ6fWlMjYYyisR1ots5l_2mAE" },
  { key: "mapLink", label: "Google Maps", icon: FiMapPin, placeholder: "https://maps.google.com/...", desc: "Share your business location" },
  { key: "instagramUsername", label: "Instagram", icon: FiInstagram, placeholder: "@username or full URL", desc: "", plan: ["Standard", "Premium"] },
  { key: "whatsappNumber", label: "WhatsApp Number", icon: FiSmartphone, placeholder: "9876543210", desc: "Defaults to phone number" },
  { key: "whatsappMessage", label: "WhatsApp Message", icon: FiMessageCircle, placeholder: "Hi, I saw your Spark profile.", desc: "", isMessage: true },
  { key: "swiggyLink", label: "Swiggy", icon: FiTruck, placeholder: "https://swiggy.com/...", desc: "", plan: ["Standard", "Premium"] },
  { key: "zomatoLink", label: "Zomato", icon: FiCoffee, placeholder: "https://zomato.com/...", desc: "", plan: ["Standard", "Premium"] },
  { key: "upiId", label: "UPI ID", icon: FiCreditCard, placeholder: "business@upi", desc: "", plan: ["Premium"] },
  { key: "customLink", label: "Custom Link", icon: FiExternalLink, placeholder: "https://...", desc: "", plan: ["Premium"], isCustom: true },
];

const STEP_LABELS = ["Business Info", "Plan & Logo", "Links", "Cards", "Review"];

export default function CreateBusinessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestQr, setLatestQr] = useState(null);
  const [latestUrl, setLatestUrl] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    logo: "",
    phone: "",
    email: "",
    plan: "Basic",
    planExpiry: "",
    googleReviewId: "",
    mapLink: "",
    instagramUsername: "",
    whatsappNumber: "",
    whatsappMessage: "",
    swiggyLink: "",
    zomatoLink: "",
    upiId: "",
    customLink: { url: "", label: "" },
    cards: [],
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("spark_token");
    if (!token) { router.push("/"); return; }
    setDefaultCards("Basic", "");
  }, [router]);

  // Slug availability check
  const checkSlugAvailability = useCallback(async (slug) => {
    if (!slug || slug.length < 2) { setSlugAvailable(null); return; }
    setSlugChecking(true);
    try {
      const res = await fetch(`/api/business/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSlugAvailable(data.available);
    } catch (error) { console.error(error); }
    finally { setSlugChecking(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.slug) checkSlugAvailability(formData.slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.slug, checkSlugAvailability]);

  // Live slug generation from name
  const generateSlug = useCallback((name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  }, []);

  // Handle name change with live slug update
  const handleNameChange = (e) => {
    const name = e.target.value;
    const newSlug = slugEdited ? formData.slug : generateSlug(name);
    setFormData((prev) => ({
      ...prev,
      name,
      slug: newSlug,
      whatsappMessage: prev.plan === "Basic" 
        ? `Hi ${name || "{businessName}"}, I saw your Spark profile.` 
        : prev.whatsappMessage,
    }));
  };

  // Handle slug manual edit
  const handleSlugChange = (e) => {
    setSlugEdited(true);
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const setDefaultCards = (plan, businessName) => {
    const baseCards = [
      { type: "google_reviews", label: "Google Reviews", icon: FiStar, order: 1, enabled: true },
      { type: "whatsapp", label: "WhatsApp", icon: FiMessageCircle, order: 2, enabled: true },
      { type: "map", label: "Location Map", icon: FiMapPin, order: 3, enabled: true },
      { type: "phone", label: "Call Button", icon: FiPhone, order: 4, enabled: true },
    ];

    if (plan === "Basic") {
      setFormData((prev) => ({
        ...prev, plan,
        whatsappMessage: `Hi ${businessName || prev.name || "{businessName}"}, I saw your Spark profile.`,
        cards: baseCards,
      }));
    } else if (plan === "Standard") {
      setFormData((prev) => ({
        ...prev, plan,
        cards: [
          ...baseCards,
          { type: "instagram", label: "Instagram", icon: FiInstagram, order: 5, enabled: true },
          { type: "swiggy", label: "Swiggy", icon: FiTruck, order: 6, enabled: true },
          { type: "zomato", label: "Zomato", icon: FiCoffee, order: 7, enabled: true },
          { type: "email", label: "Email", icon: FiMail, order: 8, enabled: true },
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev, plan,
        cards: [
          ...baseCards,
          { type: "instagram", label: "Instagram", icon: FiInstagram, order: 5, enabled: true },
          { type: "swiggy", label: "Swiggy", icon: FiTruck, order: 6, enabled: true },
          { type: "zomato", label: "Zomato", icon: FiCoffee, order: 7, enabled: true },
          { type: "email", label: "Email", icon: FiMail, order: 8, enabled: true },
          { type: "upi", label: "UPI Payment", icon: FiCreditCard, order: 9, enabled: true },
          { type: "custom_link", label: "Custom Link", icon: FiLink, order: 10, enabled: true },
        ],
      }));
    }
  };

  const handlePlanChange = (e) => {
    const plan = e.target.value;
    setDefaultCards(plan, formData.name);
  };

  // Auto-correct card order when toggling
  const handleCardToggle = (cardType) => {
    setFormData((prev) => {
      const exists = prev.cards.find((c) => c.type === cardType);
      if (exists) {
        const remainingCards = prev.cards.filter((c) => c.type !== cardType);
        const reorderedCards = remainingCards.map((c, idx) => ({ ...c, order: idx + 1 }));
        return { ...prev, cards: reorderedCards };
      } else {
        const cardDef = ALL_CARDS.find((c) => c.type === cardType);
        return { ...prev, cards: [...prev.cards, { ...cardDef, order: prev.cards.length + 1, enabled: true }] };
      }
    });
  };

  // Handle manual order change with renumbering
  const handleCardOrderChange = (cardType, newOrder) => {
    const newOrderNum = parseInt(newOrder);
    setFormData((prev) => {
      const sortedCards = [...prev.cards].sort((a, b) => a.order - b.order);
      const cardIndex = sortedCards.findIndex((c) => c.type === cardType);
      if (cardIndex === -1) return prev;

      const [movedCard] = sortedCards.splice(cardIndex, 1);
      sortedCards.splice(newOrderNum - 1, 0, movedCard);

      const reorderedCards = sortedCards.map((c, idx) => ({ ...c, order: idx + 1 }));
      return { ...prev, cards: reorderedCards };
    });
  };

  // Drag-drop handlers for logo
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processLogoFile(file);
  };

  const processLogoFile = async (file) => {
    setIsUploading(true);
    // Upload to Cloudinary directly instead of compressing to base64
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, logo: data.url }));
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processLogoFile(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugAvailable === false) { alert("Please choose a different slug"); return; }
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        planExpiry: formData.planExpiry || (isClient ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : ""),
        whatsappNumber: formData.whatsappNumber || formData.phone?.replace(/\D/g, ""),
      };

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (data.success) {
        setLatestQr(data.qrCode);
        setLatestUrl(data.url);
        setFormData({
          name: "", slug: "", description: "", location: "", logo: "",
          phone: "", email: "", plan: "Basic", planExpiry: "",
          googleReviewId: "", mapLink: "", instagramUsername: "", whatsappNumber: "", whatsappMessage: "",
          swiggyLink: "", zomatoLink: "", upiId: "", customLink: { url: "", label: "" },
          cards: [],
        });
        setSlugEdited(false);
        setSlugAvailable(null);
        setCurrentStep(0);
        setDefaultCards("Basic", "");
      } else alert("Failed: " + data.error);
    } catch (error) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleLogout = () => { localStorage.removeItem("spark_token"); router.push("/"); };

  const isCardAvailable = (cardType) => {
    if (formData.plan === "Basic") return ["google_reviews", "whatsapp", "map", "phone"].includes(cardType);
    if (formData.plan === "Standard") return ["google_reviews", "whatsapp", "map", "phone", "swiggy", "zomato", "instagram", "email"].includes(cardType);
    return true;
  };

  const isLinkAvailable = (linkField) => {
    if (!linkField.plan) return true;
    return linkField.plan.includes(formData.plan);
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">Business Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleNameChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-lg text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:p-4"
                placeholder="e.g., Cafe Coffee Day" required />
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">Slug (URL) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 sm:left-4 sm:top-4">/</span>
                  <input type="text" name="slug" value={formData.slug} onChange={handleSlugChange}
                    className={`w-full rounded-lg border bg-gray-900 p-3 pl-8 text-white focus:outline-none text-sm sm:p-4 sm:text-base ${
                      slugAvailable === true ? "border-green-500 focus:border-green-500" :
                      slugAvailable === false ? "border-red-500 focus:border-red-500" :
                      "border-gray-600 focus:border-blue-500"
                    }`}
                    placeholder="auto-generated" required />
                  {slugChecking && <span className="absolute right-3 top-3 text-xs text-gray-500 sm:right-4 sm:top-4">Checking...</span>}
                  {slugAvailable === true && <span className="absolute right-3 top-3 text-green-500 sm:right-4 sm:top-4"><FiCheck /></span>}
                  {slugAvailable === false && <span className="absolute right-3 top-3 text-red-500 sm:right-4 sm:top-4"><FiX /></span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {slugAvailable === false ? "Slug already taken" : "Auto-updates from name. Click to customize."}
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white text-sm sm:p-4 sm:text-base"
                  placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-4 sm:text-base" rows="3"
                placeholder="Tell customers what makes your business special..." />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-300">Select Plan</label>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {PLAN_OPTIONS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button key={p.value} type="button" onClick={() => handlePlanChange({ target: { value: p.value } })}
                      className={`rounded-xl border-2 p-3 sm:p-4 text-left transition ${
                        formData.plan === p.value ? `border-blue-500 ${p.color} text-white` : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
                      }`}>
                      <div className="flex items-center justify-between">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        {formData.plan === p.value && <FiCheck className="text-blue-400" />}
                      </div>
                      <p className="mt-2 font-bold text-sm sm:text-base">{p.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-4 sm:text-base"
                placeholder="e.g., 123 Main Street, Mumbai" />
            </div>
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-300">Business Logo</label>
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition sm:p-8 ${
                  isDragging ? "border-blue-500 bg-blue-900/20" : "border-gray-600 bg-gray-900/50"
                }`}>
                {formData.logo ? (
                  <div className="flex flex-col items-center">
                    <img src={formData.logo} alt="Logo" className="h-20 w-20 rounded-xl object-cover shadow-lg sm:h-24 sm:w-24" />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                      className="mt-3 text-sm text-red-400 hover:text-red-300">Remove logo</button>
                  </div>
                ) : isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500 sm:h-10 sm:w-10"></div>
                    <p className="mt-2 text-gray-400 text-sm sm:text-base">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <FiUpload className="h-8 w-8 mb-2 text-gray-400 sm:h-10 sm:w-10" />
                    <p className="text-gray-400 text-sm sm:text-base">Drag and drop your logo here</p>
                    <p className="mt-1 text-sm text-gray-500">or</p>
                    <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="logo-upload" />
                    <label htmlFor="logo-upload" className="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm font-bold text-white hover:bg-gray-600">
                      Browse Files
                    </label>
                    <p className="mt-2 text-xs text-gray-500">Max 800x800px, auto-compressed</p>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">Plan Expiry</label>
              <input type="date" name="planExpiry" value={formData.planExpiry} onChange={handleChange}
                className="w-full rounded-lg border border-gray-600 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-4 sm:text-base" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-900/20 p-3 sm:p-4 border border-blue-500/30">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2 text-sm sm:text-base"><FiSmartphone /> Smart Links</h3>
              <p className="text-xs sm:text-sm text-gray-300">Paste full URLs or just IDs - we&apos;ll handle the rest!</p>
            </div>

            <div className="space-y-3">
              {LINK_FIELDS.filter(field => isLinkAvailable(field)).map((field) => {
                const Icon = field.icon;
                const value = formData[field.key];
                
                // WhatsApp Message field (special handling for Basic plan)
                if (field.isMessage) {
                  return (
                    <div key={field.key} className="rounded-xl border border-gray-600 bg-gray-800 p-3 sm:p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                        <label className="font-bold text-white text-sm sm:text-base">
                          {field.label}
                          {formData.plan === "Basic" && <span className="ml-2 text-xs text-yellow-500">(Auto)</span>}
                        </label>
                      </div>
                      {formData.plan === "Basic" ? (
                        <div className="rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-xs text-gray-300 sm:p-3 sm:text-sm">
                          &quot;Hi {'{businessName}'}, I saw your Spark profile.&quot;
                          <p className="mt-1 text-xs text-gray-500">Upgrade to customize</p>
                        </div>
                      ) : (
                        <input type="text" name={field.key} value={value} onChange={handleChange}
                          className="w-full rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-3 sm:text-base"
                          placeholder={field.placeholder} />
                      )}
                    </div>
                  );
                }
                
                // Custom Link field
                if (field.isCustom) {
                  return (
                    <div key={field.key} className="rounded-xl border border-gray-600 bg-gray-800 p-3 sm:p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                        <span className="font-bold text-white text-sm sm:text-base">{field.label}</span>
                      </div>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        <input type="url" value={formData.customLink.url}
                          onChange={(e) => setFormData((prev) => ({ ...prev, customLink: { ...prev.customLink, url: e.target.value } }))}
                          className="rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-3 sm:text-base"
                          placeholder={field.placeholder} />
                        <input type="text" value={formData.customLink.label}
                          onChange={(e) => setFormData((prev) => ({ ...prev, customLink: { ...prev.customLink, label: e.target.value } }))}
                          className="rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-3 sm:text-base"
                          placeholder="Link label" />
                      </div>
                    </div>
                  );
                }
                
                // Regular fields
                return (
                  <div key={field.key} className="rounded-xl border border-gray-600 bg-gray-800 p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                      <div className="flex-1">
                        <label className="block font-bold text-white text-sm sm:text-base">{field.label}</label>
                        {field.desc && <p className="text-xs text-gray-500 sm:text-sm">{field.desc}</p>}
                      </div>
                    </div>
                    <input type="text" name={field.key} value={value} onChange={handleChange}
                      className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-3 sm:text-base"
                      placeholder={field.placeholder} />
                  </div>
                );
              })}
            </div>

            {/* Email Field */}
            {(formData.plan === "Standard" || formData.plan === "Premium") && (
              <div className="rounded-xl border border-gray-600 bg-gray-800 p-3 sm:p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FiMail className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                  <label className="font-bold text-white text-sm sm:text-base">Email Address</label>
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 p-2.5 text-white focus:border-blue-500 focus:outline-none text-sm sm:p-3 sm:text-base"
                  placeholder="contact@business.com" />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-purple-900/20 p-3 sm:p-4 border border-purple-500/30">
              <h3 className="font-bold text-purple-400 flex items-center gap-2 text-sm sm:text-base"><FiGrid /> Display Cards</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">
                {formData.plan === "Basic" && "Basic includes: Google Reviews, WhatsApp, Map, Phone"}
                {formData.plan === "Standard" && "Standard adds: Instagram, Swiggy, Zomato, Email"}
                {formData.plan === "Premium" && "Premium adds: UPI Payment + Custom Link"}
              </p>
            </div>

            <div className="space-y-2">
              {formData.cards.map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <div key={card.type} className="flex items-center gap-3 rounded-xl border border-gray-600 bg-gray-800 p-3 sm:p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700 sm:h-10 sm:w-10">
                      <CardIcon className="h-4 w-4 text-gray-300 sm:h-5 sm:w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm sm:text-base truncate">{card.label}</p>
                      <p className="text-xs text-gray-400 sm:text-sm">{ALL_CARDS.find((c) => c.type === card.type)?.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 sm:text-sm">Order:</span>
                      <select value={card.order} onChange={(e) => handleCardOrderChange(card.type, e.target.value)}
                        className="rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-white text-xs sm:px-3 sm:py-2 sm:text-sm">
                        {formData.cards.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => handleCardToggle(card.type)}
                      className="rounded-lg bg-red-900/30 px-2 py-1.5 text-red-400 hover:bg-red-900/50 flex-shrink-0 sm:px-3 sm:py-2">
                      <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-gray-400">Available Cards</p>
              <div className="flex flex-wrap gap-2">
                {ALL_CARDS.filter((c) => isCardAvailable(c.type) && !formData.cards.find((ec) => ec.type === c.type)).map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <button key={card.type} type="button" onClick={() => handleCardToggle(card.type)}
                      className="flex items-center gap-2 rounded-full border border-gray-600 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500 hover:text-white sm:px-4 sm:py-2 sm:text-sm">
                      <CardIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <FiPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span>{card.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800 p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 sm:text-xl">Review Your Business</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400 text-sm sm:text-base">Name</span>
                  <span className="font-bold text-white text-sm sm:text-base truncate max-w-[50%] text-right">{formData.name || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400 text-sm sm:text-base">Slug</span>
                  <span className="font-mono text-blue-400 text-xs sm:text-sm">/{formData.slug || generateSlug(formData.name)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400 text-sm sm:text-base">Plan</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold sm:px-3 sm:py-1 ${
                    formData.plan === 'Premium' ? 'bg-purple-900 text-purple-300' : 
                    formData.plan === 'Standard' ? 'bg-blue-900 text-blue-300' : 
                    'bg-gray-700 text-gray-300'
                  }`}>{formData.plan}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400 text-sm sm:text-base">Cards</span>
                  <span className="text-white text-sm sm:text-base">{formData.cards.length} enabled</span>
                </div>
                {formData.logo && (
                  <div className="flex items-center gap-3 pt-2 sm:gap-4">
                    <span className="text-gray-400 text-sm sm:text-base">Logo</span>
                    <img src={formData.logo} alt="Logo" className="h-12 w-12 rounded-lg object-cover sm:h-16 sm:w-16" />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !formData.name || slugAvailable === false}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-lg font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:p-4 sm:text-base">
              {isSubmitting ? "Creating..." : "Create Business & Generate QR"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-4 text-white md:p-8">
      {!isClient ? null : (
        <>
          <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Create Business</h1>
            <nav className="hidden space-x-2 md:flex">
              <Link href="/admin/dashboard" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700">All Businesses</Link>
              <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Create New</span>
            </nav>
          </div>
          <button onClick={handleLogout} className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-600/30 sm:px-4 sm:py-2 sm:text-sm">
            <FiPower className="sm:hidden" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
        <nav className="flex space-x-2 sm:hidden mb-4">
          <Link href="/admin/dashboard" className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-700">All</Link>
          <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">Create</span>
        </nav>

      <div className="mb-6 mt-8 sm:mb-8 md:mt-12">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => (
            <button key={idx} type="button" onClick={() => setCurrentStep(idx)}
              className={`flex flex-1 flex-col items-center min-w-[40px] ${idx > 0 ? 'ml-1 sm:ml-2' : ''}`}>
              <div className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full font-bold transition text-xs ${
                idx === currentStep ? "bg-blue-600 text-white ring-2 ring-blue-500/20" :
                idx < currentStep ? "bg-green-600 text-white" : "bg-gray-800 text-gray-500"
              }`}>
                {idx < currentStep ? <FiCheck /> : idx + 1}
              </div>
              <span className={`mt-1 text-xs ${idx === currentStep ? "text-white" : "text-gray-500"} hidden sm:block`}>{label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 h-2 rounded-full bg-gray-800">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-2 sm:px-0">
        <form onSubmit={handleSubmit}>
          <div className="min-h-[400px] rounded-2xl border border-gray-700/50 bg-gray-800/50 p-4 backdrop-blur-sm sm:p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white sm:text-xl">{STEP_LABELS[currentStep]}</h2>
              <span className="text-xs text-gray-500 sm:text-sm">Step {currentStep + 1} of {STEP_LABELS.length}</span>
            </div>
            {renderStep()}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={prevStep} disabled={currentStep === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-700 px-4 py-2.5 font-bold text-white transition hover:bg-gray-600 disabled:opacity-30 text-sm sm:px-6 sm:py-3">
              <FiArrowLeft /> Previous
            </button>
            {currentStep < 4 && (
              <button type="button" onClick={nextStep}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white transition hover:bg-blue-700 text-sm sm:px-6 sm:py-3">
                Next <FiArrowRight />
              </button>
            )}
          </div>
        </form>

        {latestQr && (
          <div className="mt-8 rounded-2xl border-2 border-green-500/50 bg-gray-800 p-4 text-center shadow-2xl sm:p-8">
            <div className="mb-4 inline-flex rounded-full bg-green-500/20 p-3 sm:p-4">
              <FiCheck className="h-6 w-6 text-green-500 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-green-400 sm:text-2xl">Business Created!</h3>
            <p className="mb-6 text-gray-400">{latestUrl}</p>
            <img src={latestQr} alt="QR Code" className="mx-auto mb-6 h-64 w-64 rounded-xl shadow-lg" />
            <div className="flex gap-4">
              <a href={latestQr} download="qr-code.png" className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700">Download QR</a>
              <Link href="/admin/dashboard" className="flex-1 rounded-xl bg-gray-700 py-3 font-bold text-white hover:bg-gray-600">View All</Link>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
