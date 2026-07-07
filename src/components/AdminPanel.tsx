import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Companion, CompanionStatus, CompanionGender, Booking, PAKISTAN_CITIES, PakistanCity, PricingTier, PaymentRequest, UserProfile, parsePaymentNote } from "../types";
import { SERVICES, INITIAL_SERVICES } from "../data/services";
import { Shield, Users, Check, X, Sparkles, Plus, Trash2, ShieldAlert, Star, ListFilter, Upload, Award, Camera, Coins, Settings, Save, RefreshCw, Edit2, CreditCard, Search, Ban, Eye, FileText, CheckCircle2, TrendingUp, DollarSign, ArrowUpRight, Activity } from "lucide-react";
import { supabase } from "../supabaseClient";

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
  onApprovePayment: (requestId: string, adminNote?: string) => Promise<void>;
  onRejectPayment: (requestId: string, adminNote?: string) => Promise<void>;
  user: UserProfile;
  allProfiles: UserProfile[];
  appSettings: {
    announcement: string;
    bannerEnabled: boolean;
    bannerText: string;
    silverMultiplier: number;
    goldMultiplier: number;
    platinumMultiplier: number;
    membershipSilverFee: number;
    membershipGoldFee: number;
    membershipPlatinumFee: number;
    adminLogs: any[];
  };
  onUpdateSettings: (newSettings: any) => Promise<void>;
  onSuspendUser: (userId: string, isSuspended: boolean) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onEditCompanionProfile: (id: string, updatedFields: Partial<Companion>) => Promise<void>;
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
  onRejectPayment,
  user,
  allProfiles,
  appSettings,
  onUpdateSettings,
  onSuspendUser,
  onDeleteUser,
  onEditCompanionProfile
}: AdminPanelProps) {
  // Strict Owner Guard check
  const isAuthorizedOwner = user?.email?.toLowerCase() === "komailali116@gmail.com";

  if (!isAuthorizedOwner) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-red-100 rounded-3xl p-8 text-center space-y-6 shadow-md animate-fade-in" id="admin-access-denied">
        <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 shadow-sm animate-pulse">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold text-gray-900">Governance Clearance Denied</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This administrative control system is strictly limited to the platform owner. Your access attempt has been logged.
          </p>
        </div>
        <div className="p-3.5 bg-gray-50 border border-[#E5E1D8] rounded-xl text-left text-xs font-mono space-y-1">
          <p><span className="text-gray-400">Clearance Level:</span> <span className="text-red-600 font-bold">LOCKED</span></p>
          <p><span className="text-gray-400">Attempt Email:</span> {user?.email || "Anonymous"}</p>
          <p><span className="text-gray-400">Authority ID:</span> komailali116@gmail.com</p>
        </div>
      </div>
    );
  }

  // --- COMPONENT STATE ---
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "companions" | "payments" | "pricing" | "content" | "logs">("dashboard");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filters states
  const [userSearch, setUserSearch] = useState("");
  const [userCityFilter, setUserCityFilter] = useState("all");
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);

  const [companionSearch, setCompanionSearch] = useState("");
  const [companionStatusFilter, setCompanionStatusFilter] = useState("all");
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("Pending");
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PaymentRequest | null>(null);
  const [adminReviewNote, setAdminReviewNote] = useState("");
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<string | null>(null);

  // Pricing Form States (initialized from appSettings)
  const [silverMultiplier, setSilverMultiplier] = useState(appSettings.silverMultiplier);
  const [goldMultiplier, setGoldMultiplier] = useState(appSettings.goldMultiplier);
  const [platinumMultiplier, setPlatinumMultiplier] = useState(appSettings.platinumMultiplier);
  const [membershipGoldFee, setMembershipGoldFee] = useState(appSettings.membershipGoldFee);
  const [membershipPlatinumFee, setMembershipPlatinumFee] = useState(appSettings.membershipPlatinumFee);
  const [customBasePrices, setCustomBasePrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {};
    SERVICES.forEach(s => {
      prices[s.id] = s.basePrice;
    });
    return prices;
  });

  // Content Hub states
  const [announcementText, setAnnouncementText] = useState(appSettings.announcement);
  const [bannerTextState, setBannerTextState] = useState(appSettings.bannerText);
  const [bannerEnabledState, setBannerEnabledState] = useState(appSettings.bannerEnabled);

  // Activity Logs filtering & searching states
  const [logSearch, setLogSearch] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");

  // Companion creation uploader states (inherited for admin onboarding)
  const [newCompName, setNewCompName] = useState("");
  const [newCompAge, setNewCompAge] = useState(24);
  const [newCompGender, setNewCompGender] = useState<CompanionGender>(CompanionGender.FEMALE);
  const [newCompCity, setNewCompCity] = useState<PakistanCity>("Lahore");
  const [newCompBio, setNewCompBio] = useState("");
  const [newCompLanguages, setNewCompLanguages] = useState("Urdu, English");
  const [newCompInterests, setNewCompInterests] = useState("Reading, Coffee, Movies");
  const [newCompServices, setNewCompServices] = useState<string[]>(["dining", "call", "study"]);
  const [newCompAvatar, setNewCompAvatar] = useState("");
  const [newCompTier, setNewCompTier] = useState<"Silver" | "Gold" | "Platinum">("Silver");
  const [newCompTagline, setNewCompTagline] = useState("");
  const [newCompPhotos, setNewCompPhotos] = useState<string[]>(["", "", ""]);
  const [newCompPreviews, setNewCompPreviews] = useState<Record<number, string>>({});
  const [uploadSlotIdx, setUploadSlotIdx] = useState<number | null>(null);

  const displaySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const displayError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // --- STATS COMPILING ---
  const activeUsersCount = allProfiles.filter(p => p.selectedRole !== "suspended").length;
  const suspendedUsersCount = allProfiles.filter(p => p.selectedRole === "suspended").length;
  const pendingRegistrationsCount = companions.filter(c => c.status === CompanionStatus.PENDING).length;

  const pendingPayments = paymentRequests.filter(p => p.status === "Pending");
  const approvedPayments = paymentRequests.filter(p => p.status === "Approved");
  const rejectedPayments = paymentRequests.filter(p => p.status === "Rejected");

  const totalCompanions = companions.length;
  const approvedRevenue = approvedPayments.reduce((sum, p) => sum + p.totalPrice, 0);

  // Revenue by service breakdown
  const revenueByService = SERVICES.map(s => {
    const serviceTotal = approvedPayments
      .filter(p => p.serviceId === s.id)
      .reduce((sum, p) => sum + p.totalPrice, 0);
    return { name: s.name, total: serviceTotal, count: approvedPayments.filter(p => p.serviceId === s.id).length };
  });

  // Handle save global prices & tier settings
  const handleSavePricingMatrix = async () => {
    try {
      // 1. Update SERVICES locally & localStorage
      const updatedServices = SERVICES.map(s => ({
        ...s,
        basePrice: customBasePrices[s.id] || s.basePrice
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem("yarana_services", JSON.stringify(updatedServices));
      }

      // 2. Save settings to DB Special Row
      const newSettings = {
        ...appSettings,
        silverMultiplier,
        goldMultiplier,
        platinumMultiplier,
        membershipGoldFee,
        membershipPlatinumFee
      };
      await onUpdateSettings(newSettings);
      displaySuccess("Pricing matrix and service tariffs synchronized successfully across the cloud!");
    } catch (err: any) {
      displayError("tariff alignment failed: " + err.message);
    }
  };

  // Handle Content Hub Sync
  const handleSaveContentHub = async () => {
    try {
      const newSettings = {
        ...appSettings,
        announcement: announcementText,
        bannerText: bannerTextState,
        bannerEnabled: bannerEnabledState
      };
      await onUpdateSettings(newSettings);
      displaySuccess("Governance alert hubs and announcement headers dispatched successfully!");
    } catch (err: any) {
      displayError("Governance content sync failed: " + err.message);
    }
  };

  // Onboard manual companion application via admin creator
  const handleAdminOnboardCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompBio.trim()) {
      alert("Companion name and biography are required.");
      return;
    }

    const companionId = "comp_" + Date.now();
    const onboardedComp: Companion = {
      id: companionId,
      name: newCompName,
      age: Number(newCompAge),
      gender: newCompGender,
      city: newCompCity,
      avatar: newCompAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      bio: newCompBio,
      rating: 4.8,
      reviewsCount: 1,
      languages: newCompLanguages.split(",").map(l => l.trim()).filter(Boolean),
      interests: newCompInterests.split(",").map(i => i.trim()).filter(Boolean),
      services: newCompServices,
      status: CompanionStatus.APPROVED,
      isOnline: true,
      featured: true,
      pricingTier: newCompTier,
      photos: newCompPhotos.filter(Boolean),
      tagline: newCompTagline || undefined
    };

    onAddNewCompanion(onboardedComp);
    displaySuccess(`Companion '${newCompName}' has been successfully provisioned and listed!`);

    // Reset Form
    setNewCompName("");
    setNewCompBio("");
    setNewCompAvatar("");
    setNewCompTagline("");
    setNewCompPhotos(["", "", ""]);
    setNewCompPreviews({});
  };

  const handleCompanionPhotoUpload = async (file: File, slotIdx: number) => {
    setUploadSlotIdx(slotIdx);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id || "admin";

      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const filePath = `companions/${uid}/portfolio_${slotIdx}_${uuid}.png`;

      const { error } = await supabase.storage
        .from("app-files")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      // Create signed URL for instant display
      const { data: signedData, error: signedError } = await supabase.storage
        .from("app-files")
        .createSignedUrl(filePath, 3600);

      if (!signedError && signedData) {
        setNewCompPreviews(prev => ({ ...prev, [slotIdx]: signedData.signedUrl }));
        setNewCompPhotos(prev => {
          const updated = [...prev];
          updated[slotIdx] = filePath;
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Companion photo upload failed:", err);
      alert("Onboarding picture upload failed: " + err.message);
    } finally {
      setUploadSlotIdx(null);
    }
  };

  // Export & Filter Logs helper functions
  const filteredLogs = (appSettings.adminLogs || []).filter((log: any) => {
    const searchLower = logSearch.toLowerCase();
    const titleLower = (log.title || "").toLowerCase();
    const detailsLower = (log.details || "").toLowerCase();
    const ipLower = (log.ip || "").toLowerCase();

    const matchesSearch =
      titleLower.includes(searchLower) ||
      detailsLower.includes(searchLower) ||
      ipLower.includes(searchLower);

    if (!matchesSearch) return false;

    if (logTypeFilter === "all") return true;
    if (logTypeFilter === "settings") {
      return titleLower.includes("settings") || titleLower.includes("multiplier") || titleLower.includes("banner") || titleLower.includes("ticker");
    }
    if (logTypeFilter === "user") {
      return titleLower.includes("user") || titleLower.includes("account") || titleLower.includes("suspend") || titleLower.includes("reactivat") || titleLower.includes("delete");
    }
    if (logTypeFilter === "companion") {
      return titleLower.includes("companion") || titleLower.includes("host") || titleLower.includes("onboard") || titleLower.includes("vetting");
    }
    if (logTypeFilter === "payment") {
      return titleLower.includes("payment") || titleLower.includes("audit") || titleLower.includes("revenue") || titleLower.includes("receipt");
    }
    if (logTypeFilter === "other") {
      const isKnown =
        titleLower.includes("settings") || titleLower.includes("multiplier") || titleLower.includes("banner") || titleLower.includes("ticker") ||
        titleLower.includes("user") || titleLower.includes("account") || titleLower.includes("suspend") || titleLower.includes("reactivat") || titleLower.includes("delete") ||
        titleLower.includes("companion") || titleLower.includes("host") || titleLower.includes("onboard") || titleLower.includes("vetting") ||
        titleLower.includes("payment") || titleLower.includes("audit") || titleLower.includes("revenue") || titleLower.includes("receipt");
      return !isKnown;
    }
    return true;
  });

  const handleExportLogs = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appSettings.adminLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `yarana_admin_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      displaySuccess("Activity logs exported to JSON file successfully!");
    } catch (err: any) {
      displayError("Export failed: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left" id="admin-governance-panel">
      
      {/* 1. Left Sidebar Navigation Column */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white border border-[#E5E1D8] p-5 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 px-1 py-1.5 border-b border-[#E5E1D8]">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h2 className="text-sm font-serif font-black text-[#1A1A1A] tracking-tight leading-none">Owner Registry</h2>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold font-mono">komailali116@gmail.com</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: Activity },
              { id: "users", label: "User Governance", icon: Users },
              { id: "companions", label: "Companions Catalog", icon: Award },
              { id: "payments", label: "Payment Audits", icon: CreditCard },
              { id: "pricing", label: "Pricing Matrices", icon: Coins },
              { id: "content", label: "Content Hub", icon: Settings },
              { id: "logs", label: "Activity Logs", icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full py-3 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#1A1C20] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-[#D4AF37]" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Notifications Panel */}
        {successMsg && (
          <div className="bg-green-50 border border-green-150 p-4 rounded-2xl flex gap-2 items-center text-xs text-green-700 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-150 p-4 rounded-2xl flex gap-2 items-center text-xs text-red-700 animate-fade-in shadow-sm">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Main Administration Workspace Stage */}
      <div className="lg:col-span-9 space-y-6">

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fade-in">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Total Platform Revenue</p>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-green-700">{approvedRevenue.toLocaleString()}</h3>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">PKR</span>
                </div>
                <div className="h-1 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-3/4" />
                </div>
              </div>

              <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Active Members</p>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-900">{activeUsersCount}</h3>
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-150 px-1.5 py-0.5 rounded">+{suspendedUsersCount} suspended</span>
                </div>
                <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-4/5" />
                </div>
              </div>

              <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Companion Onboarded</p>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-900">{totalCompanions}</h3>
                  {pendingRegistrationsCount > 0 && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded animate-pulse">{pendingRegistrationsCount} pending</span>
                  )}
                </div>
                <div className="h-1 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4AF37] w-2/3" />
                </div>
              </div>

              <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Unresolved Transactions</p>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`text-xl sm:text-2xl font-serif font-black ${pendingPayments.length > 0 ? "text-amber-600" : "text-gray-900"}`}>{pendingPayments.length}</h3>
                  <span className="text-[9px] font-mono text-gray-400 uppercase font-bold">Awaiting verification</span>
                </div>
                <div className="h-1 bg-orange-100 rounded-full overflow-hidden">
                  <div className={`h-full ${pendingPayments.length > 0 ? "bg-amber-500" : "bg-gray-300"} w-1/2`} />
                </div>
              </div>

            </div>

            {/* Quick Action Controls */}
            <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl space-y-4 shadow-sm">
              <h3 className="text-sm font-serif font-black text-[#1A1A1A] tracking-tight">Governance Operations Hub</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-3.5 bg-gray-50 hover:bg-[#F3F0E9]/35 border border-[#E5E1D8] rounded-2xl text-center space-y-1.5 cursor-pointer hover:border-[#D4AF37] transition-all"
                >
                  <Users className="w-5 h-5 text-gray-600 mx-auto" />
                  <p className="text-[10px] font-bold text-[#1A1A1A]">Manage Accounts</p>
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className="p-3.5 bg-gray-50 hover:bg-[#F3F0E9]/35 border border-[#E5E1D8] rounded-2xl text-center space-y-1.5 cursor-pointer hover:border-[#D4AF37] transition-all"
                >
                  <CreditCard className="w-5 h-5 text-amber-600 mx-auto" />
                  <p className="text-[10px] font-bold text-[#1A1A1A]">Verify Payments</p>
                </button>
                <button
                  onClick={() => setActiveTab("pricing")}
                  className="p-3.5 bg-gray-50 hover:bg-[#F3F0E9]/35 border border-[#E5E1D8] rounded-2xl text-center space-y-1.5 cursor-pointer hover:border-[#D4AF37] transition-all"
                >
                  <Coins className="w-5 h-5 text-green-600 mx-auto" />
                  <p className="text-[10px] font-bold text-[#1A1A1A]">Adjust Tariffs</p>
                </button>
                <button
                  onClick={() => setActiveTab("content")}
                  className="p-3.5 bg-gray-50 hover:bg-[#F3F0E9]/35 border border-[#E5E1D8] rounded-2xl text-center space-y-1.5 cursor-pointer hover:border-[#D4AF37] transition-all"
                >
                  <Settings className="w-5 h-5 text-indigo-600 mx-auto" />
                  <p className="text-[10px] font-bold text-[#1A1A1A]">System Banners</p>
                </button>
              </div>
            </div>

            {/* Custom SVG popularity and statistics viz */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-black text-gray-900 uppercase tracking-widest font-mono">Tariff Category Performance</h4>
                  <span className="text-[9px] font-bold text-gray-400 font-mono">REVENUE IN PKR</span>
                </div>
                <div className="space-y-3 pt-2">
                  {revenueByService.map(service => {
                    const maxRevenue = Math.max(...revenueByService.map(r => r.total), 1);
                    const percentage = Math.round((service.total / maxRevenue) * 100);
                    return (
                      <div key={service.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-gray-600">{service.name}</span>
                          <span className="text-gray-900 font-bold">{service.total.toLocaleString()} PKR ({service.count} sales)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity timelines */}
              <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-black text-gray-900 uppercase tracking-widest font-mono">Governance Activity Timeline</h4>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono font-bold uppercase">LIVE</span>
                </div>
                <div className="space-y-3 pt-1 max-h-[220px] overflow-y-auto pr-1">
                  {(appSettings.adminLogs || []).slice(0, 6).map((log: any) => (
                    <div key={log.id} className="flex gap-3 text-xs pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="space-y-0.5 text-left flex-grow">
                        <div className="flex justify-between">
                          <p className="font-bold text-gray-900">{log.title}</p>
                          <span className="text-[9px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">{log.details}</p>
                        <p className="text-[9px] text-gray-400 font-mono italic">Operator: {log.ip}</p>
                      </div>
                    </div>
                  ))}
                  {(!appSettings.adminLogs || appSettings.adminLogs.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-6">No governance audits logged yet.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: USER GOVERNANCE */}
        {activeTab === "users" && (
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8]/60 pb-4">
              <div>
                <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">Platform User Governance</h3>
                <p className="text-xs text-gray-500 mt-1">Audit profile registries, toggle suspension flags, or clear stale client datasets.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold font-mono">{allProfiles.length} TOTAL USERS</span>
              </div>
            </div>

            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search user email, full name, phone number..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <select
                value={userCityFilter}
                onChange={(e) => setUserCityFilter(e.target.value)}
                className="bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 text-xs text-gray-700 font-semibold focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">All Pakistan Cities</option>
                {PAKISTAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-[#E5E1D8]/60 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9F8F6] border-b border-[#E5E1D8] font-mono text-gray-400 uppercase text-[9px] font-bold">
                    <th className="py-3 px-4">Member Profile</th>
                    <th className="py-3 px-4">Contact &amp; Location</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Clearance Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/40">
                  {allProfiles
                    .filter(p => {
                      // Don't show the special settings profile in user management table
                      if (p.email === "settings@yarana.pk") return false;

                      const matchesSearch = p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        p.phone.includes(userSearch);
                      const matchesCity = userCityFilter === "all" || p.city === userCityFilter;
                      return matchesSearch && matchesCity;
                    })
                    .map(member => {
                      const isSuspended = member.selectedRole === "suspended";
                      return (
                        <tr key={member.email} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-gray-100"
                            />
                            <div className="text-left">
                              <p className="font-bold text-gray-900">{member.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{member.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{member.city}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{member.phone}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              member.isAdmin
                                ? "bg-red-50 text-red-700 border border-red-150"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-150"
                            }`}>
                              {member.isAdmin ? "OWNER" : "CLIENT"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              isSuspended ? "text-red-600" : "text-green-600"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-600 animate-pulse" : "bg-green-600"}`} />
                              <span>{isSuspended ? "Suspended" : "Active Clear"}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              {/* Details action */}
                              <button
                                onClick={() => setSelectedUserDetail(member)}
                                className="p-1.5 hover:bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-500 hover:text-black rounded-lg cursor-pointer transition-all"
                                title="View details and transaction logs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle suspension */}
                              <button
                                onClick={() => onSuspendUser(member.email, !isSuspended)}
                                disabled={member.isAdmin}
                                className={`p-1.5 border rounded-lg cursor-pointer transition-all ${
                                  isSuspended
                                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={isSuspended ? "Reactivate user account" : "Suspend user account"}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete action */}
                              <button
                                onClick={() => onDeleteUser(member.email)}
                                disabled={member.isAdmin}
                                className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COMPANIONS CATALOG */}
        {activeTab === "companions" && (
          <div className="space-y-6">
            
            {/* Direct Create / Onboard companion Section */}
            <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">Onboard New Safe Companion</h3>
              <form onSubmit={handleAdminOnboardCompanion} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Full Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sana Malik"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Age (18-40)</label>
                    <input
                      type="number"
                      required
                      min={18}
                      max={40}
                      value={newCompAge}
                      onChange={(e) => setNewCompAge(Number(e.target.value))}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Operational City</label>
                    <select
                      value={newCompCity}
                      onChange={(e) => setNewCompCity(e.target.value as any)}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    >
                      {PAKISTAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Pricing Tariff Tier</label>
                    <select
                      value={newCompTier}
                      onChange={(e) => setNewCompTier(e.target.value as any)}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Silver">Silver Tier (Base Pricing)</option>
                      <option value="Gold">Gold Tier (Premium 1.30x Multiplier)</option>
                      <option value="Platinum">Platinum Tier (VVIP 2.21x Multiplier)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Gender Identity</label>
                    <select
                      value={newCompGender}
                      onChange={(e) => setNewCompGender(e.target.value as any)}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Non-Binary / Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Profile Avatar Image URL</label>
                    <input
                      type="text"
                      placeholder="e.g. Unsplash URL or leave empty"
                      value={newCompAvatar}
                      onChange={(e) => setNewCompAvatar(e.target.value)}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Tagline / Direct Catchphrase</label>
                  <input
                    type="text"
                    placeholder="e.g. Cozy bookworm ready for warm coffee conversations and quiet galleries."
                    value={newCompTagline}
                    onChange={(e) => setNewCompTagline(e.target.value)}
                    className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Biography &amp; Core Boundaries</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide a descriptive biography, social boundaries, conversational style..."
                    value={newCompBio}
                    onChange={(e) => setNewCompBio(e.target.value)}
                    className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                </div>

                {/* Portfolio picture onboarding */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px] block">Upload Onboarding Portfolio (Max 3 pictures)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="relative aspect-square border border-dashed border-[#E5E1D8] rounded-xl bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100/50 hover:border-[#D4AF37] transition-all cursor-pointer">
                        {newCompPreviews[idx] ? (
                          <>
                            <img src={newCompPreviews[idx]} alt="preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setNewCompPreviews(prev => {
                                  const copy = { ...prev };
                                  delete copy[idx];
                                  return copy;
                                });
                                setNewCompPhotos(prev => {
                                  const copy = [...prev];
                                  copy[idx] = "";
                                  return copy;
                                });
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-650 text-white hover:bg-red-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer">
                            <Upload className={`w-5 h-5 text-gray-400 ${uploadSlotIdx === idx ? "animate-bounce" : ""}`} />
                            <span className="text-[10px] text-gray-400 mt-1 font-semibold">{uploadSlotIdx === idx ? "Uploading..." : "Click to select"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleCompanionPhotoUpload(f, idx);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white font-bold tracking-wider text-xs uppercase rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirm and Authorize Listing
                </button>
              </form>
            </div>

            {/* Catalog list manager */}
            <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">Companions Catalog Matrix</h3>
                  <p className="text-xs text-gray-500 mt-1">Change levels, audit profiles, adjust online visibility, or reject applications.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={companionSearch}
                    onChange={(e) => setCompanionSearch(e.target.value)}
                    className="bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <select
                    value={companionStatusFilter}
                    onChange={(e) => setCompanionStatusFilter(e.target.value)}
                    className="bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-1.5 px-2 text-xs focus:outline-none focus:border-[#D4AF37] font-semibold text-gray-600"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending Approvals</option>
                    <option value="Approved">Approved Listings</option>
                  </select>
                </div>
              </div>

              {/* Table of Companions */}
              <div className="overflow-x-auto border border-[#E5E1D8]/60 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9F8F6] border-b border-[#E5E1D8] font-mono text-gray-400 uppercase text-[9px] font-bold">
                      <th className="py-3 px-4">Companion Profile</th>
                      <th className="py-3 px-4">Location &amp; Info</th>
                      <th className="py-3 px-4">Pricing Membership</th>
                      <th className="py-3 px-4">Status &amp; Online</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]/40">
                    {companions
                      .filter(c => {
                        const matchesSearch = c.name.toLowerCase().includes(companionSearch.toLowerCase());
                        const matchesStatus = companionStatusFilter === "all" ||
                          (companionStatusFilter === "Pending" && c.status === CompanionStatus.PENDING) ||
                          (companionStatusFilter === "Approved" && c.status === CompanionStatus.APPROVED);
                        return matchesSearch && matchesStatus;
                      })
                      .map(companion => {
                        const isPending = companion.status === CompanionStatus.PENDING;
                        return (
                          <tr key={companion.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={companion.avatar}
                                alt={companion.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-100"
                              />
                              <div className="text-left">
                                <p className="font-bold text-gray-900">{companion.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">Age: {companion.age} &bull; {companion.gender}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-800">{companion.city}</p>
                              <p className="text-[10px] text-gray-400 max-w-[150px] truncate">{companion.bio}</p>
                            </td>
                            <td className="py-3 px-4">
                              {/* One-click membership switching */}
                              <div className="flex gap-1">
                                {(["Silver", "Gold", "Platinum"] as PricingTier[]).map(t => {
                                  const isActive = companion.pricingTier === t;
                                  return (
                                    <button
                                      key={t}
                                      onClick={async () => {
                                        if (onUpdateCompanionTier) {
                                          onUpdateCompanionTier(companion.id, t);
                                          displaySuccess(`Upgraded '${companion.name}' to ${t} tier status instantly!`);
                                        }
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer border ${
                                        isActive
                                          ? "bg-amber-50 border-amber-300 text-[#8a6d1c]"
                                          : "bg-white border-[#E5E1D8] text-gray-400 hover:text-black hover:border-black"
                                      }`}
                                    >
                                      {t}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isPending ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-green-100 text-green-800 border border-green-200"
                                }`}>
                                  {companion.status}
                                </span>
                                {!isPending && (
                                  <button
                                    onClick={() => onToggleOnline(companion.id)}
                                    className="p-1 hover:bg-[#F3F0E9]/30 rounded-lg cursor-pointer transition-all"
                                    title={companion.isOnline ? "Set Offline" : "Set Online"}
                                  >
                                    <span className={`w-2 h-2 inline-block rounded-full ${companion.isOnline ? "bg-green-500 animate-ping" : "bg-gray-400"}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isPending ? (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      onApproveCompanion(companion.id, "Silver");
                                      displaySuccess(`Approved and listed companion application for '${companion.name}'!`);
                                    }}
                                    className="py-1 px-2.5 bg-green-500 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-green-600 transition-all"
                                  >
                                    Approve Application
                                  </button>
                                  <button
                                    onClick={() => {
                                      onRejectCompanion(companion.id);
                                      displayError(`Rejected companion application for '${companion.name}'`);
                                    }}
                                    className="py-1 px-2.5 bg-red-650 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-red-700 transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => setEditingCompanion(companion)}
                                    className="p-1.5 hover:bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-500 hover:text-black rounded-lg cursor-pointer transition-all"
                                    title="Edit companion profile info"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to completely erase ${companion.name} from the catalog?`)) {
                                        onRemoveCompanion(companion.id);
                                        displayError(`Companion '${companion.name}' permanently dropped.`);
                                      }
                                    }}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-150 text-red-650 rounded-lg cursor-pointer transition-all"
                                    title="Erase companion profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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

        {/* TAB 4: PAYMENT VERIFICATION AUDITS */}
        {activeTab === "payments" && (
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">Manual Payment Verification Center</h3>
                <p className="text-xs text-gray-500 mt-1">Audit billing slips, verify EasyPaisa/JazzCash ledger reference IDs, and unlock paid bookings.</p>
              </div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-xs font-bold text-gray-600 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved Transactions</option>
                <option value="Rejected">Rejected/Flagged Slips</option>
              </select>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by transaction reference ID or client email..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto border border-[#E5E1D8]/60 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9F8F6] border-b border-[#E5E1D8] font-mono text-gray-400 uppercase text-[9px] font-bold">
                    <th className="py-3 px-4">Sender &amp; Contact</th>
                    <th className="py-3 px-4">Booking Tariff</th>
                    <th className="py-3 px-4">Manual Method &amp; Reference ID</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-center">Clearance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/40">
                  {paymentRequests
                    .filter(p => {
                      const matchesStatus = p.status === paymentStatusFilter;
                      const matchesSearch = p.transactionId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                        p.userEmail?.toLowerCase().includes(paymentSearch.toLowerCase());
                      return matchesStatus && matchesSearch;
                    })
                    .map(request => {
                      const extended = parsePaymentNote(request.paymentNote);
                      const finalSenderName = extended.senderName || request.userEmail?.split("@")[0] || "Anonymous";
                      return (
                        <tr
                          key={request.id}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedPaymentDetail(request);
                            setAdminReviewNote(extended.adminNote || "");
                          }}
                        >
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-900">{finalSenderName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{request.userEmail}</p>
                          </td>
                          <td className="py-3 px-4 text-left">
                            <p className="font-extrabold text-orange-600 font-mono text-xs">{request.totalPrice.toLocaleString()} PKR</p>
                            <p className="text-[10px] text-gray-500">{request.serviceName} &bull; {request.companionName}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800">{extended.senderAccountNumber ? `Manual (${extended.senderAccountNumber.substring(0,4)}...)` : "Mobile Money"}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {request.transactionId}</p>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">
                            {new Date(request.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block ${
                              request.status === "Pending"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : request.status === "Approved"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PRICING MATRIX */}
        {activeTab === "pricing" && (
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-[#E5E1D8]/60 pb-4">
              <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">System Pricing Tariff Matrix</h3>
              <p className="text-xs text-gray-500 mt-1">Adjust companion category multipliers or adjust direct service pricing across the catalog instantly.</p>
            </div>

            {/* Category Multipliers */}
            <div className="space-y-4">
              <h4 className="text-xs font-serif font-black text-gray-900 uppercase tracking-widest font-mono">Category Tariffs Multipliers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Silver Tier Multiplier</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      max={3.0}
                      value={silverMultiplier}
                      onChange={(e) => setSilverMultiplier(Number(e.target.value))}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl py-2 px-3 text-xs font-bold focus:outline-none"
                    />
                    <span className="text-[10px] font-bold font-mono text-gray-400">BASE RATE</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gold Tier Multiplier</p>
                  <input
                    type="number"
                    step={0.05}
                    min={1.0}
                    max={5.0}
                    value={goldMultiplier}
                    onChange={(e) => setGoldMultiplier(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl py-2 px-3 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-[#E5E1D8] space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platinum Tier Multiplier</p>
                  <input
                    type="number"
                    step={0.05}
                    min={1.5}
                    max={10.0}
                    value={platinumMultiplier}
                    onChange={(e) => setPlatinumMultiplier(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl py-2 px-3 text-xs font-bold focus:outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Service Base Prices */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-serif font-black text-gray-900 uppercase tracking-widest font-mono">Service Base Prices (Tariffs)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICES.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-[#F9F8F6] border border-[#E5E1D8]/60 p-3.5 rounded-2xl">
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400">Duration Covered: {s.baseHours} {s.extraUnitName}s</p>
                    </div>
                    <div className="relative max-w-[120px]">
                      <input
                        type="number"
                        min={100}
                        max={100000}
                        step={100}
                        value={customBasePrices[s.id] !== undefined ? customBasePrices[s.id] : s.basePrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomBasePrices(prev => ({ ...prev, [s.id]: val }));
                        }}
                        className="w-full bg-white border border-[#E5E1D8] rounded-xl py-1.5 pl-3 pr-8 text-xs font-mono font-bold text-right focus:outline-none"
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-[9px] font-bold text-gray-400">PKR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSavePricingMatrix}
              className="w-full py-3 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white font-bold tracking-wider text-xs uppercase rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Update Tariffs Nationwide
            </button>
          </div>
        )}

        {/* TAB 6: CONTENT HUB */}
        {activeTab === "content" && (
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-[#E5E1D8]/60 pb-4">
              <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">Governance Content Hub</h3>
              <p className="text-xs text-gray-500 mt-1">Deploy global announcements, safety advisories, or operational banners to all client navigation panels instantly.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Top Navigation Announcement Ticker</label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. ✨ Welcome to Pakistan's premier verified social companionship registry!"
                  className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-[10px] text-gray-400 italic">Displayed on top navigation bar across all screens.</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E5E1D8]/40">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Middle-Screen Operational Alert Banner</label>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bannerEnabledState}
                      onChange={(e) => setBannerEnabledState(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-2 text-[10px] font-bold text-gray-500">{bannerEnabledState ? "ENABLED" : "DISABLED"}</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={bannerTextState}
                  onChange={(e) => setBannerTextState(e.target.value)}
                  placeholder="e.g. 📢 Official Alert: Host companion applications are currently experiencing high volume. Vetting may take up to 24 hours."
                  className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveContentHub}
              className="w-full py-3 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white font-bold tracking-wider text-xs uppercase rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Deploy Global Tickers &amp; Banners
            </button>
          </div>
        )}

        {/* TAB 7: SYSTEM ACTIVITY LOGS */}
        {activeTab === "logs" && (
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-[#E5E1D8]/60 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-black text-[#1A1A1A] tracking-tight">System Activity Logs</h3>
                <p className="text-xs text-gray-500 mt-1">Immutable registry of administrative actions, safety controls, settings adjustments, and payment audit operations.</p>
              </div>
              <button
                onClick={handleExportLogs}
                className="self-start md:self-auto px-4 py-2 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                <Upload className="w-3.5 h-3.5 rotate-180" />
                <span>Export logs as JSON</span>
              </button>
            </div>

            {/* Searching & Category Filtering Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter logs by operation title, description, or email..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="px-3.5 py-2 text-xs bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#D4AF37] font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">⚡ All Operations</option>
                <option value="settings">⚙️ Settings &amp; Tariffs</option>
                <option value="user">👤 User Suspensions</option>
                <option value="companion">🏆 Companion Registry</option>
                <option value="payment">💳 Payment Audits</option>
                <option value="other">🧬 Miscellaneous</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto border border-[#E5E1D8]/60 rounded-2xl max-h-[550px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9F8F6] border-b border-[#E5E1D8] font-mono text-gray-400 uppercase text-[9px] font-bold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Operation</th>
                    <th className="py-3 px-4">Audit Description</th>
                    <th className="py-3 px-4">Originator (IP/Email)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/40 text-[11px]">
                  {filteredLogs.map((log: any) => {
                    const getBadgeStyle = (title: string) => {
                      const t = title.toLowerCase();
                      if (t.includes("suspend") || t.includes("delete") || t.includes("drop") || t.includes("reject")) {
                        return "bg-red-50 text-red-700 border border-red-200/50";
                      }
                      if (t.includes("approve") || t.includes("reactivat") || t.includes("register") || t.includes("onboard")) {
                        return "bg-green-50 text-green-700 border border-green-200/50";
                      }
                      if (t.includes("settings") || t.includes("multiplier") || t.includes("tariff") || t.includes("alignment")) {
                        return "bg-blue-50 text-blue-700 border border-blue-200/50";
                      }
                      return "bg-gray-50 text-gray-700 border border-gray-200/50";
                    };

                    return (
                      <tr key={log.id} className="hover:bg-[#F3F0E9]/10 transition-colors">
                        <td className="py-3 px-4 text-gray-400 font-mono font-semibold whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getBadgeStyle(log.title || "")}`}>
                            {log.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 leading-relaxed font-sans max-w-sm">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500 font-bold max-w-xs truncate" title={log.ip}>
                          {log.ip}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                        No activity records found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- DRAWERS / MODALS / LIGHTBOXES OVERLAYS --- */}
      <AnimatePresence>
        
        {/* MODAL: USER DETAIL VIEWER */}
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-lg border border-[#E5E1D8]"
            >
              <div className="p-6 border-b border-[#E5E1D8] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={selectedUserDetail.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="text-left">
                    <h3 className="text-sm font-serif font-black text-gray-900 leading-none">{selectedUserDetail.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">{selectedUserDetail.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserDetail(null)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto text-xs text-left">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Location City</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">{selectedUserDetail.city}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Phone Number</p>
                    <p className="text-sm font-bold text-gray-800 mt-1 font-mono">{selectedUserDetail.phone}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Platform Transaction History</p>
                  <div className="border border-[#E5E1D8] rounded-xl overflow-hidden divide-y divide-[#E5E1D8]/40">
                    {paymentRequests
                      .filter(p => p.userEmail === selectedUserDetail.email)
                      .map(p => (
                        <div key={p.id} className="p-3 bg-gray-50/50 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{p.serviceName}</p>
                            <p className="text-[9px] text-gray-400 font-mono">ID: {p.transactionId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-indigo-700">{p.totalPrice.toLocaleString()} PKR</p>
                            <span className="text-[8px] font-mono uppercase text-gray-400 font-bold">{p.status}</span>
                          </div>
                        </div>
                      ))}
                    {paymentRequests.filter(p => p.userEmail === selectedUserDetail.email).length === 0 && (
                      <p className="p-4 text-center text-gray-400 italic">No manual transaction slips registered.</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: COMPANION PROFILE EDITOR */}
        {editingCompanion && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-lg border border-[#E5E1D8] text-left"
            >
              <div className="p-5 border-b border-[#E5E1D8] flex justify-between items-center">
                <h3 className="text-sm font-serif font-black text-gray-900">Edit Companion Profile Attributes</h3>
                <button onClick={() => setEditingCompanion(null)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Display Name</label>
                    <input
                      type="text"
                      value={editingCompanion.name}
                      onChange={(e) => setEditingCompanion({ ...editingCompanion, name: e.target.value })}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Age (18-40)</label>
                    <input
                      type="number"
                      value={editingCompanion.age}
                      onChange={(e) => setEditingCompanion({ ...editingCompanion, age: Number(e.target.value) })}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">City</label>
                    <select
                      value={editingCompanion.city}
                      onChange={(e) => setEditingCompanion({ ...editingCompanion, city: e.target.value as any })}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800"
                    >
                      {PAKISTAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Membership Pricing Tier</label>
                    <select
                      value={editingCompanion.pricingTier}
                      onChange={(e) => setEditingCompanion({ ...editingCompanion, pricingTier: e.target.value as any })}
                      className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800"
                    >
                      <option value="Silver">Silver Tier (1.0x)</option>
                      <option value="Gold">Gold Tier (Premium 1.30x)</option>
                      <option value="Platinum">Platinum Tier (VVIP 2.21x)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={editingCompanion.tagline || ""}
                    onChange={(e) => setEditingCompanion({ ...editingCompanion, tagline: e.target.value })}
                    className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Biography</label>
                  <textarea
                    rows={3}
                    value={editingCompanion.bio}
                    onChange={(e) => setEditingCompanion({ ...editingCompanion, bio: e.target.value })}
                    className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-gray-800 resize-none"
                  />
                </div>

                <button
                  onClick={async () => {
                    await onEditCompanionProfile(editingCompanion.id, editingCompanion);
                    setEditingCompanion(null);
                    displaySuccess("Companion catalog registry synchronized successfully!");
                  }}
                  className="w-full py-3 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white font-bold tracking-wider text-xs uppercase rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Save Profile Attributes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: PAYMENT DETAIL AUDIT DRAWER */}
        {selectedPaymentDetail && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="bg-white w-full max-w-md h-screen p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-[#E5E1D8]"
            >
              <div className="space-y-6 text-xs text-left">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-serif font-black text-gray-900">Manual Billing Audit</h3>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-mono tracking-wider font-semibold">REF: {selectedPaymentDetail.transactionId}</p>
                  </div>
                  <button onClick={() => setSelectedPaymentDetail(null)} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Audit details card */}
                {(() => {
                  const extended = parsePaymentNote(selectedPaymentDetail.paymentNote);
                  return (
                    <div className="space-y-5">
                      <div className="bg-[#F3F0E9]/30 border border-[#E5E1D8]/60 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Service Rendered</span>
                          <span className="font-bold text-gray-900">{selectedPaymentDetail.serviceName}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Verification Slips</span>
                          <span className="font-extrabold text-orange-600 font-mono">{selectedPaymentDetail.totalPrice.toLocaleString()} PKR</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Sender Name</span>
                          <span className="font-bold text-gray-900">{extended.senderName || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Sending Account #</span>
                          <span className="font-mono font-bold text-gray-800">{extended.senderAccountNumber || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Ledger Transaction ID</span>
                          <span className="font-mono font-bold text-indigo-700">{selectedPaymentDetail.transactionId}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Sending Last 4 Digits</span>
                          <span className="font-mono font-bold text-gray-900">*{selectedPaymentDetail.lastFour}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px] font-mono">Billing Timestamp</span>
                          <span className="font-mono text-gray-500">{extended.paymentDateTime || "Not specified"}</span>
                        </div>
                      </div>

                      {/* Display slip screenshot with lightbox click */}
                      {extended.screenshotUrl && (
                        <div className="space-y-1.5">
                          <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Attached Screenshot Proof</p>
                          <div
                            onClick={async () => {
                              // Retrieve storage path or full signed URL dynamically
                              let url = extended.screenshotUrl;
                              if (url && !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:")) {
                                const { data: signedData } = await supabase.storage
                                  .from("app-files")
                                  .createSignedUrl(url, 3600);
                                if (signedData) url = signedData.signedUrl;
                              }
                              setEnlargedScreenshot(url);
                            }}
                            className="relative border border-[#E5E1D8] rounded-2xl overflow-hidden aspect-video bg-gray-50 hover:opacity-90 transition-opacity cursor-pointer group shadow-sm"
                          >
                            <img
                              src={extended.screenshotUrl.startsWith("http") ? extended.screenshotUrl : `https://ayypyoczarvufsmolfqx.supabase.co/storage/v1/object/public/app-files/${extended.screenshotUrl}`}
                              alt="Manual Billing slip"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs">
                              <Eye className="w-4 h-4" />
                              <span>Click to Zoom Proof</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Optional note */}
                      {extended.note && (
                        <div className="space-y-1 bg-[#F9F8F6] p-3 rounded-xl border border-[#E5E1D8]/60">
                          <p className="font-bold text-gray-400 uppercase tracking-widest text-[8px]">Client Billing Comment</p>
                          <p className="text-gray-700 leading-normal italic font-medium">"{extended.note}"</p>
                        </div>
                      )}

                      {/* Administrator Notes block */}
                      <div className="space-y-1">
                        <label className="font-bold text-gray-400 uppercase tracking-widest text-[9px] block">Administrator Verification Notes</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Verified matched on Bank Alfalah portal. Ledger matches transaction total."
                          value={adminReviewNote}
                          onChange={(e) => setAdminReviewNote(e.target.value)}
                          className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2 px-3 text-xs focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Approve/Reject Controls */}
              {selectedPaymentDetail.status === "Pending" ? (
                <div className="grid grid-cols-2 gap-3.5 border-t border-gray-100 pt-4 mt-6">
                  <button
                    onClick={async () => {
                      // Compile notes and update request note json
                      const extended = parsePaymentNote(selectedPaymentDetail.paymentNote);
                      extended.adminNote = adminReviewNote;
                      const serialized = JSON.stringify(extended);

                      await onApprovePayment(selectedPaymentDetail.id, adminReviewNote);
                      
                      // Also update note column on the request row in DB manually for complete logging
                      await supabase.from("payment_requests").update({ payment_note: serialized }).eq("id", selectedPaymentDetail.id);

                      setSelectedPaymentDetail(null);
                      displaySuccess("Payment transaction cleared! Booking has been unlocked for the member.");
                    }}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold tracking-wider text-xs uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Clear Slip</span>
                  </button>
                  <button
                    onClick={async () => {
                      const extended = parsePaymentNote(selectedPaymentDetail.paymentNote);
                      extended.adminNote = adminReviewNote;
                      const serialized = JSON.stringify(extended);

                      await onRejectPayment(selectedPaymentDetail.id, adminReviewNote);
                      await supabase.from("payment_requests").update({ payment_note: serialized }).eq("id", selectedPaymentDetail.id);

                      setSelectedPaymentDetail(null);
                      displayError("Billing transaction flagged and rejected.");
                    }}
                    className="w-full py-3.5 bg-red-650 hover:bg-red-700 text-white font-bold tracking-wider text-xs uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Flag &amp; Reject</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 mt-6 text-center text-xs text-gray-400 font-mono italic">
                  This transaction has already been resolved and locked ({selectedPaymentDetail.status}).
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* LIGHTBOX SCREENSHOT PREVIEW */}
        {enlargedScreenshot && (
          <div
            onClick={() => setEnlargedScreenshot(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full h-full max-h-[80vh] flex items-center justify-center"
            >
              <img
                src={enlargedScreenshot}
                alt="Enlarged transaction proof slip"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setEnlargedScreenshot(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
