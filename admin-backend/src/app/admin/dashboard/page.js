"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SUBSCRIPTION_PLANS = [
  { value: "Basic", label: "Basic", color: "gray" },
  { value: "Standard", label: "Standard", color: "blue" },
  { value: "Premium", label: "Premium", color: "purple" },
];

// Link definitions with their plan requirements and default priorities
const LINK_FIELDS = [
  { name: "locationLink", label: "Location Pin URL", type: "url", minPlan: "Basic", defaultPriority: 1 },
  { name: "googleMapsLink", label: "Google Maps URL", type: "url", minPlan: "Basic", defaultPriority: 2 },
  { name: "googleReviewLink", label: "Google Review URL", type: "url", minPlan: "Basic", defaultPriority: 3 },
  { name: "phoneNumber", label: "Phone Number (10 digits)", type: "tel", minPlan: "Basic", defaultPriority: 4 },
  { name: "whatsappLink", label: "WhatsApp URL", type: "url", minPlan: "Basic", defaultPriority: 5 },
  { name: "instaLink", label: "Instagram URL", type: "url", minPlan: "Standard", defaultPriority: 6 },
  { name: "zomatoLink", label: "Zomato URL", type: "url", minPlan: "Standard", defaultPriority: 7 },
  { name: "swiggyLink", label: "Swiggy URL", type: "url", minPlan: "Standard", defaultPriority: 8 },
  { name: "upiId", label: "UPI ID (for payments)", type: "text", minPlan: "Premium", defaultPriority: 9 },
  { name: "customLink", label: "Custom Link", type: "url", minPlan: "Premium", defaultPriority: 10 },
];

