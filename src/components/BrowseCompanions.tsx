import { useState } from "react";
import { Companion, CompanionGender, CompanionStatus, Service, PAKISTAN_CITIES } from "../types";
import { Search, MapPin, Star, Sparkles, Filter, CheckCircle2, Moon, Utensils, Film, PhoneCall, Sun, Compass, BookOpen, ArrowLeft, Award } from "lucide-react";
import { SERVICES, getTierMultiplier } from "../data/services";
import { SafeImage } from "./SafeImage";

interface BrowseCompanionsProps {
  companions: Companion[];
  onSelectCompanion: (companion: Companion) => void;
  onGoBackToRoleSelection?: () => void;
}

export default function BrowseCompanions({
  companions,
  onSelectCompanion,
  onGoBackToRoleSelection
}: BrowseCompanionsProps) {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [onlyOnline, setOnlyOnline] = useState(false);

  // Filter approved companions
  const approvedCompanions = companions.filter(c => c.status === CompanionStatus.APPROVED);

  // Apply filters
  const filteredCompanions = approvedCompanions.filter(comp => {
    const matchesSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.city.toLowerCase().includes(search.toLowerCase()) ||
      comp.bio.toLowerCase().includes(search.toLowerCase()) ||
      comp.interests.some(interest => interest.toLowerCase().includes(search.toLowerCase()));

    const matchesCity = selectedCity === "All" || comp.city === selectedCity;
    const matchesGender = selectedGender === "All" || comp.gender === selectedGender;
    const matchesService = selectedService === "All" || comp.services.includes(selectedService);
    const matchesOnline = !onlyOnline || comp.isOnline;
    const matchesTier = selectedTier === "All" || (comp.pricingTier || "Silver") === selectedTier;

    return matchesSearch && matchesCity && matchesGender && matchesService && matchesOnline && matchesTier;
  });

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case "dining": return <Utensils className="w-4 h-4 text-orange-600" />;
      case "movie": return <Film className="w-4 h-4 text-purple-600" />;
      case "call": return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case "day_spend": return <Sun className="w-4 h-4 text-amber-600" />;
      case "travel": return <Compass className="w-4 h-4 text-[#D4AF37]" />;
      case "night_spend": return <Moon className="w-4 h-4 text-indigo-600" />;
      case "study": return <BookOpen className="w-4 h-4 text-emerald-600" />;
      default: return null;
    }
  };

  const getServiceName = (serviceId: string) => {
    return SERVICES.find(s => s.id === serviceId)?.name || serviceId;
  };

  return (
    <div className="space-y-10" id="browse-companions-page">
      
      {onGoBackToRoleSelection && (
        <div className="flex justify-start">
          <button
            onClick={onGoBackToRoleSelection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-[#F3F0E9]/50 hover:bg-[#E5E1D8]/40 border border-[#E5E1D8] rounded-xl transition-all cursor-pointer shadow-xs"
            id="browse-back-to-role-btn"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>← Back to Role Selection</span>
          </button>
        </div>
      )}
      
      {/* Intro Greetings & Title Section */}
      <div className="text-center md:text-left space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full">
          ✨ Pakistan's Premium Safety-First Marketplace
        </span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight pt-1">
          Find Your Perfect Companion
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
          Premium social companions providing warmth, safety, and conversation. Filter instantly by clicking any bento block service below.
        </p>
      </div>

      {/* Top Search Bar */}
      <div className="bg-[#1A1A1A] p-6 rounded-3xl shadow-md border border-[#D4AF37]/20 relative overflow-hidden" id="top-search-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative space-y-3 max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
            Live Companion Search
          </h2>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Search className="w-5 h-5 text-[#D4AF37]" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or interests (e.g., 'Lahore', 'swimming', 'Zara')...."
              className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all shadow-inner"
              id="top-search-companions-input"
            />
          </div>
          <p className="text-[11px] text-gray-400 font-light">
            Matches companion names, Pakistani cities (31+ locations supported!), bio context, and specific hobbies or interests.
          </p>
        </div>
      </div>

      {/* INTERACTIVE BENTO GRID OF SERVICES & PRICING */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="services-bento-grid">
        
        {/* Travel Companion - Hero Card (col-span-2 row-span-2) */}
        <div 
          onClick={() => setSelectedService(selectedService === "travel" ? "All" : "travel")}
          className={`md:col-span-2 md:row-span-2 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            selectedService === "travel" 
              ? "bg-[#1A1C20] text-white ring-4 ring-[#D4AF37]" 
              : "bg-[#1A1C20] text-white hover:scale-[1.01]"
          }`}
          id="bento-service-travel"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-[#D4AF37] text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Premium Highlight
              </span>
              <Compass className="w-6 h-6 text-[#D4AF37] animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold tracking-tight text-white">Adventure Together</h3>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                Travel with a verified companion across scenic northern landscapes or city getaways. Safety-vetted hosts, full trip logs, and mutual consent guarantees.
              </p>
            </div>
          </div>
          
          <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-4">
            <div>
              <p className="text-[10px] uppercase text-gray-400 tracking-wider font-semibold">Starting at</p>
              <p className="text-xl font-bold text-[#D4AF37]">Rs. 20,999 <span className="text-xs text-gray-400 font-normal">/ 2 Days</span></p>
            </div>
            <span className={`text-xs font-semibold px-4 py-1.5 rounded-full ${
              selectedService === "travel" ? "bg-[#D4AF37] text-black" : "bg-white/10 text-[#D4AF37]"
            }`}>
              {selectedService === "travel" ? "Selected" : "Filter Travel"}
            </span>
          </div>
        </div>

        {/* Dining - Card */}
        <div 
          onClick={() => setSelectedService(selectedService === "dining" ? "All" : "dining")}
          className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            selectedService === "dining"
              ? "bg-[#FFF4E5] border-[#E65100]/50 ring-2 ring-[#E65100]/40"
              : "bg-[#FFF4E5] border-[#FFE0B2] hover:scale-[1.02]"
          }`}
          id="bento-service-dining"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-white rounded-2xl shadow-sm">
              <Utensils className="w-5 h-5 text-orange-600" />
            </span>
            <span className="text-[11px] font-bold text-[#E65100] uppercase tracking-wider">Dinner</span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="font-bold text-[#2D2D2D] text-sm">Elegant Dinner</h4>
            <p className="text-[11px] text-orange-800/80 leading-snug">Beautiful 2-hour dinner with verified social hosts.</p>
          </div>
          <p className="text-xs font-bold text-[#E65100] mt-3">1,999 PKR <span className="text-[10px] text-orange-800/60 font-normal">/ 2 Hrs</span></p>
        </div>

        {/* Movie - Card */}
        <div 
          onClick={() => setSelectedService(selectedService === "movie" ? "All" : "movie")}
          className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            selectedService === "movie"
              ? "bg-[#F3E5F5] border-[#7B1FA2]/50 ring-2 ring-[#7B1FA2]/40"
              : "bg-[#F3E5F5] border-[#E1BEE7] hover:scale-[1.02]"
          }`}
          id="bento-service-movie"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-white rounded-2xl shadow-sm">
              <Film className="w-5 h-5 text-purple-600" />
            </span>
            <span className="text-[11px] font-bold text-[#7B1FA2] uppercase tracking-wider">Cinema</span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="font-bold text-[#2D2D2D] text-sm">Cinema Night</h4>
            <p className="text-[11px] text-purple-800/80 leading-snug">Watch films together. Your companion, safe presence.</p>
          </div>
          <p className="text-xs font-bold text-[#7B1FA2] mt-3">2,499 PKR <span className="text-[10px] text-purple-800/60 font-normal">/ 3 Hrs</span></p>
        </div>

        {/* Voice Call - Card */}
        <div 
          onClick={() => setSelectedService(selectedService === "call" ? "All" : "call")}
          className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            selectedService === "call"
              ? "bg-[#E1F5FE] border-[#0288D1]/50 ring-2 ring-[#0288D1]/40"
              : "bg-[#E1F5FE] border-[#B3E5FC] hover:scale-[1.02]"
          }`}
          id="bento-service-call"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-white rounded-2xl shadow-sm">
              <PhoneCall className="w-5 h-5 text-blue-600" />
            </span>
            <span className="text-[11px] font-bold text-[#0288D1] uppercase tracking-wider">Voice</span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="font-bold text-[#2D2D2D] text-sm">Heart-to-Heart</h4>
            <p className="text-[11px] text-blue-800/80 leading-snug">Private warm phone calls via corporate secure line.</p>
          </div>
          <p className="text-xs font-bold text-[#0288D1] mt-3">1,000 PKR <span className="text-[10px] text-blue-800/60 font-normal">/ 1 Hr</span></p>
        </div>

        {/* Study Helper - Card */}
        <div 
          onClick={() => setSelectedService(selectedService === "study" ? "All" : "study")}
          className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            selectedService === "study"
              ? "bg-[#E8F5E9] border-[#2E7D32]/50 ring-2 ring-[#2E7D32]/40"
              : "bg-[#E8F5E9] border-[#C8E6C9] hover:scale-[1.02]"
          }`}
          id="bento-service-study"
        >
          <div className="flex justify-between items-start">
            <span className="p-2 bg-white rounded-2xl shadow-sm">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </span>
            <span className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wider">Learn</span>
          </div>
          <div className="mt-4 space-y-1">
            <h4 className="font-bold text-[#2D2D2D] text-sm">Study Buddy</h4>
            <p className="text-[11px] text-emerald-800/80 leading-snug">Increase focus, share thoughts, achieve academic goals.</p>
          </div>
          <p className="text-xs font-bold text-[#2E7D32] mt-3">1,499 PKR <span className="text-[10px] text-emerald-800/60 font-normal">/ 2 Hrs</span></p>
        </div>

        {/* Spend A Day - Bento Wide Card (col-span-2) */}
        <div 
          onClick={() => setSelectedService(selectedService === "day_spend" ? "All" : "day_spend")}
          className={`md:col-span-2 rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 cursor-pointer ${
            selectedService === "day_spend"
              ? "bg-[#FFF9C4] border-[#FBC02D]/50 ring-2 ring-[#FBC02D]/40"
              : "bg-[#FFF9C4] border-[#FFF176] hover:scale-[1.01]"
          }`}
          id="bento-service-day"
        >
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white rounded-xl shadow-sm">
                <Sun className="w-4 h-4 text-amber-600" />
              </span>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Whole Day out</span>
            </div>
            <h4 className="font-bold text-[#2D2D2D] text-base">Spend A Day</h4>
            <p className="text-[11px] text-[#827717] max-w-sm leading-relaxed">
              Plan an 8-hour city exploration or casual meetup. Rest assured, all companion schedules are fully logged for user and companion safety.
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-xs uppercase text-amber-800/60 tracking-wider">Base Price</p>
            <p className="text-lg font-bold text-amber-900">16,999 PKR</p>
            <p className="text-[10px] text-amber-800/60">For 8 Hours</p>
          </div>
        </div>

        {/* Night Spend - Bento Wide Card (col-span-2) */}
        <div 
          onClick={() => setSelectedService(selectedService === "night_spend" ? "All" : "night_spend")}
          className={`md:col-span-2 rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 cursor-pointer ${
            selectedService === "night_spend"
              ? "bg-[#E8EAF6] border-[#3F51B5]/50 ring-2 ring-[#3F51B5]/40"
              : "bg-[#E8EAF6] border-[#C5CAE9] hover:scale-[1.01]"
          }`}
          id="bento-service-night"
        >
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white rounded-xl shadow-sm">
                <Moon className="w-4 h-4 text-indigo-600" />
              </span>
              <span className="text-[10px] font-bold text-[#3F51B5] uppercase tracking-wider">Evening presence</span>
            </div>
            <h4 className="font-bold text-[#2D2D2D] text-base">Secure Night Presence</h4>
            <p className="text-[11px] text-[#1A237E] max-w-sm leading-relaxed">
              Respectful 8-hour evening of elegant social presence, dinner, and quality conversation. Settle loneliness with professional comfort.
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-xs uppercase text-indigo-800/60 tracking-wider">Base Price</p>
            <p className="text-lg font-bold text-indigo-900">16,999 PKR</p>
            <p className="text-[10px] text-indigo-800/60">For 8 Hours</p>
          </div>
        </div>

      </div>

      {/* Search and Filters Hub */}
      <div className="bg-white border border-[#E5E1D8] p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Search bar */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companion by name, interests, bio (e.g., 'psychology', 'coffee', 'Zara')..."
              className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-2xl py-3 pl-10 pr-4 text-[#2D2D2D] text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              id="search-companions-input"
            />
          </div>

          {/* Online Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
                className="sr-only peer"
                id="toggle-online-only"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
              <span className="ml-2.5 text-xs font-bold text-gray-600 uppercase tracking-wider">Online Now Only</span>
            </label>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E5E1D8]/60">
          {/* City Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-white border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              id="filter-city-select"
            >
              <option value="All">All Cities</option>
              {PAKISTAN_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Gender Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Companion Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-white border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              id="filter-gender-select"
            >
              <option value="All">All Genders</option>
              <option value="Female">Female Companions</option>
              <option value="Male">Male Companions</option>
            </select>
          </div>

          {/* Service Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service Type</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-white border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              id="filter-service-select"
            >
              <option value="All">All Services</option>
              {SERVICES.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.basePrice} PKR)</option>
              ))}
            </select>
          </div>

          {/* Pricing Category Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pricing Category</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-white border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              id="filter-tier-select"
            >
              <option value="All">All Categories</option>
              <option value="Silver">Silver (Base rate)</option>
              <option value="Gold">Gold (+30% Premium)</option>
              <option value="Platinum">Platinum (+70% over Gold)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companions Counter */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-400 font-mono">
          Showing <span className="text-[#D4AF37] font-bold">{filteredCompanions.length}</span> verified hosts matching criteria
        </p>
        {(selectedCity !== "All" || selectedGender !== "All" || selectedService !== "All" || selectedTier !== "All" || search || onlyOnline) && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedCity("All");
              setSelectedGender("All");
              setSelectedService("All");
              setSelectedTier("All");
              setOnlyOnline(false);
            }}
            className="text-xs text-[#D4AF37] font-semibold hover:underline cursor-pointer"
            id="btn-clear-filters"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Companions Cards Grid */}
      {filteredCompanions.length === 0 ? (
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-16 text-center shadow-sm" id="no-companions-view">
          <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1A1A1A]">No companions found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, picking a different city, or clearing some filter settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="companions-grid">
          {filteredCompanions.map(comp => (
            <div
              key={comp.id}
              className="group bg-white border border-[#E5E1D8] rounded-3xl overflow-hidden hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between shadow-sm"
              id={`companion-card-${comp.id}`}
            >
              {/* Card Head / Avatar Section */}
              <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                <SafeImage
                  src={comp.avatar}
                  alt={comp.name}
                  referrerPolicy="no-referrer"
                  fallbackType={comp.gender as any}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-500"
                />
                
                {/* City & Status Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1A1C20]/80 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    {comp.city}
                  </span>
                  
                  {comp.featured && (
                    <span className="inline-flex items-center gap-0.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[9px] font-bold text-black uppercase tracking-widest shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" />
                      Featured
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-md text-white ${
                    comp.pricingTier === "Gold"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400"
                      : comp.pricingTier === "Platinum"
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 border border-indigo-400"
                      : "bg-gradient-to-r from-slate-500 to-slate-600 border border-slate-400"
                  }`}>
                    <Award className="w-2.5 h-2.5" />
                    {comp.pricingTier || "Silver"} Category
                  </span>
                </div>

                {/* Online Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${
                    comp.isOnline 
                      ? "bg-white/90 text-green-700 border border-green-200" 
                      : "bg-gray-100/90 text-gray-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${comp.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    {comp.isOnline ? "Online" : "Away"}
                  </span>
                </div>

                {/* Info Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                      {comp.name}
                      <span className="text-sm text-gray-200 font-normal">({comp.age})</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 bg-[#D4AF37] text-black px-2 py-0.5 rounded text-xs font-extrabold shadow-sm">
                    <Star className="w-3 h-3 fill-black stroke-none" />
                    <span>{comp.rating > 0 ? comp.rating.toFixed(1) : "NEW"}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                {comp.tagline && (
                  <p className="text-xs italic text-[#C5A028] font-semibold font-serif leading-snug border-l-2 border-[#D4AF37]/70 pl-2">
                    "{comp.tagline}"
                  </p>
                )}
                
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {comp.bio}
                </p>

                {/* Interests Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {comp.interests.slice(0, 3).map((int, i) => (
                    <span key={i} className="text-[10px] bg-[#F3F0E9] text-gray-600 border border-[#E5E1D8]/40 px-2.5 py-1 rounded-md font-mono">
                      #{int}
                    </span>
                  ))}
                  {comp.interests.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      +{comp.interests.length - 3} more
                    </span>
                  )}
                </div>

                {/* Services Provided Row */}
                <div className="pt-4 border-t border-[#E5E1D8]/50 space-y-2">
                  <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest">
                    <span>Available Services & Rates:</span>
                    <span className="font-mono text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-[#E5E1D8]">
                      Rate: {comp.pricingTier === "Platinum" ? "2.21x" : comp.pricingTier === "Gold" ? "1.30x" : "1.00x"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.services.map(sid => {
                      const service = SERVICES.find(s => s.id === sid);
                      if (!service) return null;
                      const mult = getTierMultiplier(comp.pricingTier);
                      const adjPrice = Math.round(service.basePrice * mult);
                      return (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-1 text-[10px] bg-[#F3F0E9]/60 hover:bg-[#F3F0E9] text-gray-700 border border-[#E5E1D8]/60 px-2 py-1 rounded-lg transition-all"
                          title={`${service.name}: ${adjPrice.toLocaleString()} PKR for ${service.baseHours} ${service.id === "call" ? "minutes" : "hours"}`}
                        >
                          {getServiceIcon(sid)}
                          <span className="font-semibold text-[9px] uppercase text-gray-700">{service.name.split(" ")[0]}</span>
                          <span className="text-orange-600 font-black font-mono ml-0.5 text-[9px]">{adjPrice.toLocaleString()} PKR</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Call-to-action button */}
                <button
                  onClick={() => onSelectCompanion(comp)}
                  className="w-full mt-2 py-3 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  id={`btn-view-companion-${comp.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>View Details & Book</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
