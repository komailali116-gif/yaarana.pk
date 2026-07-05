import React, { useState, useEffect } from "react";
import { Companion, Service, Review, Booking } from "../types";
import { SERVICES, calculatePrice, getTierMultiplier } from "../data/services";
import { getStoredReviews } from "../lib/storage";
import { X, Star, Calendar, Clock, Sparkles, MapPin, Check, BookOpen, AlertCircle, HeartHandshake, ShieldCheck, Utensils, Film, PhoneCall, Sun, Compass, Moon, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface CompanionDetailModalProps {
  companion: Companion;
  onClose: () => void;
  onProceedToPayment: (bookingDetail: {
    serviceId: string;
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    totalPrice: number;
    meetingLocationType: string;
    meetingAddress: string;
    meetingInstructions: string;
  }) => void;
}

export default function CompanionDetailModal({
  companion,
  onClose,
  onProceedToPayment
}: CompanionDetailModalProps) {
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");

  // Step navigation inside checkout panel
  const [checkoutStep, setCheckoutStep] = useState<"details" | "location">("details");

  // Meeting location details
  const [meetingLocationType, setMeetingLocationType] = useState("Public Cafe");
  const [meetingAddress, setMeetingAddress] = useState("");
  const [meetingInstructions, setMeetingInstructions] = useState("");

  // Custom Calendar Date Picker states & helpers
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const today = new Date();
      if (newDate.getFullYear() < today.getFullYear() || 
          (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() < today.getMonth())) {
        return prev;
      }
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDate(dateString);
    setShowCalendar(false);
  };

  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days in current month
    for (let day = 1; day <= daysCount; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < today;
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = date === dateString;
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => selectDay(day)}
          className={`h-8 w-8 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
            isPast 
              ? "text-gray-300 cursor-not-allowed bg-transparent opacity-40" 
              : isSelected
                ? "bg-[#1A1C20] text-[#D4AF37] font-bold shadow-md scale-110"
                : isToday
                  ? "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#F3F0E9]/60 font-bold"
                  : "text-gray-700 hover:bg-[#F3F0E9] hover:scale-105"
          }`}
          title={isPast ? "Unavailable" : `Select ${formatSelectedDate(dateString)}`}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  // Load reviews for this companion
  useEffect(() => {
    const allReviews = getStoredReviews();
    const filtered = allReviews.filter(r => r.companionId === companion.id);
    setReviews(filtered);
  }, [companion.id]);

  // Find the list of actual Services this companion offers
  const availableServices = SERVICES.filter(s => companion.services.includes(s.id));

  // Default select first available service
  useEffect(() => {
    if (availableServices.length > 0) {
      setSelectedServiceId(availableServices[0].id);
    }
  }, [companion]);

  // Set default duration based on selected service
  const activeService = SERVICES.find(s => s.id === selectedServiceId);
  useEffect(() => {
    if (activeService) {
      if (activeService.id === "call") {
        setDuration(60); // 60 minutes default
      } else {
        setDuration(activeService.baseHours); // base hours default
      }
    }
  }, [selectedServiceId, activeService]);

  const getVenueRecommendation = (serviceId: string, city: string) => {
    if (serviceId === "call") {
      return "Secure Phone Call / Virtual Meeting Link (auto-generated)";
    }
    switch (city) {
      case "Karachi":
        if (serviceId === "dining") return "Kolachi Restaurant, DHA Phase 8, Karachi";
        if (serviceId === "movie") return "Nueplex Cinemas, DHA Phase 8, Karachi";
        if (serviceId === "study") return "British Council Library, Karachi";
        if (serviceId === "travel") return "Jinnah International Airport, Karachi";
        return "Dolmen Mall, Clifton, Karachi";
      case "Islamabad":
        if (serviceId === "dining") return "The Monal Restaurant, Margalla Hills, Islamabad";
        if (serviceId === "movie") return "Centaurus Mall Cinema, F-8, Islamabad";
        if (serviceId === "study") return "National Library of Pakistan, Islamabad";
        if (serviceId === "travel") return "Islamabad International Airport";
        return "F-6 Markaz Gloria Jean's, Islamabad";
      case "Faisalabad":
        if (serviceId === "dining") return "Salt'n Pepper Restaurant, Kohinoor City, Faisalabad";
        if (serviceId === "movie") return "Cinepax, Hotel One, Faisalabad";
        if (serviceId === "study") return "Sandat Public Library, Faisalabad";
        if (serviceId === "travel") return "Faisalabad International Airport";
        return "Kohinoor City Commercial Area, Faisalabad";
      case "Rawalpindi":
        if (serviceId === "dining") return "Savour Foods, Food Street, Rawalpindi";
        if (serviceId === "movie") return "The Arena Cinema, Bahria Town, Rawalpindi";
        if (serviceId === "study") return "Rawalpindi Public Library, Rawalpindi";
        if (serviceId === "travel") return "Rawalpindi Railway Station";
        return "Saddar Commercial Center, Rawalpindi";
      default: // Lahore
        if (serviceId === "dining") return "Arcadian Cafe, Gulberg III, Lahore";
        if (serviceId === "movie") return "Cue Cinemas, Gulberg, Lahore";
        if (serviceId === "study") return "British Council Library, Lahore";
        if (serviceId === "travel") return "Allama Iqbal International Airport, Lahore";
        return "Emporium Mall, Johar Town, Lahore";
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please select a date for your companionship session.");
      return;
    }
    if (!time) {
      setError("Please select a convenient time.");
      return;
    }

    if (activeService) {
      const minDuration = activeService.id === "call" ? 10 : activeService.baseHours;
      if (duration < minDuration) {
        setError(`Minimum booking duration is ${minDuration} ${activeService.extraUnitName === "minute" ? "minutes" : "hours"}.`);
        return;
      }

      if (checkoutStep === "details") {
        // Prepopulate default venue if empty
        const defaultVenue = getVenueRecommendation(activeService.id, companion.city);
        setMeetingAddress(defaultVenue);
        setCheckoutStep("location");
        return;
      }

      if (checkoutStep === "location") {
        if (!meetingAddress.trim()) {
          setError("Please enter a specific meeting address, venue name, or virtual room link.");
          return;
        }

        const calculated = calculatePrice(activeService.id, duration, companion.pricingTier);
        onProceedToPayment({
          serviceId: activeService.id,
          serviceName: activeService.name,
          date,
          time,
          duration,
          totalPrice: calculated,
          meetingLocationType,
          meetingAddress: meetingAddress.trim(),
          meetingInstructions: meetingInstructions.trim() || "Meet in a public space and respect physical guidelines."
        });
      }
    }
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case "dining": return <Utensils className="w-5 h-5" />;
      case "movie": return <Film className="w-5 h-5" />;
      case "call": return <PhoneCall className="w-5 h-5" />;
      case "day_spend": return <Sun className="w-5 h-5" />;
      case "travel": return <Compass className="w-5 h-5" />;
      case "night_spend": return <Moon className="w-5 h-5" />;
      case "study": return <BookOpen className="w-5 h-5" />;
      default: return null;
    }
  };

  const totalPrice = activeService ? calculatePrice(activeService.id, duration, companion.pricingTier) : 0;
  const mult = getTierMultiplier(companion.pricingTier);
  const adjBasePrice = activeService ? Math.round(activeService.basePrice * mult) : 0;
  const adjExtraHourPrice = activeService ? Math.round(activeService.extraHourPrice * mult) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1C20]/40 backdrop-blur-md flex justify-center items-start p-4 sm:p-6 md:p-10" id="companion-modal-overlay">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row my-auto" id="companion-detail-modal">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer border border-[#E5E1D8] transition-all shadow-sm"
          id="btn-close-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Companion Profile details */}
        <div className="w-full lg:w-3/5 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh] lg:max-h-[85vh]">
          
          {/* Cover & Avatar Header */}
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <img
              src={companion.avatar}
              alt={companion.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#D4AF37] shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">{companion.name}</h2>
                <span className="text-gray-400 font-mono text-sm font-semibold">({companion.age})</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-xs text-white ${
                  companion.pricingTier === "Gold"
                    ? "bg-amber-500 border border-amber-400"
                    : companion.pricingTier === "Platinum"
                    ? "bg-indigo-500 border border-indigo-400"
                    : "bg-slate-500 border border-slate-450"
                }`}>
                  {companion.pricingTier || "Silver"} Tier
                </span>
              </div>

              {companion.tagline && (
                <p className="text-xs italic font-serif text-[#C5A028] font-bold leading-snug">
                  "{companion.tagline}"
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {companion.city}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                  <strong className="text-gray-800">{companion.rating > 0 ? companion.rating.toFixed(1) : "NEW"}</strong> 
                  ({companion.reviewsCount} reviews)
                </span>
                <span>&bull;</span>
                <span className={`inline-flex items-center gap-1 font-bold ${companion.isOnline ? "text-green-600" : "text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${companion.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                  {companion.isOnline ? "Online" : "Away"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {companion.languages.map((lang, idx) => (
                  <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium border border-[#E5E1D8]/40">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">About Me</h4>
            <p className="text-sm text-gray-600 leading-relaxed font-light">
              {companion.bio}
            </p>
          </div>

          {/* Interests tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Interests & Hobbies</h4>
            <div className="flex flex-wrap gap-2">
              {companion.interests.map((int, idx) => (
                <span key={idx} className="text-xs bg-[#F3F0E9] text-gray-700 border border-[#E5E1D8]/50 px-3 py-1 rounded-full">
                  #{int}
                </span>
              ))}
            </div>
          </div>

          {/* Personal Photos Portfolio */}
          {companion.photos && companion.photos.filter(Boolean).length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span>📸</span>
                <span>Personal Photos Portfolio</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {companion.photos.filter(Boolean).map((photo, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setZoomedPhoto(photo)}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-xs group bg-[#F9F8F6] cursor-pointer hover:border-[#D4AF37] transition-all"
                  >
                    <img
                      src={photo}
                      alt={`${companion.name} portfolio photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all flex items-end justify-start p-2">
                      <span className="text-[9px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-lg backdrop-blur-xs font-sans">
                        View Photo {idx + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mutual Respect Disclaimer banner */}
          <div className="p-4 rounded-2xl bg-[#FFF4E5] border border-[#FFE0B2] flex gap-3 text-xs text-orange-900">
            <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Mutual Respect Guarantee</p>
              <p className="mt-0.5 leading-relaxed text-[11px] text-orange-850">
                Yarana.pk enforces strict regulations. All companions must be treated with absolute dignity. Any physical safety breach or verbal harassment results in severe penalization and an immediate database lock.
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-[#E5E1D8]/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Client Reviews ({reviews.length})</h4>
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No reviews yet for this companion.</p>
            ) : (
              <div className="space-y-3.5">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-[#F3F0E9]/10 border border-[#E5E1D8]/40 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-[#E5E1D8]"
                        />
                        <span className="text-xs font-semibold text-gray-800">{rev.userName}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#D4AF37]">
                        {Array.from({ length: Math.round(rev.rating) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#D4AF37] stroke-none" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono text-right">{rev.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Administrative Pricing Booking panel */}
        <div className="w-full lg:w-2/5 p-6 md:p-8 bg-gray-50 border-t lg:border-t-0 lg:border-l border-[#E5E1D8] flex flex-col justify-between max-h-[90vh] lg:max-h-[85vh] overflow-y-auto">
          
          <div className="space-y-5">
            {/* Header with Step Indicator */}
            <div className="border-b border-[#E5E1D8]/60 pb-4">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1">
                {checkoutStep === "details" ? "Step 1: Session Controls" : "Step 2: Meeting Coordinates"}
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
                {checkoutStep === "details" ? "Configure Session" : "Schedule Meeting"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {checkoutStep === "details" 
                  ? "Select rates, date, time, and session length." 
                  : "Establish the exact local venue and guidelines for security."}
              </p>
            </div>

            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between gap-2 bg-white border border-[#E5E1D8]/65 rounded-2xl p-2.5 text-[11px] font-bold shadow-sm">
              <button
                type="button"
                onClick={() => setCheckoutStep("details")}
                className={`flex-1 text-center pb-1 border-b-2 transition-all cursor-pointer ${
                  checkoutStep === "details" 
                    ? "text-[#D4AF37] border-[#D4AF37]" 
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                1. Date &amp; Hours
              </button>
              <div className="text-gray-300 font-normal">&rarr;</div>
              <button
                type="button"
                disabled={!date || !time}
                onClick={() => {
                  const defaultVenue = getVenueRecommendation(activeService?.id || "dining", companion.city);
                  setMeetingAddress(prev => prev || defaultVenue);
                  setCheckoutStep("location");
                }}
                className={`flex-1 text-center pb-1 border-b-2 transition-all cursor-pointer ${
                  checkoutStep === "location" 
                    ? "text-[#D4AF37] border-[#D4AF37]" 
                    : "text-gray-400 border-transparent hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                2. Venue Location
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs flex gap-1.5 items-center">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              
              {/* STEP 1: CONFIGURE DETAILS */}
              {checkoutStep === "details" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Select Service */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Companion Service</label>
                    <div className="grid grid-cols-1 gap-2">
                      {availableServices.map(s => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedServiceId(s.id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedServiceId === s.id
                              ? "bg-[#FFF4E5] border-[#FFE0B2] shadow-sm"
                              : "bg-white border-[#E5E1D8] hover:bg-gray-50"
                          }`}
                          id={`booking-service-choice-${s.id}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${selectedServiceId === s.id ? "bg-[#1A1C20] text-[#D4AF37]" : "bg-[#F3F0E9] text-gray-600"}`}>
                              {getServiceIcon(s.id)}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-[#1A1A1A]">{s.name}</p>
                              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                                {Math.round(s.basePrice * getTierMultiplier(companion.pricingTier)).toLocaleString()} PKR for {s.baseHours} {s.id === "call" ? "minutes" : "hours"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedServiceId === s.id ? "border-[#D4AF37] bg-[#D4AF37] text-white" : "border-gray-300"}`}>
                              {selectedServiceId === s.id && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Specs Details */}
                  {activeService && (
                    <div className="p-3.5 bg-white border border-[#E5E1D8] rounded-2xl space-y-1.5 text-xs text-gray-650 shadow-sm">
                      <p className="font-bold text-[#1A1A1A] flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Service Guidelines:
                      </p>
                      <p className="leading-relaxed text-[11px] text-gray-500">{activeService.description}</p>
                      <p className="text-[11px] text-[#E65100] italic"><strong className="text-gray-700">Note: </strong>{activeService.userResponsibility}</p>
                    </div>
                  )}

                  {/* Select Date and Time */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Visual Date Trigger */}
                      <div className="space-y-1 relative">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose Date</label>
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className={`w-full bg-white border rounded-xl py-2.5 px-3 text-xs text-gray-800 flex items-center justify-between focus:outline-none transition-all cursor-pointer shadow-sm ${
                            showCalendar ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#E5E1D8] hover:border-[#D4AF37]"
                          }`}
                          id="booking-date-picker-trigger"
                        >
                          <span className="flex items-center gap-1.5 text-left font-medium">
                            <CalendarDays className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                            <span>{date ? formatSelectedDate(date) : "Select date..."}</span>
                          </span>
                          <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">
                            {showCalendar ? "Close" : "Change"}
                          </span>
                        </button>
                      </div>

                      {/* Choose Time */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose Time</label>
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-white border border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-sm"
                          id="booking-time-input"
                        />
                      </div>
                    </div>

                    {/* Inline Visual Calendar component */}
                    {showCalendar && (
                      <div className="bg-[#F3F0E9]/40 border border-[#E5E1D8] rounded-2xl p-4 space-y-3 shadow-inner animate-fade-in" id="visual-calendar-picker">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 font-serif">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handlePrevMonth}
                              className="p-1 rounded-lg bg-white border border-[#E5E1D8] hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              disabled={
                                currentMonth.getFullYear() === new Date().getFullYear() &&
                                currentMonth.getMonth() === new Date().getMonth()
                              }
                              title="Previous Month"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1 rounded-lg bg-white border border-[#E5E1D8] hover:bg-gray-100 text-gray-600 cursor-pointer"
                              title="Next Month"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Days of week */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <div>Su</div>
                          <div>Mo</div>
                          <div>Tu</div>
                          <div>We</div>
                          <div>Th</div>
                          <div>Fr</div>
                          <div>Sa</div>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                          {renderCalendarDays()}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono pt-2 border-t border-[#E5E1D8]/60">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-[#D4AF37]" />
                            Today
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#1A1C20]" />
                            Selected
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-200/45 opacity-40" />
                            Past / N/A
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Set Duration Input (hours / minutes) */}
                  {activeService && (
                    <div className="space-y-1.5 bg-white border border-[#E5E1D8] p-3.5 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-450">
                          Total Duration Requested:
                        </span>
                        <span className="text-[#D4AF37] font-black uppercase text-xs">
                          {duration} {activeService.extraUnitName === "minute" ? "Minutes" : "Hours"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        <input
                          type="range"
                          min={activeService.id === "call" ? 30 : activeService.baseHours}
                          max={activeService.id === "call" ? 300 : activeService.id === "travel" ? 120 : 24}
                          step={activeService.id === "call" ? 10 : 1}
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
                        <span>Base: {activeService.baseHours} {activeService.id === "travel" ? "days" : activeService.id === "call" ? "mins" : "hours"}</span>
                        <span>Max: {activeService.id === "call" ? "300 mins" : activeService.id === "travel" ? "5 days" : "24 hours"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: CHOOSE LOCATION AND MEETING ENVIRONMENT */}
              {checkoutStep === "location" && activeService && (
                <div className="space-y-4 animate-fade-in">
                  {/* Meeting Environment types */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting Environment</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: "Public Cafe", label: "Public Cafe" },
                        { id: "Restaurant", label: "Fine Dining" },
                        { id: "Cinema Mall", label: "Cinema / Mall" },
                        { id: "Tourist Spot", label: "Tourist Spot" },
                        { id: "Online Call", label: "Virtual Call" },
                        { id: "Custom Landmark", label: "Custom Venue" }
                      ].map(env => (
                        <button
                          key={env.id}
                          type="button"
                          onClick={() => {
                            setMeetingLocationType(env.id);
                            const rec = getVenueRecommendation(
                              env.id === "Online Call" ? "call" : env.id === "Restaurant" ? "dining" : env.id === "Cinema Mall" ? "movie" : env.id === "Tourist Spot" ? "travel" : "study",
                              companion.city
                            );
                            setMeetingAddress(rec);
                          }}
                          className={`p-2.5 rounded-xl border font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                            meetingLocationType === env.id
                              ? "bg-[#FFF4E5] border-[#FFE0B2] text-orange-950 shadow-sm font-bold"
                              : "bg-white border-[#E5E1D8] text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{env.label}</span>
                          {meetingLocationType === env.id && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exact meeting venue input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exact Meeting Venue Address / Link</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                        <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      </span>
                      <input
                        type="text"
                        required
                        value={meetingAddress}
                        onChange={(e) => setMeetingAddress(e.target.value)}
                        placeholder="e.g. Arcadian Cafe, Gulberg III, Lahore"
                        className="w-full bg-white border border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:outline-none focus:border-[#D4AF37] shadow-sm font-semibold"
                        id="booking-meeting-address-input"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">
                      Yarana recommendation for {companion.city}: <strong className="text-gray-600">{getVenueRecommendation(activeService.id, companion.city)}</strong>
                    </p>
                  </div>

                  {/* Guidelines text */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructions for Companion Host</label>
                    <textarea
                      rows={2}
                      value={meetingInstructions}
                      onChange={(e) => setMeetingInstructions(e.target.value)}
                      placeholder="e.g. I will wait outside the main glass entrance. Please contact me upon arrival."
                      className="w-full bg-white border border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#D4AF37] shadow-sm resize-none font-medium"
                      id="booking-meeting-instructions-input"
                    />
                  </div>

                  {/* Safety & Respect Checklist */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl space-y-1 text-[10px] text-blue-900 leading-relaxed">
                    <p className="font-bold text-blue-950 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Safety Scheduling Regulations:
                    </p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-blue-800">
                      <li>Always choose a neutral, busy public environment.</li>
                      <li>Verbal or physical safety breaches result in severe legal and system penalization.</li>
                      <li>Hosts are authorized to leave immediately if comfort protocols are breached.</li>
                    </ul>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Pricing Breakdown Card & Step Switch Action */}
          {activeService && (
            <div className="mt-6 pt-5 border-t border-[#E5E1D8]/60 space-y-4">
              <div className="bg-white border border-[#E5E1D8] p-4 rounded-2xl space-y-2 text-xs shadow-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Session ({activeService.name}):</span>
                  <span>{date} at {time}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Base Rate ({activeService.baseHours} {activeService.id === "call" ? "minutes" : "hours"}):</span>
                  <span>{adjBasePrice.toLocaleString()} PKR</span>
                </div>

                {/* Extra pricing line */}
                {activeService.id === "call" ? (
                  duration > 60 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Extra minutes ({duration - 60} min &bull; {adjExtraHourPrice} PKR/m):</span>
                      <span>{((duration - 60) * adjExtraHourPrice).toLocaleString()} PKR</span>
                    </div>
                  )
                ) : (
                  duration > activeService.baseHours && (
                    <div className="flex justify-between text-gray-400">
                      <span>
                        Extra hours ({duration - activeService.baseHours}h &bull; {adjExtraHourPrice} PKR/h):
                      </span>
                      <span>{(totalPrice - adjBasePrice).toLocaleString()} PKR</span>
                    </div>
                  )
                )}

                {/* Tier information banner if not base (Silver) */}
                {companion.pricingTier && companion.pricingTier !== "Silver" && (
                  <div className="mt-2 p-2 rounded-xl bg-orange-50 border border-orange-100 text-[10px] text-orange-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                    <span>
                      Pricing calculated based on <strong>{companion.name}</strong>'s <strong>{companion.pricingTier} Category</strong> rate multiplier.
                    </span>
                  </div>
                )}

                <div className="h-px bg-[#E5E1D8]/60 my-2" />
                <div className="flex justify-between items-center font-bold text-sm text-[#1A1A1A]">
                  <span>Grand Total Rate:</span>
                  <span className="text-orange-600 text-lg font-black">{totalPrice.toLocaleString()} PKR</span>
                </div>
              </div>

              {/* Dynamic Action Buttons based on Step */}
              {checkoutStep === "details" ? (
                <button
                  type="button"
                  onClick={handleBookingSubmit}
                  className="w-full py-4 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  id="btn-modal-continue-location"
                >
                  <span>Set Meeting Location &rarr;</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("details")}
                    className="w-1/3 py-4 bg-white border border-[#E5E1D8] text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
                    id="btn-modal-back-details"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    onClick={handleBookingSubmit}
                    className="w-2/3 py-4 bg-orange-600 hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    id="btn-modal-checkout"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Confirm & Pay</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Lightbox Photo Zoom Portal */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedPhoto(null)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
            onClick={() => setZoomedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomedPhoto} 
            alt="Zoomed Portfolio Pic" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

    </div>
  );
}