export default function Dashboard() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestQr, setLatestQr] = useState(null);
  const [latestUrl, setLatestUrl] = useState("");
  const [editingBusiness, setEditingBusiness] = useState(null);

  // Form data for creating business - includes all possible link fields and their priorities
  const [formData, setFormData] = useState({
    name: "",
    subscriptionPlan: "Basic",
    locationLink: "",
    locationLinkPriority: 1,
    googleMapsLink: "",
    googleMapsPriority: 2,
    googleReviewLink: "",
    googleReviewPriority: 3,
    phoneNumber: "",
    phonePriority: 4,
    whatsappLink: "",
    whatsappPriority: 5,
    instaLink: "",
    instaPriority: 6,
    zomatoLink: "",
    zomatoPriority: 7,
    swiggyLink: "",
    swiggyPriority: 8,
    upiId: "",
    upiPriority: 9,
    customLink: "",
    customLinkPriority: 10,
  });

  // Form data for editing
  const [editFormData, setEditFormData] = useState({
    name: "",
    subscriptionPlan: "Basic",
    expiryDate: "",
    locationLink: "",
    locationLinkPriority: 1,
    googleMapsLink: "",
    googleMapsPriority: 2,
    googleReviewLink: "",
    googleReviewPriority: 3,
    phoneNumber: "",
    phonePriority: 4,
    whatsappLink: "",
    whatsappPriority: 5,
    instaLink: "",
    instaPriority: 6,
    zomatoLink: "",
    zomatoPriority: 7,
    swiggyLink: "",
    swiggyPriority: 8,
    upiId: "",
    upiPriority: 9,
    customLink: "",
    customLinkPriority: 10,
  });

  const [filters, setFilters] = useState({
    name: "",
    plan: "",
    status: "",
    expiryDate: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [editDragActive, setEditDragActive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spark_token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchBusinesses();
  }, [router]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/business");
      const data = await res.json();
      if (data.success) {
        setBusinesses(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priorityField, value) => {
    const numValue = parseInt(value) || 1;
    setFormData((prev) => ({ ...prev, [priorityField]: numValue }));
  };

  const handleEditPriorityChange = (priorityField, value) => {
    const numValue = parseInt(value) || 1;
    setEditFormData((prev) => ({ ...prev, [priorityField]: numValue }));
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getFilteredBusinesses = () => {
    return businesses.filter((biz) => {
      if (filters.name && !biz.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.plan && biz.subscriptionPlan !== filters.plan) return false;
      if (filters.status) {
        const isActive = filters.status === "active";
        if (biz.isActive !== isActive) return false;
      }
      if (filters.expiryDate) {
        const bizDate = new Date(biz.expiryDate).toISOString().split('T')[0];
        if (bizDate !== filters.expiryDate) return false;
      }
      return true;
    });
  };

  const getPlanLevel = (plan) => {
    const levels = { Basic: 1, Standard: 2, Premium: 3 };
    return levels[plan] || 1;
  };

  const getVisibleLinks = (plan) => {
    const planLevel = getPlanLevel(plan);
    return LINK_FIELDS.filter((link) => getPlanLevel(link.minPlan) <= planLevel);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleEditLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditLogoDragOver = (e) => {
    e.preventDefault();
    setEditDragActive(true);
  };

  const handleEditLogoDragLeave = (e) => {
    e.preventDefault();
    setEditDragActive(false);
  };

  const handleEditLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearEditLogo = () => {
    setEditLogoFile(null);
    setEditLogoPreview(null);
  };

  const uploadLogoToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to upload logo");
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = null;
      if (logoFile) {
        setLogoUploading(true);
        logoUrl = await uploadLogoToCloudinary(logoFile);
        setLogoUploading(false);
      }

      // Filter out empty values and prepare submission data
      const submitData = { 
        name: formData.name, 
        subscriptionPlan: formData.subscriptionPlan,
        logoUrl 
      };
      
      // Include link fields and their priorities if they have values
      LINK_FIELDS.forEach((field) => {
        const value = formData[field.name];
        const priorityValue = formData[`${field.name.replace('Link', '').replace('Id', '')}Priority`] || field.defaultPriority;
        if (value && value.trim()) {
          submitData[field.name] = value.trim();
          submitData[`${field.name.replace('Link', '').replace('Id', '')}Priority`] = priorityValue;
        }
      });

      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      
      if (data.success) {
        setLatestQr(data.qrCode);
        setLatestUrl(data.url);
        // Reset form
        setFormData({
          name: "",
          subscriptionPlan: "Basic",
          locationLink: "",
          locationLinkPriority: 1,
          googleMapsLink: "",
          googleMapsPriority: 2,
          googleReviewLink: "",
          googleReviewPriority: 3,
          phoneNumber: "",
          phonePriority: 4,
          whatsappLink: "",
          whatsappPriority: 5,
          instaLink: "",
          instaPriority: 6,
          zomatoLink: "",
          zomatoPriority: 7,
          swiggyLink: "",
          swiggyPriority: 8,
          upiId: "",
          upiPriority: 9,
          customLink: "",
          customLinkPriority: 10,
        });
        setLogoFile(null);
        setLogoPreview(null);
        fetchBusinesses();
      }
    } catch (error) {
      setLogoUploading(false);
      alert(error.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = null;
      if (editLogoFile) {
        setEditLogoUploading(true);
        logoUrl = await uploadLogoToCloudinary(editLogoFile);
        setEditLogoUploading(false);
      }

      const submitData = { 
        id: editingBusiness._id,
        name: editFormData.name,
        subscriptionPlan: editFormData.subscriptionPlan,
        expiryDate: editFormData.expiryDate,
      };

      // Include link fields and their priorities if they have values
      LINK_FIELDS.forEach((field) => {
        const value = editFormData[field.name];
        const priorityField = `${field.name.replace('Link', '').replace('Id', '')}Priority`;
        const priorityValue = editFormData[priorityField] || field.defaultPriority;
        if (value && value.trim()) {
          submitData[field.name] = value.trim();
          submitData[priorityField] = priorityValue;
        }
      });

      if (logoUrl) submitData.logoUrl = logoUrl;

      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      
      if (data.success) {
        setEditingBusiness(null);
        fetchBusinesses();
      } else {
        alert("Failed to update business: " + data.error);
      }
    } catch (error) {
      setEditLogoUploading(false);
      alert(error.message);
    }
  };

  const openEditModal = (business) => {
    setEditingBusiness(business);
    setEditFormData({
      name: business.name || "",
      subscriptionPlan: business.subscriptionPlan || "Basic",
      expiryDate: business.expiryDate ? new Date(business.expiryDate).toISOString().split('T')[0] : "",
      locationLink: business.locationLink || "",
      locationLinkPriority: business.locationLinkPriority || 1,
      googleMapsLink: business.googleMapsLink || "",
      googleMapsPriority: business.googleMapsPriority || 2,
      googleReviewLink: business.googleReviewLink || "",
      googleReviewPriority: business.googleReviewPriority || 3,
      phoneNumber: business.phoneNumber || "",
      phonePriority: business.phonePriority || 4,
      whatsappLink: business.whatsappLink || "",
      whatsappPriority: business.whatsappPriority || 5,
      instaLink: business.instaLink || "",
      instaPriority: business.instaPriority || 6,
      zomatoLink: business.zomatoLink || "",
      zomatoPriority: business.zomatoPriority || 7,
      swiggyLink: business.swiggyLink || "",
      swiggyPriority: business.swiggyPriority || 8,
      upiId: business.upiId || "",
      upiPriority: business.upiPriority || 9,
      customLink: business.customLink || "",
      customLinkPriority: business.customLinkPriority || 10,
    });
    
    if (business.logoUrl) {
      setEditLogoPreview(business.logoUrl);
    } else {
      setEditLogoPreview(null);
    }
    setEditLogoFile(null);
  };

  const closeEditModal = () => {
    setEditingBusiness(null);
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setEditLogoUploading(false);
  };

  const viewBusinessData = (business) => {
    const slug = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    window.open(`/api/business/${slug}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem("spark_token");
    router.push("/");
  };

  const renderLinkInputs = (data, onChange, onPriorityChange, plan, isEdit = false) => {
    const visibleLinks = getVisibleLinks(plan);
    
    return (
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-300">Business Links (with Priority)</label>
        <div className="space-y-3 rounded border border-gray-600 bg-gray-800/50 p-3">
          {visibleLinks.map((link) => {
            const priorityField = `${link.name.replace('Link', '').replace('Id', '')}Priority`;
            return (
              <div key={link.name} className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">{link.label}</label>
                  <input
                    type={link.type}
                    name={link.name}
                    placeholder={`Enter ${link.label.split('(')[0].trim()}`}
                    value={data[link.name] || ""}
                    onChange={(e) => {
                      if (link.name === "phoneNumber") {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        onChange({ target: { name: link.name, value: val } });
                      } else {
                        onChange(e);
                      }
                    }}
                    className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    maxLength={link.name === "phoneNumber" ? 10 : undefined}
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-gray-400">Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={data[priorityField] || link.defaultPriority}
                    onChange={(e) => onPriorityChange(priorityField, e.target.value)}
                    className="w-full rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none text-center"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Plan upgrade hints */}
        {plan === "Basic" && (
          <p className="text-xs text-gray-500">
            Upgrade to Standard for Instagram, Zomato, Swiggy
          </p>
        )}
        {plan === "Standard" && (
          <p className="text-xs text-gray-500">
            Upgrade to Premium for UPI payments and custom links
          </p>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p>Loading Spark...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mb-8 flex items-center justify-between border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">Spark by AheadBox</h1>
        <button onClick={handleLogout} className="rounded bg-red-600 px-4 py-2 font-bold transition hover:bg-red-700">Logout</button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Business Form */}
        <div className="col-span-1 rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold">Create New Business</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              name="name" 
              placeholder="Business Name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none" 
              required 
            />
            
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-300">Subscription Plan</label>
              <select
                name="subscriptionPlan"
                value={formData.subscriptionPlan}
                onChange={handleChange}
                className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none"
              >
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-300">Business Logo</label>
              {logoPreview ? (
                <div className="relative rounded border border-gray-600 bg-gray-800 p-4">
                  <div className="flex items-center space-x-4">
                    <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">{logoFile?.name}</p>
                      <button type="button" onClick={clearLogo} className="mt-2 text-sm text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleLogoDrop}
                  onDragOver={handleLogoDragOver}
                  onDragLeave={handleLogoDragLeave}
                  className={`relative cursor-pointer rounded border-2 border-dashed p-6 text-center transition ${
                    dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 bg-gray-800 hover:border-gray-500"
                  }`}
                >
                  <input type="file" accept="image/*" onChange={handleLogoFileSelect} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  <div className="pointer-events-none">
                    <svg className="mx-auto mb-2 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              )}
              {logoUploading && <p className="text-sm text-blue-400">Uploading logo...</p>}
            </div>
            
            {/* Dynamic Link Inputs with Priority */}
            {renderLinkInputs(formData, handleChange, handlePriorityChange, formData.subscriptionPlan)}

            <button type="submit" disabled={logoUploading} className="w-full rounded bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
              Generate QR & Save
            </button>
          </form>

          {latestQr && (
            <div className="mt-6 rounded-lg border border-gray-700 p-4 text-center">
              <h3 className="mb-2 text-lg font-bold text-green-400">Success!</h3>
              <p className="mb-2 text-sm text-gray-400">{latestUrl}</p>
              <img src={latestQr} alt="QR Code" className="mx-auto mb-4 h-48 w-48 rounded" />
              <a href={latestQr} download="spark-qr-code.png" className="block w-full rounded bg-green-600 p-2 font-bold text-white transition hover:bg-green-700">Download QR</a>
            </div>
          )}
        </div>

        {/* Business List */}
        <div className="col-span-1 lg:col-span-2 rounded-lg bg-gray-800 p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold">Active Subscriptions</h2>
          
          {/* Filters */}
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <input type="text" name="name" placeholder="Filter by name..." value={filters.name} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
            <select name="plan" value={filters.plan} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">All Plans</option>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <option key={plan.value} value={plan.value}>{plan.label}</option>
              ))}
            </select>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Expired</option>
            </select>
            <input type="date" name="expiryDate" value={filters.expiryDate} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-700 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredBusinesses().map((biz) => (
                  <tr key={biz._id} className="border-b border-gray-700 bg-gray-800">
                    <td className="px-4 py-3 font-medium text-white">{biz.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                        biz.subscriptionPlan === 'Premium' ? 'bg-purple-900 text-purple-300' : 
                        biz.subscriptionPlan === 'Standard' ? 'bg-blue-900 text-blue-300' : 
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {biz.subscriptionPlan || 'Basic'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${biz.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {biz.isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(biz.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button onClick={() => viewBusinessData(biz)} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-700">View</button>
                        <button onClick={() => openEditModal(biz)} className="rounded bg-yellow-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-yellow-700">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFilteredBusinesses().length === 0 && <p className="mt-4 text-center text-gray-500">No businesses found.</p>}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Business</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="text" name="name" placeholder="Business Name" value={editFormData.name} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none" required />
              
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-300">Subscription Plan</label>
                <select name="subscriptionPlan" value={editFormData.subscriptionPlan} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Dynamic Link Inputs with Priority for Edit */}
              {renderLinkInputs(editFormData, handleEditChange, handleEditPriorityChange, editFormData.subscriptionPlan, true)}
              
              <input type="date" name="expiryDate" placeholder="Expiry Date" value={editFormData.expiryDate} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none" />
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-300">Business Logo</label>
                {editLogoPreview ? (
                  <div className="relative rounded border border-gray-600 bg-gray-800 p-4">
                    <div className="flex items-center space-x-4">
                      <img src={editLogoPreview} alt="Logo Preview" className="h-20 w-20 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">{editLogoFile?.name || "Current logo"}</p>
                        <button type="button" onClick={clearEditLogo} className="mt-2 text-sm text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={handleEditLogoDrop}
                    onDragOver={handleEditLogoDragOver}
                    onDragLeave={handleEditLogoDragLeave}
                    className={`relative cursor-pointer rounded border-2 border-dashed p-6 text-center transition ${
                      editDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 bg-gray-800 hover:border-gray-500"
                    }`}
                  >
                    <input type="file" accept="image/*" onChange={handleEditLogoFileSelect} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    <div className="pointer-events-none">
                      <svg className="mx-auto mb-2 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </div>
                )}
                {editLogoUploading && <p className="text-sm text-blue-400">Uploading logo...</p>}
              </div>
              
              <div className="flex space-x-4">
                <button type="button" onClick={closeEditModal} className="flex-1 rounded bg-gray-600 p-3 font-bold text-white transition hover:bg-gray-700">Cancel</button>
                <button type="submit" className="flex-1 rounded bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700">Update Business</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
