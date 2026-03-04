"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiPower, FiCheck } from "react-icons/fi";

const PLAN_OPTIONS = [
  { value: "Basic", label: "Basic", color: "bg-gray-600" },
  { value: "Standard", label: "Standard", color: "bg-blue-600" },
  { value: "Premium", label: "Premium", color: "bg-purple-600" },
];

const ALL_CARDS = [
  { type: "google_reviews", label: "Google Reviews", icon: "⭐" },
  { type: "whatsapp", label: "WhatsApp", icon: "💬" },
  { type: "map", label: "Location Map", icon: "📍" },
  { type: "phone", label: "Call Button", icon: "📞" },
  { type: "instagram", label: "Instagram", icon: "📷" },
  { type: "swiggy", label: "Swiggy", icon: "🛵" },
  { type: "zomato", label: "Zomato", icon: "🍽️" },
  { type: "email", label: "Email", icon: "📧" },
  { type: "upi", label: "UPI Payment", icon: "💳" },
  { type: "custom_link", label: "Custom Link", icon: "🔗" },
];

export default function Dashboard() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [filters, setFilters] = useState({ name: "", plan: "", status: "" });
  const [isDragging, setIsDragging] = useState(false);
  const [editQrCode, setEditQrCode] = useState(null);
  const [editBusinessUrl, setEditBusinessUrl] = useState("");
  const [isEditUploading, setIsEditUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spark_token");
    if (!token) { router.push("/"); return; }
    fetchBusinesses();
  }, [router]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/business");
      const data = await res.json();
      if (data.success) setBusinesses(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const getFilteredBusinesses = () => businesses.filter((biz) => {
    if (filters.name && !biz.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.plan && biz.plan !== filters.plan) return false;
    if (filters.status && biz.isActive !== (filters.status === "active")) return false;
    return true;
  });

  const openEditModal = (business) => {
    setEditingBusiness(business);
    setEditFormData({
      name: business.name || "",
      slug: business.slug || "",
      description: business.description || "",
      location: business.location || "",
      logo: business.logo || "",
      phone: business.phone || "",
      email: business.email || "",
      plan: business.plan || "Basic",
      planExpiry: business.planExpiry ? new Date(business.planExpiry).toISOString().split('T')[0] : "",
      isActive: business.isActive !== false,
      googleReviewId: business.googleReviewId || "",
      mapLink: business.mapLink || "",
      instagramUsername: business.instagramUsername || "",
      whatsappNumber: business.whatsappNumber || "",
      whatsappMessage: business.whatsappMessage || `Hello ${business.name}, i saw your profile on spark`,
      swiggyLink: business.swiggyLink || "",
      zomatoLink: business.zomatoLink || "",
      upiId: business.upiId || "",
      customLink: business.customLink || { url: "", label: "" },
      cards: business.cards || [],
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingBusiness._id, ...editFormData }),
      });
      const data = await res.json();
      if (data.success) {
        // Generate QR code for updated business
        const businessUrl = `https://spark.aheadbox.com/${editFormData.slug}`;
        const QRCode = (await import('qrcode')).default;
        const qrCodeImage = await QRCode.toDataURL(businessUrl, {
          color: { dark: '#000000', light: '#ffffff' },
          width: 200
        });
        setEditQrCode(qrCodeImage);
        setEditBusinessUrl(businessUrl);
        fetchBusinesses();
      } else alert("Failed: " + data.error);
    } catch (error) { alert(error.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this business?")) return;
    try {
      const res = await fetch(`/api/business?id=${id}`, { method: "DELETE" });
      if ((await res.json()).success) fetchBusinesses();
    } catch (error) { alert(error.message); }
  };

  const handleLogout = () => { localStorage.removeItem("spark_token"); router.push("/"); };
  const closeEditModal = () => { 
    setEditingBusiness(null); 
    setEditFormData(null); 
    setIsDragging(false);
    setEditQrCode(null);
    setEditBusinessUrl("");
  };

  // Logo upload handlers for edit modal
  const handleEditDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleEditDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleEditDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processEditLogoFile(file);
  };

  const processEditLogoFile = async (file) => {
    setIsEditUploading(true);
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
        setEditFormData((prev) => ({ ...prev, logo: data.url }));
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setIsEditUploading(false);
    }
  };

  const handleEditFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processEditLogoFile(file);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white sm:p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-2xl font-bold sm:text-3xl">All Businesses</h1>
            <nav className="hidden space-x-2 md:flex">
              <span className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white">All Businesses</span>
              <Link href="/admin/create" className="rounded bg-gray-700 px-4 py-2 text-sm font-bold text-white hover:bg-gray-600">Create New</Link>
            </nav>
          </div>
          <button onClick={handleLogout} className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-700 sm:px-4 sm:py-2 sm:text-sm">
            <FiPower className="sm:hidden" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
        <nav className="flex space-x-2 sm:hidden mb-4">
          <span className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">All</span>
          <Link href="/admin/create" className="rounded bg-gray-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-600">Create</Link>
        </nav>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input type="text" name="name" placeholder="Filter by name..." value={filters.name} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-800 p-2.5 text-white text-sm sm:p-3" />
        <select name="plan" value={filters.plan} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-800 p-2.5 text-white text-sm sm:p-3">
          <option value="">All Plans</option>
          {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded border border-gray-700 bg-gray-800 p-2.5 text-white text-sm sm:p-3">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Link href="/admin/create" className="rounded bg-green-600 p-2.5 text-center font-bold text-white hover:bg-green-700 text-sm sm:p-3 lg:col-span-2">+ Create Business</Link>
      </div>

      <div className="rounded-lg bg-gray-800 shadow-lg">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
              <tr><th className="px-6 py-4">Business</th><th className="px-6 py-4">Plan</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Expiry</th><th className="px-6 py-4">Cards</th><th className="px-6 py-4">Actions</th></tr>
            </thead>
            <tbody>
              {getFilteredBusinesses().map((biz) => (
                <tr key={biz._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{biz.name}</div>
                    <div className="text-xs text-gray-500">/{biz.slug}</div>
                    {biz.phone && <div className="text-xs text-gray-400">{biz.phone}</div>}
                  </td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${biz.plan === 'Premium' ? 'bg-purple-900 text-purple-300' : biz.plan === 'Standard' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>{biz.plan || 'Basic'}</span></td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${biz.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{biz.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4">{new Date(biz.planExpiry).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><span className="text-xs text-gray-400">{biz.cards?.length || 0} cards</span></td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => window.open(`/api/business/${biz.slug}`, '_blank')} className="rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">View</button>
                      <button onClick={() => openEditModal(biz)} className="rounded bg-yellow-600 px-3 py-2 text-xs font-bold text-white hover:bg-yellow-700">Edit</button>
                      <button onClick={() => handleDelete(biz._id)} className="rounded bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3 p-4">
          {getFilteredBusinesses().map((biz) => (
            <div key={biz._id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">{biz.name}</h3>
                  <p className="text-xs text-gray-500">/{biz.slug}</p>
                  {biz.phone && <p className="text-xs text-gray-400 mt-1">{biz.phone}</p>}
                </div>
                <div className="flex flex-col gap-1 ml-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${biz.plan === 'Premium' ? 'bg-purple-900 text-purple-300' : biz.plan === 'Standard' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>{biz.plan || 'Basic'}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${biz.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{biz.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-400">Expiry:</span>
                  <span className="ml-1 text-gray-300">{new Date(biz.planExpiry).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Cards:</span>
                  <span className="ml-1 text-gray-300">{biz.cards?.length || 0}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => window.open(`/api/business/${biz.slug}`, '_blank')} className="flex-1 rounded bg-blue-600 px-2 py-2 text-xs font-bold text-white hover:bg-blue-700">View</button>
                <button onClick={() => openEditModal(biz)} className="flex-1 rounded bg-yellow-600 px-2 py-2 text-xs font-bold text-white hover:bg-yellow-700">Edit</button>
                <button onClick={() => handleDelete(biz._id)} className="flex-1 rounded bg-red-600 px-2 py-2 text-xs font-bold text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingBusiness && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-gray-800 p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold sm:text-xl">Edit Business</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Business Name</label>
                  <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Slug</label>
                  <input type="text" name="slug" value={editFormData.slug} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Plan</label>
                  <select name="plan" value={editFormData.plan} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3">
                    {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
                  <textarea name="description" value={editFormData.description} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" rows="2" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Location</label>
                  <input type="text" name="location" value={editFormData.location} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Phone</label>
                  <input type="text" name="phone" value={editFormData.phone} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                {(editFormData.plan === "Standard" || editFormData.plan === "Premium") && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-300">Logo</label>
                  <div
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                    className={`flex flex-col sm:flex-row items-center justify-between rounded-lg border-2 border-dashed p-3 transition gap-3 ${
                      isDragging ? "border-blue-500 bg-blue-900/20" : "border-gray-600 bg-gray-900/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input type="file" accept="image/*" onChange={handleEditFileInput} className="hidden" id="edit-logo-upload" />
                      <label htmlFor="edit-logo-upload" className="cursor-pointer rounded bg-gray-700 px-3 py-2 text-xs font-bold text-white hover:bg-gray-600 sm:text-sm">
                        Choose File
                      </label>
                      <span className="text-xs text-gray-400 sm:text-sm">or drag and drop</span>
                    </div>
                    {isEditUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-blue-500"></div>
                        <span className="text-xs text-gray-400">Uploading...</span>
                      </div>
                    ) : editFormData?.logo ? (
                      <img src={editFormData.logo} alt="Logo" className="h-10 w-10 rounded object-cover" />
                    ) : null}
                  </div>
                </div>
                {(editFormData.plan === "Standard" || editFormData.plan === "Premium") && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Instagram Username</label>
                    <input type="text" name="instagramUsername" value={editFormData.instagramUsername} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Google Review ID</label>
                  <input type="text" name="googleReviewId" value={editFormData.googleReviewId} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Location Address</label>
                  <input type="text" name="mapLink" value={editFormData.mapLink} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" placeholder="e.g., 44MM+MHX, near D Mart, Nagpur, Maharashtra 440024" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">WhatsApp Number</label>
                  <input type="text" name="whatsappNumber" value={editFormData.whatsappNumber} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    WhatsApp Message {editFormData.plan === "Basic" && <span className="text-xs text-gray-500">(Auto-set)</span>}
                  </label>
                  {editFormData.plan === "Basic" ? (
                    <div className="rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 text-xs sm:text-sm">
                      {'"Hello {businessName}, i saw your profile on spark"'}
                    </div>
                  ) : (
                    <input type="text" name="whatsappMessage" value={editFormData.whatsappMessage} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                  )}
                </div>
                {(editFormData.plan === "Standard" || editFormData.plan === "Premium") && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Swiggy Link</label>
                      <input type="url" name="swiggyLink" value={editFormData.swiggyLink} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Zomato Link</label>
                      <input type="url" name="zomatoLink" value={editFormData.zomatoLink} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                    </div>
                  </>
                )}
                {editFormData.plan === "Premium" && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">UPI ID</label>
                      <input type="text" name="upiId" value={editFormData.upiId} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-300">Custom Link</label>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        <input type="url" value={editFormData.customLink?.url || ""}
                          onChange={(e) => setEditFormData((prev) => ({ ...prev, customLink: { ...prev.customLink, url: e.target.value } }))}
                          className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" placeholder="URL" />
                        <input type="text" value={editFormData.customLink?.label || ""}
                          onChange={(e) => setEditFormData((prev) => ({ ...prev, customLink: { ...prev.customLink, label: e.target.value } }))}
                          className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" placeholder="Label" />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Plan Expiry</label>
                  <input type="date" name="planExpiry" value={editFormData.planExpiry} onChange={handleEditChange} className="w-full rounded border border-gray-700 bg-gray-900 p-2.5 text-white text-sm sm:p-3" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={editFormData.isActive} onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:space-x-4">
                <button type="button" onClick={closeEditModal} className="flex-1 rounded bg-gray-600 p-2.5 font-bold text-white hover:bg-gray-700 text-sm sm:p-3">Cancel</button>
                <button type="submit" className="flex-1 rounded bg-blue-600 p-2.5 font-bold text-white hover:bg-blue-700 text-sm sm:p-3">Update Business</button>
              </div>
            </form>

            {/* QR Code Display */}
            {editQrCode && (
              <div className="mt-6 rounded-xl border-2 border-green-500/50 bg-gray-800 p-4 text-center">
                <div className="mb-2 inline-flex rounded-full bg-green-500/20 p-2">
                  <FiCheck className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-green-400">Updated!</h3>
                <p className="mb-4 text-sm text-gray-400">{editBusinessUrl}</p>
                <img src={editQrCode} alt="QR Code" className="mx-auto mb-4 h-48 w-48 rounded-lg" />
                <div className="flex gap-3">
                  <a href={editQrCode} download="qr-code.png" className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-bold text-white hover:bg-green-700">Download QR</a>
                  <button onClick={() => { navigator.clipboard.writeText(editBusinessUrl); }} className="flex-1 rounded-lg bg-gray-700 py-2 text-sm font-bold text-white hover:bg-gray-600">Copy URL</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
