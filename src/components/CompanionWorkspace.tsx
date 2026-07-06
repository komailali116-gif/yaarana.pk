import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Check, X, ShieldAlert, Clock, User, Phone, 
  MapPin, Hash, Star, ToggleLeft, ToggleRight, DollarSign, 
  BookOpen, Heart, Upload, AlertCircle, FileText, ArrowLeft,
  Camera, Trash2, Plus
} from "lucide-react";
import { Companion, CompanionStatus, CompanionGender, UserProfile, Booking, Review, PAKISTAN_CITIES, PakistanCity } from "../types";
import { SERVICES } from "../data/services";
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

interface CompanionWorkspaceProps {
  user: UserProfile;
  companions: Companion[];
  bookings: Booking[];
  reviews: Review[];
  onSubmitApplication: (newComp: Companion) => void;
  onToggleOnline: (companionId: string) => void;
  onResubmitApplication: (companionId: string) => void;
  onGoBackToRoleSelection?: () => void;
  onUpdateCompanionPhotos?: (companionId: string, photos: string[]) => void;
}

export default function CompanionWorkspace({
  user,
  companions,
  bookings,
  reviews,
  onSubmitApplication,
  onToggleOnline,
  onResubmitApplication,
  onGoBackToRoleSelection,
  onUpdateCompanionPhotos
}: CompanionWorkspaceProps) {
  // Try to find if this user has already created a companion profile
  const myCompanionId = "comp_" + user.email.replace(/[@.]/g, "_");
  const myCompanion = companions.find(c => c.id === myCompanionId || c.cnic && c.mobile === user.phone);

  // Form states
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState(user.phone);
  const [formCnic, setFormCnic] = useState("");
  const [formCity, setFormCity] = useState<PakistanCity>(user.city as PakistanCity || "Lahore");
  const [formAge, setFormAge] = useState("24");
  const [formGender, setFormGender] = useState<CompanionGender>(CompanionGender.FEMALE);
  const [formInterests, setFormInterests] = useState("Reading, Movies, Coffee");
  const [formLanguages, setFormLanguages] = useState("Urdu, English");
  const [formTagline, setFormTagline] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formServices, setFormServices] = useState<string[]>(["dining", "call", "study"]);
  const [formAvatar, setFormAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [presetIdx, setPresetIdx] = useState(-1);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Portfolio Photos states
  const [formPhotos, setFormPhotos] = useState<string[]>(() => {
    if (myCompanion && myCompanion.photos) {
      const arr = [...myCompanion.photos];
      while (arr.length < 3) arr.push("");
      return arr;
    }
    return ["", "", ""];
  });
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string>>({});
  const [photoInputUrl, setPhotoInputUrl] = useState("");
  const [photoInputIndex, setPhotoInputIndex] = useState<number | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState<number | null>(null);
  const [photosError, setPhotosError] = useState("");
  const [savePhotosSuccess, setSavePhotosSuccess] = useState(false);

  // Filter stats for approved hosts
  const myBookings = myCompanion ? bookings.filter(b => b.companionId === myCompanion.id) : [];
  const myReviews = myCompanion ? reviews.filter(r => r.companionId === myCompanion.id) : [];
  
  // Calculate earnings (only completed or paid bookings)
  const myCompletedBookings = myBookings.filter(b => b.status === "completed" || b.status === "paid");
  const totalEarnings = myCompletedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const handleServiceToggle = (serviceId: string) => {
    if (formServices.includes(serviceId)) {
      setFormServices(formServices.filter(id => id !== serviceId));
    } else {
      setFormServices([...formServices, serviceId]);
    }
  };

  const handleAddPhotoUrl = (url: string, index: number) => {
    if (!url.trim()) return;
    const updated = [...formPhotos];
    updated[index] = url.trim();
    setFormPhotos(updated);
    setPhotoPreviews(prev => ({ ...prev, [index]: url.trim() }));
  };

  const handleRemovePhoto = (index: number) => {
    const updated = [...formPhotos];
    updated[index] = "";
    setFormPhotos(updated);
    setPhotoPreviews(prev => {
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
      const filePath = `${uid}/companions/${myCompanionId}/portfolio_${slotIndex}_${uuid}.${extension}`;

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
          const updated = [...formPhotos];
          updated[slotIndex] = filePath;
          setFormPhotos(updated);
          setPhotoPreviews(prev => ({ ...prev, [slotIndex]: reader.result as string }));
          setIsPhotoUploading(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPhotosError("Upload error: " + (err.message || err));
      setIsPhotoUploading(null);
    }
  };

  const handleSavePortfolio = () => {
    if (onUpdateCompanionPhotos && myCompanion) {
      onUpdateCompanionPhotos(myCompanion.id, formPhotos.filter(Boolean));
      setSavePhotosSuccess(true);
      setTimeout(() => setSavePhotosSuccess(false), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) return setFormError("Full Name is required.");
    if (!formMobile.trim()) return setFormError("Mobile Number is required.");
    if (!formCnic.trim()) return setFormError("Pakistani CNIC Number is required for legal safety checks.");
    if (!formBio.trim() || formBio.trim().length < 30) return setFormError("Please write a biography of at least 30 characters.");
    if (formServices.length === 0) return setFormError("Please select at least one offerable service.");

    // Simple CNIC validator check (13 digits optionally formatted with hyphens)
    const cnicClean = formCnic.replace(/-/g, "");
    if (cnicClean.length !== 13 || isNaN(Number(cnicClean))) {
      return setFormError("Please enter a valid 13-digit CNIC number. Format: XXXXX-XXXXXXX-X");
    }

    const defaultAvatars: Record<CompanionGender, string> = {
      [CompanionGender.FEMALE]: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
      [CompanionGender.MALE]: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      [CompanionGender.OTHER]: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
    };

    const newCompanionProfile: Companion = {
      id: myCompanionId,
      name: formName.trim(),
      age: Number(formAge) || 24,
      gender: formGender,
      city: formCity,
      avatar: formAvatar.trim() || defaultAvatars[formGender],
      bio: formBio.trim(),
      rating: 0.0,
      reviewsCount: 0,
      languages: formLanguages.split(",").map(l => l.trim()).filter(Boolean),
      interests: formInterests.split(",").map(i => i.trim()).filter(Boolean),
      services: formServices,
      status: CompanionStatus.PENDING, // Always pending manual admin review
      isOnline: false,
      featured: false,
      tagline: formTagline.trim() || undefined,
      cnic: formCnic.trim(),
      mobile: formMobile.trim(),
      photos: formPhotos.filter(Boolean)
    };

    onSubmitApplication(newCompanionProfile);
    setSubmitSuccess(true);
  };

  const handleFormReset = () => {
    if (myCompanion) {
      onResubmitApplication(myCompanion.id);
    }
    setSubmitSuccess(false);
    setFormCnic("");
    setFormTagline("");
    setFormBio("");
  };

  // Case 1: Submitting application has just completed
  if (submitSuccess || (myCompanion && myCompanion.status === CompanionStatus.PENDING)) {
    const comp = myCompanion || {
      name: formName,
      mobile: formMobile,
      cnic: formCnic,
      city: formCity,
      gender: formGender,
      interests: formInterests.split(","),
      bio: formBio
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 text-[#2D2D2D]" id="workspace-pending-container">
        {onGoBackToRoleSelection && (
          <div className="flex justify-start">
            <button
              onClick={onGoBackToRoleSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-[#F3F0E9]/50 hover:bg-[#E5E1D8]/40 border border-[#E5E1D8] rounded-xl transition-all cursor-pointer shadow-xs"
              id="workspace-back-to-role-pending-btn"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>← Back to Role Selection</span>
            </button>
          </div>
        )}
        {/* Banner */}
        <div className="bg-white border border-[#E5E1D8] p-8 rounded-3xl shadow-sm text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] text-[#E65100]">
            <Clock className="w-8 h-8 animate-spin-slow text-[#D4AF37]" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50 inline-block">
              Vetting Status: Pending Compliance Verification
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Your Application is Under Review</h2>
            <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
              Assalam-o-Alaikum, <b>{comp.name}</b>. Thank you for applying to become a verified companion host. Our compliance department is manually verifying your credentials, contact mobile, and CNIC (National Identity Card) details.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 max-w-sm mx-auto bg-gray-50 py-2.5 px-4 rounded-2xl border border-gray-100">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Average Verification Window: <b>2 - 4 Hours</b></span>
          </div>
        </div>

        {/* Application details overview */}
        <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm space-y-5">
          <div className="border-b border-[#E5E1D8]/60 pb-3">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Submitted Application Details</span>
            </h3>
            <p className="text-[11px] text-gray-400">These details have been transmitted securely to the Governance Center for vetting.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#F9F8F6] rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Companion Name</p>
              <p className="font-semibold text-gray-800 mt-0.5">{comp.name}</p>
            </div>
            <div className="p-3 bg-[#F9F8F6] rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Mobile Connection</p>
              <p className="font-semibold text-gray-800 mt-0.5">{comp.mobile}</p>
            </div>
            <div className="p-3 bg-[#F9F8F6] rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-bold">CNIC Number</p>
              <p className="font-mono font-semibold text-[#D4AF37] mt-0.5">
                {comp.cnic ? `${comp.cnic.slice(0, 5)}-XXXXXXX-${comp.cnic.slice(-1)}` : "Verified Security Mask"}
              </p>
            </div>
            <div className="p-3 bg-[#F9F8F6] rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Registered City</p>
              <p className="font-semibold text-gray-800 mt-0.5">{comp.city}</p>
            </div>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Biography / Personal Intro Submission</p>
            <p className="text-gray-600 leading-relaxed italic">"{comp.bio}"</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900">Need to make adjustments?</p>
              <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                If you made a typo or entered an incorrect CNIC, you can cancel this application and resubmit a corrected one.
              </p>
              <button 
                onClick={handleFormReset}
                className="mt-2.5 px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all"
              >
                Cancel and Edit Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Rejected Application
  if (myCompanion && myCompanion.status === CompanionStatus.REJECTED) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-[#2D2D2D]" id="workspace-rejected-container">
        {onGoBackToRoleSelection && (
          <div className="flex justify-start">
            <button
              onClick={onGoBackToRoleSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-[#F3F0E9]/50 hover:bg-[#E5E1D8]/40 border border-[#E5E1D8] rounded-xl transition-all cursor-pointer shadow-xs"
              id="workspace-back-to-role-rejected-btn"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>← Back to Role Selection</span>
            </button>
          </div>
        )}
        <div className="bg-white border border-[#E5E1D8] p-8 rounded-3xl shadow-sm text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-red-50 border border-red-100 text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100 inline-block">
              Vetting Status: Application Rejected
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">Manual Verification Failed</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Unfortunately, your host companion application on Yarana.pk could not be approved. This usually occurs if your 13-digit National CNIC records or mobile contacts could not be matched by our compliance desk.
            </p>
          </div>

          <button
            onClick={handleFormReset}
            className="px-6 py-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black rounded-xl text-xs font-bold uppercase transition-all cursor-pointer shadow-sm"
          >
            Resubmit with Correct Info
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Approved & Live Dashboard!
  if (myCompanion && myCompanion.status === CompanionStatus.APPROVED) {
    return (
      <div className="space-y-6 text-[#2D2D2D]" id="workspace-approved-container">
        
        {/* Banner with Toggle Status */}
        <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={myCompanion.avatar}
              alt={myCompanion.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]"
            />
            <div className="text-left space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wider">
                  ● Approved & Live Profile
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border flex items-center gap-1 ${
                  myCompanion.pricingTier === "Gold"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : myCompanion.pricingTier === "Platinum"
                    ? "bg-indigo-100 text-indigo-850 border-indigo-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  <span>💎</span>
                  <span>{myCompanion.pricingTier || "Silver"} Category ({myCompanion.pricingTier === "Platinum" ? "+70% higher than Gold (2.21x)" : myCompanion.pricingTier === "Gold" ? "+30% Premium (1.30x)" : "Base Rates (1.00x)"})</span>
                </span>
              </div>
              <h2 className="text-xl font-serif font-bold text-[#1A1A1A] leading-none">{myCompanion.name}</h2>
              <p className="text-xs text-gray-400 font-mono">{myCompanion.city} &bull; Verified Host Companion</p>
            </div>
          </div>

          {/* Availability switch */}
          <div className="flex items-center gap-3.5 bg-[#F9F8F6] px-5 py-3 rounded-2xl border border-[#E5E1D8]/60">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Marketplace Listings</p>
              <p className="text-xs font-bold text-gray-700 mt-1">{myCompanion.isOnline ? "Online & Receiving Bookings" : "Offline / Paused"}</p>
            </div>
            <button
              onClick={() => onToggleOnline(myCompanion.id)}
              className="p-1 cursor-pointer"
            >
              {myCompanion.isOnline ? (
                <ToggleRight className="w-10 h-10 text-green-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Earnings</span>
            <p className="text-2xl font-black text-green-600 mt-1">{totalEarnings.toLocaleString()} PKR</p>
            <p className="text-[10px] text-gray-400 mt-1">Processed securely through manual payment channels.</p>
          </div>
          <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</span>
            <p className="text-2xl font-black text-gray-800 mt-1">{myBookings.length}</p>
            <p className="text-[10px] text-gray-400 mt-1">{myCompletedBookings.length} bookings successfully actioned.</p>
          </div>
          <div className="bg-white border border-[#E5E1D8] p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Rating</span>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-5 h-5 fill-[#D4AF37] stroke-none" />
              <p className="text-2xl font-black text-gray-800">{myCompanion.rating > 0 ? myCompanion.rating.toFixed(1) : "NEW"}</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">From {myCompanion.reviewsCount} verified guest reviews.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active bookings panel */}
          <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm space-y-4 text-left">
            <div className="border-b border-[#E5E1D8]/60 pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Your Bookings Ledger</h3>
              <p className="text-[11px] text-gray-400">Track current hire schedules and social meeting coordinates.</p>
            </div>

            {myBookings.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No hire bookings recorded yet. Go Online to receive requests!</p>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <div key={b.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{b.serviceName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{b.date} &bull; {b.time} ({b.duration} hrs)</p>
                      {b.meetingAddress && (
                        <p className="text-[9px] text-[#D4AF37] font-bold mt-1">📍 {b.meetingLocationType}: {b.meetingAddress}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{b.totalPrice.toLocaleString()} PKR</p>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        b.status === "completed" ? "bg-green-100 text-green-800" :
                        b.status === "paid" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guest Reviews */}
          <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm space-y-4 text-left">
            <div className="border-b border-[#E5E1D8]/60 pb-3">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Guest Feedback</h3>
              <p className="text-[11px] text-gray-400">Reviews submitted by clients who hired your companionship services.</p>
            </div>

            {myReviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No client reviews posted yet. Outstanding reviews will appear here.</p>
            ) : (
              <div className="space-y-3.5">
                {myReviews.map(r => (
                  <div key={r.id} className="p-3 bg-[#F9F8F6] rounded-xl border border-[#E5E1D8]/50 text-xs">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[#1A1A1A]">{r.userName}</p>
                      <div className="flex items-center gap-0.5 text-[#D4AF37]">
                        <Star className="w-3.5 h-3.5 fill-[#D4AF37] stroke-none" />
                        <span className="font-bold">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-500 italic mt-1.5 font-light">"{r.comment}"</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-mono text-right">{r.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Personal Photos Portfolio */}
        <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm space-y-5 text-left">
          <div className="border-b border-[#E5E1D8]/60 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-base font-serif font-black text-[#1A1A1A] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#D4AF37]" />
                <span>My Portfolio Photos (2-3 Pics)</span>
              </h3>
              <p className="text-[11px] text-gray-400">Add 2 to 3 beautiful pictures of yourself to showcase your personality to potential clients.</p>
            </div>
            <div className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider bg-[#FFF4E5] border border-[#FFE0B2] px-2.5 py-1 rounded-full">
              {formPhotos.filter(Boolean).length} of 3 Slots Filled
            </div>
          </div>

          {photosError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{photosError}</span>
            </div>
          )}

          {/* Photo Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[0, 1, 2].map((idx) => {
              const photo = photoPreviews[idx] || formPhotos[idx];
              const isUploadingThisSlot = isPhotoUploading === idx;

              return (
                <div key={idx} className="relative group aspect-square rounded-2xl bg-[#F9F8F6] border-2 border-dashed border-[#E5E1D8] overflow-hidden flex flex-col items-center justify-center p-4 transition-all hover:border-[#D4AF37]/50">
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`Portfolio Photo ${idx + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all shadow-sm opacity-90 hover:opacity-100 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                        Photo {idx + 1}
                      </span>
                    </>
                  ) : (
                    <div className="text-center space-y-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-700">Slot {idx + 1}</p>
                        <p className="text-[10px] text-gray-400">Upload or enter URL</p>
                      </div>

                      {/* URL input and upload button */}
                      <div className="space-y-2 pt-1">
                        <label className="inline-flex items-center gap-1 bg-[#1A1A1A] hover:bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm">
                          <Upload className="w-3 h-3" />
                          <span>{isUploadingThisSlot ? "Uploading..." : "Upload File"}</span>
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
                            placeholder="Or paste image URL"
                            id={`portfolio-url-input-${idx}`}
                            className="w-full text-[10px] bg-white border border-[#E5E1D8] text-gray-800 rounded-md p-1 focus:outline-none focus:border-[#D4AF37] font-sans"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
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
                              const el = document.getElementById(`portfolio-url-input-${idx}`) as HTMLInputElement;
                              if (el && el.value) {
                                handleAddPhotoUrl(el.value, idx);
                                el.value = "";
                              }
                            }}
                            className="p-1 bg-[#D4AF37] text-white rounded-md hover:bg-[#C5A028] transition-all cursor-pointer"
                            title="Add URL"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#E5E1D8]/40">
            <button
              type="button"
              onClick={handleSavePortfolio}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                savePhotosSuccess
                  ? "bg-green-600 text-white"
                  : "bg-[#1A1A1A] hover:bg-black text-white hover:shadow-md"
              }`}
            >
              {savePhotosSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Portfolio Photos Saved!</span>
                </>
              ) : (
                <>
                  <span>Save Portfolio Photos</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    );
  }

  // Case 4: Not registered yet: Render beautiful form!
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {onGoBackToRoleSelection && (
        <div className="flex justify-start">
          <button
            onClick={onGoBackToRoleSelection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-[#F3F0E9]/50 hover:bg-[#E5E1D8]/40 border border-[#E5E1D8] rounded-xl transition-all cursor-pointer shadow-xs"
            id="workspace-back-to-role-btn"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>← Back to Role Selection</span>
          </button>
        </div>
      )}

      <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 sm:p-8 shadow-sm text-left text-[#2D2D2D]" id="become-companion-form-panel">
      <div className="border-b border-[#E5E1D8]/60 pb-4 mb-6">
        <div className="inline-flex p-2.5 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] text-[#E65100] mb-3">
          <Sparkles className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <h2 className="text-2xl font-serif font-black text-[#1A1A1A] tracking-tight">Become a Host Companion</h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Assalam-o-Alaikum! Tell us about yourself and configure your services. All companion listings require manual administration vetting before activation.
        </p>
      </div>

      {formError && (
        <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5" id="companion-application-form">
        
        {/* Basic fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Companion Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                placeholder="e.g. Zara Ahmed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mobile Contact Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                placeholder="e.g. 0300-1234567"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CNIC Number (13 Digits)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Hash className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={formCnic}
                onChange={(e) => setFormCnic(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
                placeholder="e.g. 35201-1234567-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered City</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </span>
              <select
                value={formCity}
                onChange={(e) => setFormCity(e.target.value as any)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-700 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                {PAKISTAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Age</label>
            <input
              type="number"
              required
              min="18"
              max="70"
              value={formAge}
              onChange={(e) => setFormAge(e.target.value)}
              className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 px-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
              placeholder="e.g. 24"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Companion Gender</label>
          <div className="flex gap-4 pt-1">
            {Object.values(CompanionGender).map(g => (
              <label key={g} className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="formGender"
                  value={g}
                  checked={formGender === g}
                  onChange={() => setFormGender(g)}
                  className="w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 accent-[#D4AF37]"
                />
                <span>{g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Interests & Languages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Interests & Hobbies (Comma separated)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Heart className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={formInterests}
                onChange={(e) => setFormInterests(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                placeholder="Reading, Movies, Coffee"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Languages (Comma separated)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={formLanguages}
                onChange={(e) => setFormLanguages(e.target.value)}
                className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                placeholder="Urdu, English, Punjabi"
              />
            </div>
          </div>
        </div>

        {/* Photo URL or Direct Photo */}
        <div className="space-y-3 bg-[#F9F8F6] border border-[#E5E1D8] p-4 rounded-2xl" id="workspace-photo-section">
          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Assign Profile Photo</label>
            <p className="text-[11px] text-gray-500 font-light mt-0.5">Pick a direct photo from presets, upload from your files, or paste a custom URL.</p>
          </div>

          {/* Grid of Clickable Presets */}
          <div className="space-y-1.5">
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Option 1: Direct Photo Presets</span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setFormAvatar(preset.url);
                    setPresetIdx(idx);
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    presetIdx === idx
                      ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-[1.03]"
                      : "border-[#E5E1D8] hover:border-gray-400"
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                  {presetIdx === idx && (
                    <div className="absolute inset-0 bg-[#D4AF37]/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white bg-black/50 rounded-full p-0.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option 2: Direct File Upload</span>
              <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl bg-white cursor-pointer transition-all hover:bg-gray-50 text-xs text-gray-600 font-semibold">
                <Upload className={`w-4 h-4 text-[#D4AF37] ${isUploading ? "animate-bounce" : ""}`} />
                <span>{isUploading ? "Uploading..." : "Upload Profile Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploading(true);
                      setFormError("");
                      
                      try {
                        const { data: sessionData } = await supabase.auth.getSession();
                        const uid = sessionData?.session?.user?.id || "anonymous";
                        
                        // Limit Check: Count uploaded pics first
                        const isHost = user.selectedRole === "companion" || !!myCompanion;
                        const isAppAdmin = user.isAdmin;
                        const hasNoLimits = isAppAdmin || isHost;
                        
                        if (!hasNoLimits) {
                          const picCount = await countUploadedPics(uid);
                          if (picCount >= 3) {
                            setShowLimitModal(true);
                            setIsUploading(false);
                            return;
                          }
                        }
                        
                        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                        const extension = file.name.split('.').pop() || 'png';
                        const filePath = `${uid}/companions/${myCompanionId}/${uuid}.${extension}`;
                        
                        const { error } = await supabase.storage
                          .from("app-files")
                          .upload(filePath, file, { cacheControl: "3600", upsert: true });
                          
                        if (error) {
                          setFormError("Failed to upload image: " + error.message);
                          setIsUploading(false);
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            setAvatarPreview(reader.result);
                            setFormAvatar(filePath);
                            setPresetIdx(-2);
                            setIsUploading(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      } catch (err: any) {
                        setFormError("Upload error: " + (err.message || err));
                        setIsUploading(false);
                      }
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Option 3: Paste Photo URL</span>
              <input
                type="url"
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={presetIdx >= 0 ? "" : (formAvatar.includes("/") && !formAvatar.startsWith("http") ? "" : formAvatar)}
                onChange={(e) => {
                  setFormAvatar(e.target.value);
                  setAvatarPreview("");
                  setPresetIdx(-1);
                }}
                className="w-full bg-white border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {formAvatar && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-dashed border-[#E5E1D8] w-fit mt-1 shadow-sm">
              <img
                src={avatarPreview || formAvatar}
                alt="Form Preview"
                className="w-10 h-10 rounded-full object-cover border border-[#E5E1D8]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
                }}
              />
              <div>
                <p className="text-[10px] font-bold text-[#1A1A1A]">Photo Uploaded / Selected</p>
                <p className="text-[9px] text-gray-400 font-mono truncate max-w-[240px]">
                  {avatarPreview ? "Direct Uploaded Image (Base64)" : (formAvatar.includes("/") && !formAvatar.startsWith("http") ? "Storage path: " + formAvatar : formAvatar)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Photos (2-3 pics) */}
        <div className="bg-[#F3F0E9]/10 border border-[#E5E1D8] p-5 rounded-2xl space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#D4AF37]" />
              <span>Add 2 to 3 Personal Photos of Yourself</span>
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Showcase your friendly face and personality to our community. Upload or add image URLs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => {
              const photo = photoPreviews[idx] || formPhotos[idx];
              const isUploadingThisSlot = isPhotoUploading === idx;

              return (
                <div key={idx} className="relative aspect-square rounded-xl bg-white border border-dashed border-[#E5E1D8] overflow-hidden flex flex-col items-center justify-center p-3 hover:border-[#D4AF37]/50 transition-all">
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`Portfolio Photo Preview ${idx + 1}`}
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
                            id={`form-portfolio-url-${idx}`}
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
                              const el = document.getElementById(`form-portfolio-url-${idx}`) as HTMLInputElement;
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

        {/* Catchy Tagline */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Personal Slogan / Catchy Tagline</label>
          <input
            type="text"
            placeholder="Seeking intelligent conversations, deep listening, and hot karak chai."
            value={formTagline}
            onChange={(e) => setFormTagline(e.target.value)}
            className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detailed Biography / Personal Intro (Min 30 chars)</label>
          <textarea
            required
            rows={4}
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
            placeholder="Describe your personality, hobbies, what makes you a unique companion helper, and how you ensure a polite, respectful meeting experience..."
          />
        </div>

        {/* Offerable Services */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Offerable Services</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {SERVICES.map(s => {
              const isSelected = formServices.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleServiceToggle(s.id)}
                  className={`p-2.5 border rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#1A1C20] text-white border-black" 
                      : "bg-[#F3F0E9]/20 hover:bg-gray-100 border-[#E5E1D8]/60 text-gray-600"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-xs mt-4"
        >
          <Sparkles className="w-4 h-4" />
          <span>Submit Host Application</span>
        </button>
      </form>
      </div>

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
