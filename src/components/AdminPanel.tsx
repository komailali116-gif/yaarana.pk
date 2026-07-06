import React, { useState } from "react";
import { motion } from "motion/react";
import { Companion, CompanionStatus, CompanionGender, Booking, PAKISTAN_CITIES, PakistanCity, PricingTier, PaymentRequest } from "../types";
import { SERVICES, saveStoredServices, getStoredMultipliers, saveStoredMultipliers, INITIAL_SERVICES } from "../data/services";
import { Shield, Users, Check, X, ToggleLeft, ToggleRight, Sparkles, Plus, Trash2, ShieldAlert, Star, ListFilter, Upload, Award, Camera, Coins, Settings, Save, RefreshCw, Edit2, Utensils, Film, PhoneCall, Sun, Compass, Moon, BookOpen, CreditCard } from "lucide-react";
// @ts-ignore
import { supabase } from "../supabaseClient";
import { countUploadedPics } from "../lib/limits";

const PRESET_AVATARS = [
  { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", gender: "Female", label: "Friendly Sana" },
  { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", gender: "Female", label: "Artistic Aisha" },
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400", gender: "Female", label: "Stylish Zara" },
  { url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400", gender: "Female", label: "Warm Fatima" },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", gender: "Male", label: "Corporate Sameer" },
  { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400", gender: "Male", label: "Elegant Hamza" },
  { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", gender: "Male", label: "Active Bilal" },
  { url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400", gender: "Male", label: "Smart Kamran" }
];

interface AdminPanelProps {
  companions: Companion[];
  bookings: Booking[];
  paymentRequests: PaymentRequest[];
  onApproveCompanion: (id: string, tier?: PricingTier) => void;
  onRejectCompanion: (id: string) => void;
  onRemoveCompanion: (id: string) => void;
  onToggleOnline: (id: string) => void;
  onAddNewCompanion: (newComp: Companion) => void;
  onUpdateCompanionTier?: (id: string, tier: PricingTier) => void;
  onApprovePayment: (requestId: string) => Promise<void>;
  onRejectPayment: (requestId: string) => Promise<void>;
}

export default function AdminPanel({
  companions,
  bookings,
  paymentRequests,
  onApproveCompanion,
  onRejectCompanion,
  onRemoveCompanion,
  onToggleOnline,
  onAddNewCompanion,
  onUpdateCompanionTier,
  onApprovePayment,
  onRejectPayment
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "pending" | "add_new" | "bookings_log" | "pricing" | "payments">("listings");
  const [localServices, setLocalServices] = useState(() => [...SERVICES]);
  const [localMultipliers, setLocalMultipliers] = useState(() => getStoredMultipliers());
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editedBasePrice, setEditedBasePrice] = useState<string>("");
  const [editedExtraPrice, setEditedExtraPrice] = useState<string>("");
  const [pricingSuccess, setPricingSuccess] = useState("");
  const [newCompanionName, setNewCompanionName] = useState("");
  const [newAge, setNewAge] = useState(24);
  const [newGender, setNewGender] = useState<CompanionGender>(CompanionGender.FEMALE);
  const [newCity, setNewCity] = useState<PakistanCity>("Lahore");
  const [newBio, setNewBio] = useState("");
  const [newLanguages, setNewLanguages] = useState("Urdu, English");
  const [newInterests, setNewInterests] = useState("Reading, Movies, Coffee");
  const [newServices, setNewServices] = useState<string[]>(["dining", "call", "study"]);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [companionId, setCompanionId] = useState(() => "comp_" + Date.now());
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(-1);
  const [newFeatured, setNewFeatured] = useState(false);
  const [newTagline, setNewTagline] = useState("");
  const [newPricingTier, setNewPricingTier] = useState<"Silver" | "Platinum" | "Gold">("Silver");
  const [formSuccess, setFormSuccess] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pendingTiers, setPendingTiers] = useState<Record<string, "Silver" | "Platinum" | "Gold">>({});

  // Portfolio Photos states for Admin creation
  const [newPhotos, setNewPhotos] = useState<string[]>(["", "", ""]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<Record<number, string>>({});
  const [isPhotoUploading, setIsPhotoUploading] = useState<number | null>(null);
  const [photosError, setPhotosError] = useState("");

  const handleAddPhotoUrl = (url: string, index: number) => {
    if (!url.trim()) return;
    const updated = [...newPhotos];
    updated[index] = url.trim();
    setNewPhotos(updated);
    setNewPhotoPreviews(prev => ({ ...prev, [index]: url.trim() }));
  };

  const handleRemovePhoto = (index: number) => {
    const updated = [...newPhotos];
    updated[index] = "";
    setNewPhotos(updated);
    setNewPhotoPreviews(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handlePortfolioPhotoUpload = async (file: File, slotIndex: number) => {
    setPhotosError("");
    setIsPhotoUploading(slotIndex);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id || "anonymous";

      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'png';
      const filePath = `${uid}/companions/${companionId}/portfolio_${slotIndex}_${uuid}.${extension}`;

      const { error } = await supabase.storage
        .from("app-files")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) {
        setPhotosError("Failed to upload portfolio photo: " + error.message);
        setIsPhotoUploading(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const updated = [...newPhotos];
          updated[slotIndex] = filePath;
          setNewPhotos(updated);
          setNewPhotoPreviews(prev => ({ ...prev, [slotIndex]: reader.result as string }));
          setIsPhotoUploading(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPhotosError("Upload error: " + (err.message || err));
      setIsPhotoUploading(null);
    }
  };

  const pendingCompanions = companions.filter(c => c.status === CompanionStatus.PENDING);
  const approvedCompanions = companions.filter(c => c.status === CompanionStatus.APPROVED);

  // Statistics
  const totalPKREarned = bookings.filter(b => b.status === "paid" || b.status === "completed").reduce((sum, b) => sum + b.totalPrice, 0);

  const handleCreateCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess("");

    if (!newCompanionName.trim() || !newBio.trim()) {
      alert("Please fill in companion name and biography.");
      return;
    }

    const randomID = companionId;
    const parsedLanguages = newLanguages.split(",").map(l => l.trim()).filter(Boolean);
    const parsedInterests = newInterests.split(",").map(i => i.trim()).filter(Boolean);

    // Dynamic avatar selection based on gender
    const defaultAvatars = {
      [CompanionGender.FEMALE]: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      [CompanionGender.MALE]: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
      [CompanionGender.OTHER]: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
    };

    const newComp: Companion = {
      id: randomID,
      name: newCompanionName,
      age: Number(newAge),
      gender: newGender,
      city: newCity,
      avatar: newAvatarUrl.trim() || defaultAvatars[newGender],
      bio: newBio,
      rating: 0.0,
      reviewsCount: 0,
      languages: parsedLanguages,
      interests: parsedInterests,
      services: newServices,
      status: CompanionStatus.APPROVED, // Admins directly approve their own creations!
      isOnline: true,
      featured: newFeatured,
      tagline: newTagline.trim() || undefined,
      pricingTier: newPricingTier,
      photos: newPhotos.filter(Boolean).length > 0 ? newPhotos.filter(Boolean) : undefined
    };

    onAddNewCompanion(newComp);
    setFormSuccess(`Companion profile for '${newCompanionName}' successfully provisioned and approved with ${newPhotos.filter(Boolean).length} portfolio pictures!`);

    // Reset Form
    setNewCompanionName("");
    setNewBio("");
    setNewLanguages("Urdu, English");
    setNewInterests("Reading, Movies, Coffee");
    setNewServices(["dining", "call", "study"]);
    setNewAvatarUrl("");
    setAvatarPreview("");
    setCompanionId("comp_" + Date.now());
    setSelectedPresetIdx(-1);
    setNewFeatured(false);
    setNewTagline("");
    setNewPricingTier("Silver");
    setNewPhotos(["", "", ""]);
    setNewPhotoPreviews({});
    setPhotosError("");
  };

  const handleServiceToggle = (serviceId: string) => {
    if (newServices.includes(serviceId)) {
      setNewServices(newServices.filter(id => id !== serviceId));
    } else {
      setNewServices([...newServices, serviceId]);
    }
  };

  return (
    <div className="space-y-6 text-[#2D2D2D]" id="admin-panel-container">
      
      {/* Admin Title / Status Banner */}
      <div className="bg-white border border-[#E5E1D8] p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#1A1C20] text-[#D4AF37] shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Governance Center</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-light">Administrative dashboard for companion registration, application approvals, and audit logs.</p>
          </div>
        </div>

        {/* Dynamic administrative stats - Bento style */}
        <div className="grid grid-cols-3 gap-3 text-left">
          <div className="px-3.5 py-2 bg-[#FFF4E5] rounded-2xl border border-[#FFE0B2]">
            <p className="text-[9px] text-orange-800 uppercase font-mono tracking-wider font-semibold">Earned</p>
            <p className="text-sm font-black text-orange-600 mt-0.5">{totalPKREarned.toLocaleString()} PKR</p>
          </div>
          <div className="px-3.5 py-2 bg-[#E8F5E9] rounded-2xl border border-[#C8E6C9]">
            <p className="text-[9px] text-green-800 uppercase font-mono tracking-wider font-semibold">Hosts</p>
            <p className="text-sm font-black text-green-700 mt-0.5">{approvedCompanions.length}</p>
          </div>
          <div className="px-3.5 py-2 bg-[#E1F5FE] rounded-2xl border border-[#B3E5FC]">
            <p className="text-[9px] text-blue-800 uppercase font-mono tracking-wider font-semibold">Pending</p>
            <p className="text-sm font-black text-blue-700 mt-0.5">{pendingCompanions.length}</p>
          </div>
        </div>
      </div>

      {/* Admin Inner Navigation Tabs */}
      <div className="flex border-b border-[#E5E1D8] gap-2 overflow-x-auto pb-1" id="admin-submenu-tabs">
        <button
          onClick={() => { setActiveTab("listings"); setFormSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "listings" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-listings"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Active Hosts ({approvedCompanions.length})</span>
        </button>
        
        <button
          onClick={() => { setActiveTab("pending"); setFormSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === "pending" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-pending"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Applications</span>
          {pendingCompanions.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {pendingCompanions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab("add_new"); setFormSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "add_new" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-add"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Host</span>
        </button>

        <button
          onClick={() => { setActiveTab("bookings_log"); setFormSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "bookings_log" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-logs"
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Audit Logs ({bookings.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab("pricing"); setFormSuccess(""); setPricingSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "pricing" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-pricing"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Global Pricing</span>
        </button>

        <button
          onClick={() => { setActiveTab("payments"); setFormSuccess(""); }}
          className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === "payments" ? "bg-[#1A1C20] text-[#D4AF37] shadow-sm" : "text-gray-500 hover:text-black bg-[#F3F0E9]/50"
          }`}
          id="admin-tab-payments"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Audits</span>
          {paymentRequests.filter(r => r.status === "Pending").length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {paymentRequests.filter(r => r.status === "Pending").length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}

      {/* Active Companions Panel */}
      {activeTab === "listings" && (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4" id="admin-active-companions-list">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">Approved Companions</h3>
            <p className="text-xs text-gray-400">Toggle current online availability or dissolve active host accounts here.</p>
          </div>

          {approvedCompanions.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6">No approved companions registered in the database.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedCompanions.map(comp => (
                <div key={comp.id} className="p-4 rounded-2xl bg-[#F3F0E9]/20 border border-[#E5E1D8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={comp.avatar}
                      alt={comp.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8]"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1A1A1A] leading-tight flex items-center gap-1.5 flex-wrap">
                        <span>{comp.name}</span>
                        <span className="text-gray-400 font-mono text-[10px]">({comp.age})</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{comp.city} &bull; {comp.gender}</p>
                      
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#D4AF37] font-bold">
                        <Star className="w-3 h-3 fill-[#D4AF37] stroke-none" />
                        <span>{comp.rating > 0 ? comp.rating.toFixed(1) : "NEW"}</span>
                        <span className="text-gray-400">({comp.reviewsCount} reviews)</span>
                      </div>

                      {/* Tier Label badge */}
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Category:</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          comp.pricingTier === "Gold"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : comp.pricingTier === "Platinum"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : "bg-slate-100 text-slate-700 border border-slate-250"
                        }`}>
                          {comp.pricingTier || "Silver"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions tier selection, toggle online, remove */}
                  <div className="flex flex-wrap items-center gap-2.5 justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0 border-[#E5E1D8]/30">
                    <div className="flex items-center gap-1">
                      {(["Silver", "Gold", "Platinum"] as const).map(tier => (
                        <button
                          key={tier}
                          onClick={() => onUpdateCompanionTier && onUpdateCompanionTier(comp.id, tier)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                            (comp.pricingTier || "Silver") === tier
                              ? tier === "Gold"
                                ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                                : tier === "Platinum"
                                ? "bg-indigo-600 border-indigo-750 text-white shadow-sm"
                                : "bg-slate-700 border-slate-800 text-white shadow-sm"
                              : "bg-white hover:bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                          id={`btn-tier-${comp.id}-${tier}`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Toggle availability */}
                      <button
                        onClick={() => onToggleOnline(comp.id)}
                        className="p-1 transition-all cursor-pointer"
                        title="Toggle Host Online Status"
                      >
                        {comp.isOnline ? (
                          <ToggleRight className="w-7 h-7 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-300" />
                        )}
                      </button>

                      {/* Delete account */}
                      <button
                        onClick={() => onRemoveCompanion(comp.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg cursor-pointer transition-all"
                        title="Dissolve Companion Account"
                        id={`admin-btn-delete-${comp.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Companions Panel */}
      {activeTab === "pending" && (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4" id="admin-pending-companions-list">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">Pending Host Registrations</h3>
            <p className="text-xs text-gray-400">Review self-submitted companion profiles before listing them live on the marketplace.</p>
          </div>

          {pendingCompanions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <Check className="w-8 h-8 text-green-600 bg-green-50 p-1.5 rounded-full mb-2" />
              <p className="text-xs">All outstanding registrations have been fully actioned!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCompanions.map(comp => (
                <div key={comp.id} className="p-4 rounded-2xl bg-[#F3F0E9]/20 border border-[#E5E1D8]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={comp.avatar}
                      alt={comp.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border border-[#E5E1D8]"
                    />
                    <div className="text-left space-y-1">
                      <p className="text-sm font-bold text-[#1A1A1A] leading-tight">{comp.name} <span className="text-gray-400 font-mono">({comp.age})</span></p>
                      <p className="text-[10px] text-gray-400 font-mono leading-none">{comp.city} &bull; {comp.gender}</p>
                      
                      {/* Secure identity check details */}
                      <div className="flex flex-wrap gap-2 py-0.5">
                        {comp.cnic && (
                          <span className="text-[10px] bg-[#FFF4E5] border border-[#FFE0B2] text-[#E65100] px-2 py-0.5 rounded-lg font-mono font-bold" id={`pending-cnic-${comp.id}`}>
                            CNIC: {comp.cnic}
                          </span>
                        )}
                        {comp.mobile && (
                          <span className="text-[10px] bg-[#E8F5E9] border border-[#C8E6C9] text-green-800 px-2 py-0.5 rounded-lg font-bold" id={`pending-mobile-${comp.id}`}>
                            Mobile: {comp.mobile}
                          </span>
                        )}
                      </div>

                      {comp.interests && comp.interests.length > 0 && (
                        <p className="text-[11px] text-gray-600 font-medium">
                          <span className="text-gray-400">Interests:</span> {comp.interests.join(", ")}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 leading-relaxed max-w-md">{comp.bio}</p>
                      
                      {/* Services listed */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {comp.services.map(sid => (
                          <span key={sid} className="text-[9px] bg-white border border-[#E5E1D8] text-gray-600 px-2 py-0.5 rounded-lg">
                            {sid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Select Pricing Tier & Accept/Reject actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E1D8]/60 justify-end w-full md:w-auto">
                    {/* Tier selector for approval */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-bold mr-1 uppercase">Assign Category:</span>
                      {(["Silver", "Gold", "Platinum"] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPendingTiers(prev => ({ ...prev, [comp.id]: tier }))}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                            (pendingTiers[comp.id] || "Silver") === tier
                              ? tier === "Gold"
                                ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                                : tier === "Platinum"
                                ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
                                : "bg-slate-700 border-slate-800 text-white shadow-sm"
                              : "bg-white hover:bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRejectCompanion(comp.id)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                        id={`admin-reject-btn-${comp.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => onApproveCompanion(comp.id, pendingTiers[comp.id] || "Silver")}
                        className="px-4 py-2 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        id={`admin-approve-btn-${comp.id}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Host
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register Host Panel */}
      {activeTab === "add_new" && (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4" id="admin-add-companion-panel">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">Register a Companion</h3>
            <p className="text-xs text-gray-400">Instantly provision and verify new companionship hosts to the marketplace catalog.</p>
          </div>

          {formSuccess && (
            <div className="p-3.5 bg-green-50 border border-green-100 rounded-2xl text-green-800 text-xs font-medium flex items-center gap-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateCompanion} className="space-y-4 text-xs sm:text-sm text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Companion Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zara Ahmed"
                  value={newCompanionName}
                  onChange={(e) => setNewCompanionName(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Age</label>
                <input
                  type="number"
                  min={18}
                  max={50}
                  required
                  value={newAge}
                  onChange={(e) => setNewAge(Number(e.target.value))}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">City</label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value as any)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  {PAKISTAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Languages (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Urdu, English, Punjabi"
                  value={newLanguages}
                  onChange={(e) => setNewLanguages(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Interests &amp; Hobbies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Reading, Coffee, Music, Psychology"
                  value={newInterests}
                  onChange={(e) => setNewInterests(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

             <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Companion Gender</label>
              <div className="flex gap-4 pt-1">
                {Object.values(CompanionGender).map(g => (
                  <label key={g} className="inline-flex items-center gap-1.5 text-gray-700 text-xs cursor-pointer select-none">
                    <input
                      type="radio"
                      name="gender"
                      checked={newGender === g}
                      onChange={() => setNewGender(g)}
                      className="accent-[#D4AF37]"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Photo URL or Direct Photo Picker (and File Upload) */}
            <div className="space-y-3 bg-[#F9F8F6] border border-[#E5E1D8] p-4 rounded-2xl" id="admin-photo-selector-section">
              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Companion Profile Photo</label>
                <p className="text-[11px] text-gray-500 font-light mt-0.5">Choose a direct photo from our preset library, paste a custom URL, or upload your own file directly.</p>
              </div>

              {/* Grid of Clickable Presets (Direct Photos) */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Option 1: Direct Photo Presets</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setNewAvatarUrl(preset.url);
                        setSelectedPresetIdx(idx);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedPresetIdx === idx
                          ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-[1.03]"
                          : "border-[#E5E1D8] hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      {selectedPresetIdx === idx && (
                        <div className="absolute inset-0 bg-[#D4AF37]/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white bg-black/50 rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paste custom URL or Direct File upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option 2: Direct File Upload</span>
                  <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl bg-white cursor-pointer transition-all hover:bg-gray-50 text-xs text-gray-600 font-semibold">
                    <Upload className={`w-4 h-4 text-[#D4AF37] ${isUploading ? "animate-bounce" : ""}`} />
                    <span>{isUploading ? "Uploading..." : "Upload Image File"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          setUploadError("");
                          
                          try {
                            const { data: sessionData } = await supabase.auth.getSession();
                            const uid = sessionData?.session?.user?.id || "anonymous";
                            
                            // Admin has no limits - bypass limit check
                            
                            const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                            const extension = file.name.split('.').pop() || 'png';
                            const filePath = `${uid}/companions/${companionId}/${uuid}.${extension}`;
                            
                            const { error } = await supabase.storage
                              .from("app-files")
                              .upload(filePath, file, { cacheControl: "3600", upsert: true });
                              
                            if (error) {
                              setUploadError("Failed to upload image: " + error.message);
                              setIsUploading(false);
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setAvatarPreview(reader.result);
                                setNewAvatarUrl(filePath);
                                setSelectedPresetIdx(-2);
                                setIsUploading(false);
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            setUploadError("Upload error: " + (err.message || err));
                            setIsUploading(false);
                          }
                        }
                      }}
                    />
                  </label>
                  {uploadError && (
                    <p className="text-red-500 text-[10px] mt-1 font-semibold">{uploadError}</p>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option 3: Paste Custom Photo URL</span>
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    value={selectedPresetIdx >= 0 ? "" : (newAvatarUrl.includes("/") && !newAvatarUrl.startsWith("http") ? "" : newAvatarUrl)}
                    onChange={(e) => {
                      setNewAvatarUrl(e.target.value);
                      setAvatarPreview("");
                      setSelectedPresetIdx(-1); // custom URL
                    }}
                    className="w-full bg-white border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Live Preview of Selected Photo */}
              {newAvatarUrl && (
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-dashed border-[#E5E1D8] w-fit mt-1 shadow-sm">
                  <img
                    src={avatarPreview || newAvatarUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E1D8]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div>
                    <p className="text-[10px] font-bold text-[#1A1A1A]">Photo Assigned Successfully</p>
                    <p className="text-[9px] text-gray-400 font-mono truncate max-w-[240px]">
                      {avatarPreview ? "Direct Uploaded Image (Base64)" : (newAvatarUrl.includes("/") && !newAvatarUrl.startsWith("http") ? "Storage path: " + newAvatarUrl : newAvatarUrl)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Photos Portfolio */}
            <div className="bg-[#F3F0E9]/10 border border-[#E5E1D8] p-5 rounded-2xl space-y-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#D4AF37]" />
                    <span>Portfolio Photos (2-3 Pics)</span>
                  </label>
                  <p className="text-[10px] text-gray-400">Add 2 to 3 beautiful additional pictures of this companion to display in their profile portfolio.</p>
                </div>
                <div className="text-[9px] font-bold text-[#D4AF37] uppercase bg-[#FFF4E5] border border-[#FFE0B2] px-2.5 py-1 rounded-full">
                  {newPhotos.filter(Boolean).length} of 3 Slots Filled
                </div>
              </div>

              {photosError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{photosError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => {
                  const photo = newPhotoPreviews[idx] || newPhotos[idx];
                  const isUploadingThisSlot = isPhotoUploading === idx;

                  return (
                    <div key={idx} className="relative aspect-square rounded-xl bg-white border border-dashed border-[#E5E1D8] overflow-hidden flex flex-col items-center justify-center p-3 hover:border-[#D4AF37]/50 transition-all">
                      {photo ? (
                        <>
                          <img
                            src={photo}
                            alt={`Portfolio Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all shadow-sm cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center space-y-2 w-full">
                          <Camera className="w-5 h-5 text-gray-400 mx-auto" />
                          <div className="text-[10px] text-gray-500 font-bold">Slot {idx + 1}</div>

                          <div className="space-y-1.5">
                            <label className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-all border border-[#E5E1D8]">
                              <Upload className="w-2.5 h-2.5" />
                              <span>{isUploadingThisSlot ? "..." : "Upload"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingThisSlot}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePortfolioPhotoUpload(file, idx);
                                }}
                              />
                            </label>

                            <div className="flex gap-1 items-center justify-center">
                              <input
                                type="url"
                                placeholder="Or paste URL"
                                id={`admin-portfolio-url-${idx}`}
                                className="w-full text-[9px] bg-gray-50 border border-[#E5E1D8] text-gray-800 rounded p-0.5 focus:outline-none focus:border-[#D4AF37]"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) {
                                      handleAddPhotoUrl(val, idx);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`admin-portfolio-url-${idx}`) as HTMLInputElement;
                                  if (el && el.value) {
                                    handleAddPhotoUrl(el.value, idx);
                                    el.value = "";
                                  }
                                }}
                                className="p-1 bg-[#D4AF37] text-white rounded hover:bg-[#C5A028] transition-all cursor-pointer"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Offerable Services</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {SERVICES.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleServiceToggle(s.id)}
                    className={`p-2.5 rounded-xl border text-xs text-center cursor-pointer transition-all ${
                      newServices.includes(s.id)
                        ? "bg-[#1A1C20] border-[#D4AF37]/50 text-white shadow-sm font-semibold"
                        : "bg-white border-[#E5E1D8] text-gray-500 hover:text-black"
                    }`}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Personal Slogan / Catchy Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Seeking beautiful conversations and hot karak chai"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pricing Category</label>
                <select
                  value={newPricingTier}
                  onChange={(e) => setNewPricingTier(e.target.value as any)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="Silver">Silver (Base rates)</option>
                  <option value="Gold">Gold (+30% Premium)</option>
                  <option value="Platinum">Platinum (+70% over Gold)</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Highlight Profile</label>
                <label className="inline-flex items-center gap-2 mt-2 text-gray-700 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newFeatured}
                    onChange={(e) => setNewFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                  />
                  <span className="font-semibold flex items-center gap-1 text-[#1A1A1A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Featured Elite Host
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detailed Biography / Personal Intro</label>
              <textarea
                rows={3}
                required
                placeholder="Give an aesthetic, friendly bio outlining their personality, background, conversational depth, and friendly vibe..."
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-bold rounded-xl text-xs uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                id="btn-admin-submit-companion"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Register &amp; Approve Host</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings Governance Log */}
      {activeTab === "bookings_log" && (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4" id="admin-bookings-log-panel">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-base font-bold text-[#1A1A1A]">Governed Bookings Audit Logs</h3>
            <p className="text-xs text-gray-400">Audit and trace transactions processed across the companionship microfinance network.</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6">No audit records or logged transactions exist yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E5E1D8]">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-[#F3F0E9]/50 text-gray-500 uppercase font-mono text-[9px] border-b border-[#E5E1D8]">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Hired Companion</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Session Date</th>
                    <th className="p-3">Paid amount</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Flow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-[10px] text-gray-400">#{b.id.substring(0, 8)}</td>
                      <td className="p-3 font-semibold text-[#1A1A1A]">{b.companionName}</td>
                      <td className="p-3 font-semibold text-[#D4AF37] text-[11px] uppercase tracking-wider">{b.serviceName}</td>
                      <td className="p-3">{b.date} ({b.time})</td>
                      <td className="p-3 text-[#E65100] font-bold">{b.totalPrice.toLocaleString()} PKR</td>
                      <td className="p-3 text-[10px] font-mono text-gray-500">{b.paymentMethod || "Internal"}</td>
                      <td className="p-3">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          b.status === "completed" ? "bg-green-50 text-green-700 border border-green-100" :
                          b.status === "paid" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="space-y-6" id="admin-pricing-governance-panel">
          {/* Header Card */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#D4AF37]" />
              <span>Global Services &amp; Tier Pricing Governance</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Configure baseline service prices (Silver tier) and control premium category multipliers. Changes are updated globally across all reservation systems immediately.
            </p>
            {pricingSuccess && (
              <div className="mt-3 p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-xl border border-green-100 flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{pricingSuccess}</span>
              </div>
            )}
          </div>

          {/* Tier Multipliers Governance Card */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-[#E5E1D8]/60 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-[#1A1A1A]">1. Tier Rate Multipliers</h4>
                <p className="text-[11px] text-gray-400">Define premium rate boosts for companion tiers.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const defaultMults = { silver: 1.0, gold: 1.3, platinum: 2.21 };
                  saveStoredMultipliers(defaultMults);
                  setLocalMultipliers(defaultMults);
                  setPricingSuccess("Rate multipliers reset to platform defaults successfully!");
                  setTimeout(() => setPricingSuccess(""), 4000);
                }}
                className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-[#D4AF37] flex items-center gap-1 transition-all cursor-pointer border-0 bg-transparent"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Multipliers</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Silver Tier */}
              <div className="border border-[#E5E1D8] rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Silver Tier</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] font-bold">Base</span>
                </div>
                <p className="text-[11px] text-gray-400">Baseline cost used for all pricing computations.</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    disabled
                    value={localMultipliers.silver}
                    className="w-full bg-slate-100/80 border border-slate-200 text-slate-500 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold font-mono">x</span>
                </div>
              </div>

              {/* Gold Tier */}
              <div className="border border-[#E5E1D8] rounded-2xl p-4 bg-[#FDFBF7] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#B8941B] uppercase tracking-wider">Gold Tier</span>
                  <span className="px-2 py-0.5 rounded bg-[#F9F5EB] text-[#B8941B] font-mono text-[9px] font-bold">Premium</span>
                </div>
                <p className="text-[11px] text-gray-400">Premium surcharge boost for Gold hosts.</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="5.0"
                    value={localMultipliers.gold}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1.0;
                      const updated = { ...localMultipliers, gold: val };
                      setLocalMultipliers(updated);
                    }}
                    className="w-full bg-white border border-[#E5E1D8] text-gray-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-xs text-gray-400 font-bold font-mono">x</span>
                </div>
              </div>

              {/* Platinum Tier */}
              <div className="border border-[#E5E1D8] rounded-2xl p-4 bg-indigo-50/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Platinum Tier</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold">Super Surcharge</span>
                </div>
                <p className="text-[11px] text-gray-400">Exclusive surcharge boost for Platinum hosts.</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="10.0"
                    value={localMultipliers.platinum}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1.0;
                      const updated = { ...localMultipliers, platinum: val };
                      setLocalMultipliers(updated);
                    }}
                    className="w-full bg-white border border-[#E5E1D8] text-gray-800 rounded-xl p-2 text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-xs text-gray-400 font-bold font-mono">x</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  saveStoredMultipliers(localMultipliers);
                  setPricingSuccess("Premium category multipliers successfully saved!");
                  setTimeout(() => setPricingSuccess(""), 4000);
                }}
                className="px-5 py-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm border-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Multipliers</span>
              </button>
            </div>
          </div>

          {/* Services Matrix Governance Board */}
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-[#E5E1D8]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#1A1A1A]">2. Interactive Services Pricing Matrix</h4>
                <p className="text-[11px] text-gray-400">View and edit base prices of all core companion services directly.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to restore all base services pricing to default values?")) {
                    saveStoredServices(INITIAL_SERVICES);
                    setLocalServices([...INITIAL_SERVICES]);
                    setPricingSuccess("Baseline services pricing restored to system defaults!");
                    setTimeout(() => setPricingSuccess(""), 4000);
                  }
                }}
                className="text-[10px] uppercase font-bold tracking-widest text-red-500 hover:text-red-700 flex items-center gap-1 transition-all cursor-pointer border-0 bg-transparent self-start"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restore Default Services</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E5E1D8]">
              <table className="w-full text-left text-xs text-gray-700 min-w-[700px]">
                <thead className="bg-[#F3F0E9]/50 text-gray-500 uppercase font-mono text-[9px] border-b border-[#E5E1D8]">
                  <tr>
                    <th className="p-3">Service</th>
                    <th className="p-3">Base Time</th>
                    <th className="p-3 bg-slate-50 border-r border-[#E5E1D8]">Silver Rate (1.00x Base)</th>
                    <th className="p-3 bg-yellow-50/30 border-r border-[#E5E1D8]">Gold Rate ({localMultipliers.gold.toFixed(2)}x)</th>
                    <th className="p-3 bg-indigo-50/10">Platinum Rate ({localMultipliers.platinum.toFixed(2)}x)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {localServices.map((service) => {
                    const isEditing = editingServiceId === service.id;
                    const silBase = service.basePrice;
                    const silExtra = service.extraHourPrice;

                    // Gold Pricing
                    const goldBase = Math.round(silBase * localMultipliers.gold);
                    const goldExtra = Math.round(silExtra * localMultipliers.gold);

                    // Platinum Pricing
                    const platBase = Math.round(silBase * localMultipliers.platinum);
                    const platExtra = Math.round(silExtra * localMultipliers.platinum);

                    const getServiceIcon = (id: string) => {
                      switch (id) {
                        case "dining": return <Utensils className="w-4 h-4 text-orange-600" />;
                        case "movie": return <Film className="w-4 h-4 text-blue-600" />;
                        case "call": return <PhoneCall className="w-4 h-4 text-green-600" />;
                        case "day_spend": return <Sun className="w-4 h-4 text-yellow-600" />;
                        case "travel": return <Compass className="w-4 h-4 text-indigo-600" />;
                        case "night_spend": return <Moon className="w-4 h-4 text-purple-600" />;
                        case "study": return <BookOpen className="w-4 h-4 text-teal-600" />;
                        default: return <Settings className="w-4 h-4 text-gray-600" />;
                      }
                    };

                    return (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[#F3F0E9]/60">
                              {getServiceIcon(service.id)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{service.name}</div>
                              <div className="text-[10px] text-gray-400 line-clamp-1 max-w-[220px]">
                                {service.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-gray-600">
                          {service.baseHours} {service.id === "call" ? "minutes" : "hours"}
                        </td>

                        {/* Silver Tier (Base) */}
                        <td className="p-3 bg-slate-50 border-r border-[#E5E1D8]">
                          {isEditing ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 font-semibold w-10">Base:</span>
                                <input
                                  type="number"
                                  value={editedBasePrice}
                                  onChange={(e) => setEditedBasePrice(e.target.value)}
                                  className="w-20 px-1.5 py-0.5 border border-[#E5E1D8] rounded text-xs font-mono font-bold bg-white text-gray-800 focus:outline-none focus:border-[#D4AF37]"
                                />
                                <span className="text-[10px] text-gray-500 font-semibold">PKR</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 font-semibold w-10">Extra:</span>
                                <input
                                  type="number"
                                  value={editedExtraPrice}
                                  onChange={(e) => setEditedExtraPrice(e.target.value)}
                                  className="w-20 px-1.5 py-0.5 border border-[#E5E1D8] rounded text-xs font-mono font-bold bg-white text-gray-800 focus:outline-none focus:border-[#D4AF37]"
                                />
                                <span className="text-[10px] text-gray-500 font-semibold">PKR / {service.extraUnitName}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-800">{silBase.toLocaleString()} PKR</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                +{silExtra.toLocaleString()} PKR / {service.extraUnitName}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Gold Tier Surcharge */}
                        <td className="p-3 bg-yellow-50/20 border-r border-[#E5E1D8] font-medium text-[#B8941B]">
                          {isEditing ? (
                            <div className="text-[10px] text-gray-400 italic">Auto-calculated from Base</div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-bold">{goldBase.toLocaleString()} PKR</div>
                              <div className="text-[10px] font-mono text-gray-400">
                                +{goldExtra.toLocaleString()} PKR / {service.extraUnitName}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Platinum Tier Surcharge */}
                        <td className="p-3 bg-indigo-50/5 font-medium text-indigo-700">
                          {isEditing ? (
                            <div className="text-[10px] text-gray-400 italic">Auto-calculated from Base</div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-bold">{platBase.toLocaleString()} PKR</div>
                              <div className="text-[10px] font-mono text-gray-400">
                                +{platExtra.toLocaleString()} PKR / {service.extraUnitName}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedBase = parseInt(editedBasePrice) || service.basePrice;
                                  const updatedExtra = parseInt(editedExtraPrice) || service.extraHourPrice;
                                  const updatedServices = localServices.map(s => {
                                    if (s.id === service.id) {
                                      return {
                                        ...s,
                                        basePrice: updatedBase,
                                        extraHourPrice: updatedExtra
                                      };
                                    }
                                    return s;
                                  });
                                  saveStoredServices(updatedServices);
                                  setLocalServices(updatedServices);
                                  setEditingServiceId(null);
                                  setPricingSuccess(`Baseline rates for ${service.name} updated successfully!`);
                                  setTimeout(() => setPricingSuccess(""), 4000);
                                }}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer border-0"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingServiceId(null)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold flex items-center gap-1 border border-gray-200 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingServiceId(service.id);
                                setEditedBasePrice(service.basePrice.toString());
                                setEditedExtraPrice(service.extraHourPrice.toString());
                              }}
                              className="px-2.5 py-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded-md border border-[#E5E1D8] text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer bg-white"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Rates</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6" id="admin-payments-panel">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Manual Payment Request Audits</h3>
            <p className="text-xs text-gray-400">Review, approve, or reject guest transactions to unlock companion sessions.</p>
          </div>

          {paymentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <CreditCard className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold">No payment requests recorded yet.</p>
              <p className="text-xs">Incoming user transfers will populate here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E5E1D8] shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F3F0E9]/50 border-b border-[#E5E1D8]/80 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                    <th className="p-4">User & Submission Time</th>
                    <th className="p-4">Requested Product</th>
                    <th className="p-4">Transaction Details</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/45 text-[#2D2D2D]">
                  {paymentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{req.userEmail || "Anonymous Guest"}</div>
                        <div className="text-[10px] text-gray-450 mt-0.5">ID: {req.userId.substring(0, 8)}...</div>
                        <div className="text-[10px] text-gray-450 mt-0.5">{new Date(req.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={req.companionAvatar}
                            alt={req.companionName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-[#E5E1D8]"
                          />
                          <div>
                            <div className="font-semibold text-gray-800">with {req.companionName}</div>
                            <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mt-0.5">{req.serviceName}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{req.bookingDate} @ {req.bookingTime} ({req.duration} {req.serviceId === "call" ? "mins" : "hours"})</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">TXN ID:</span>{" "}
                          <span className="font-mono text-gray-800 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{req.transactionId || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Sender (Last 4):</span>{" "}
                          <span className="font-mono text-gray-800 font-bold bg-gray-100 px-1.5 py-0.5 rounded">{req.lastFour}</span>
                        </div>
                        {req.paymentNote && (
                          <div className="text-[10px] text-gray-500 italic max-w-xs truncate" title={req.paymentNote}>
                            "{req.paymentNote}"
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-800">
                        {req.totalPrice.toLocaleString()} PKR
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                            req.status === "Pending"
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : req.status === "Approved"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {req.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onRejectPayment(req.id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                            <button
                              onClick={() => onApprovePayment(req.id)}
                              className="px-2.5 py-1.5 bg-green-50 hover:bg-green-105 text-green-800 border border-green-105 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-0.5 shadow-sm"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Audited</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E5E1D8] shadow-2xl text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#1A1A1A]">Free plan limit reached.</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                You can only upload up to 3 pictures on the Free Plan. Upgrade to Pro to create unlimited companions and upload more pictures.
              </p>
            </div>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full bg-[#1A1A1A] hover:bg-black text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Understood
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
