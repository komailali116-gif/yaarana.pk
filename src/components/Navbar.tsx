import { UserProfile } from "../types";
import { 
  Sparkles, Shield, User, Wallet, ShieldAlert, CalendarRange, 
  HeartHandshake, LogOut, RefreshCw, Briefcase, Eye 
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: UserProfile;
  onLogout: () => void;
  onToggleAdmin: () => void;
  onSwitchRole?: (role: "client" | "companion") => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  profile,
  onLogout,
  onToggleAdmin,
  onSwitchRole
}: NavbarProps) {
  const isCompanionMode = profile.selectedRole === "companion";

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E1D8] backdrop-blur-md shadow-sm" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div 
            onClick={() => {
              if (profile.isAdmin) {
                setCurrentTab("admin");
              } else if (isCompanionMode) {
                setCurrentTab("become_companion");
              } else {
                setCurrentTab("browse");
              }
            }}
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-logo"
          >
            <div className="w-9 h-9 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-all shadow-sm">
              Y
            </div>
            <span className="font-serif text-xl font-bold text-[#1A1A1A] tracking-tight">
              Yarana<span className="text-[#D4AF37]">.pk</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {profile.isAdmin ? (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer bg-[#1A1C20] text-[#D4AF37] border border-[#D4AF37]/50`}
                id="nav-tab-admin"
              >
                <Shield className="w-3.5 h-3.5" />
                Governance Panel
              </button>
            ) : isCompanionMode ? (
              <>
                <button
                  onClick={() => setCurrentTab("become_companion")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentTab === "become_companion"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-gray-600 hover:text-[#D4AF37]"
                  }`}
                  id="nav-tab-workspace"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>My Host Workspace</span>
                </button>
                <button
                  onClick={() => setCurrentTab("safety")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentTab === "safety"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-gray-600 hover:text-[#D4AF37]"
                  }`}
                  id="nav-tab-safety-companion"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Host Safety Guidelines</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentTab("browse")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    currentTab === "browse"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-gray-600 hover:text-[#D4AF37]"
                  }`}
                  id="nav-tab-browse"
                >
                  Browse Hosts
                </button>
                <button
                  onClick={() => setCurrentTab("bookings")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    currentTab === "bookings" || currentTab === "account"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-gray-600 hover:text-[#D4AF37]"
                  }`}
                  id="nav-tab-bookings"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setCurrentTab("safety")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    currentTab === "safety"
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-gray-600 hover:text-[#D4AF37]"
                  }`}
                  id="nav-tab-safety"
                >
                  Safety First
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Mode switch Controls */}
          <div className="flex items-center gap-3">
            {/* Direct Switch Role (Host vs Client) Badge in Header */}
            {!profile.isAdmin && onSwitchRole && (
              <button
                onClick={() => onSwitchRole(isCompanionMode ? "client" : "companion")}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-sm border ${
                  isCompanionMode 
                    ? "bg-[#FFF4E5] border-[#FFE0B2] text-amber-700 hover:bg-[#FFE0B2]"
                    : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                }`}
                title={isCompanionMode ? "Switch to hire companions" : "Switch to register / manage your companion host profile"}
                id="nav-switch-role-btn"
              >
                {isCompanionMode ? (
                  <>
                    <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Switch to Client Mode</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>Become a Host</span>
                  </>
                )}
              </button>
            )}



            {/* Quick Demo Role Switcher */}
            {profile.email?.toLowerCase() === "komailali116@gmail.com" && (
              <button
                onClick={onToggleAdmin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F3F0E9] text-[10px] sm:text-[11px] font-semibold text-gray-600 hover:text-[#D4AF37] cursor-pointer transition-all border border-[#E5E1D8]"
                title="Quickly toggle between regular User and Admin roles for testing!"
                id="nav-toggle-admin-role"
              >
                <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                <span>{profile.isAdmin ? "Use Client" : "Use Admin"}</span>
              </button>
            )}

            {/* Profile Avatar Trigger */}
            <div 
              onClick={() => {
                if (!profile.isAdmin) {
                  setCurrentTab(isCompanionMode ? "become_companion" : "account");
                }
              }}
              className="flex items-center gap-2 cursor-pointer bg-[#F3F0E9] hover:bg-[#E5E1D8]/40 transition-all px-3 py-1.5 rounded-full border border-[#E5E1D8]"
              id="nav-avatar-trigger"
            >
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-white"
              />
              <div className="hidden lg:block text-right pr-0.5">
                <p className="text-[10px] font-bold uppercase text-gray-400 leading-none">
                  {profile.isAdmin ? "Admin" : isCompanionMode ? "Host" : "Guest"}
                </p>
                <p className="text-xs font-semibold text-gray-800 truncate max-w-[100px] leading-tight mt-0.5">{profile.name.split(" ")[0]}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-all"
              title="Log out"
              id="nav-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Submenu Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#E5E1D8] bg-white py-2 px-2" id="nav-mobile-bar">
        {profile.isAdmin ? (
          <button
            onClick={() => setCurrentTab("admin")}
            className="flex flex-col items-center gap-0.5 text-[11px] text-[#D4AF37] font-bold"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Control</span>
          </button>
        ) : isCompanionMode ? (
          <>
            <button
              onClick={() => setCurrentTab("become_companion")}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition-all ${
                currentTab === "become_companion" ? "text-[#D4AF37] font-bold" : "text-gray-500"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => onSwitchRole && onSwitchRole("client")}
              className="flex flex-col items-center gap-0.5 text-[11px] text-indigo-600 font-bold"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Guest Mode</span>
            </button>
            <button
              onClick={() => setCurrentTab("safety")}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition-all ${
                currentTab === "safety" ? "text-[#D4AF37] font-bold" : "text-gray-500"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Safety</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentTab("browse")}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition-all ${
                currentTab === "browse" ? "text-[#D4AF37] font-bold" : "text-gray-500"
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Browse</span>
            </button>
            <button
              onClick={() => setCurrentTab("bookings")}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition-all ${
                currentTab === "bookings" || currentTab === "account" ? "text-[#D4AF37] font-bold" : "text-gray-500"
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Bookings</span>
            </button>
            <button
              onClick={() => onSwitchRole && onSwitchRole("companion")}
              className="flex flex-col items-center gap-0.5 text-[11px] text-indigo-600 font-bold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Host Mode</span>
            </button>
            <button
              onClick={() => setCurrentTab("safety")}
              className={`flex flex-col items-center gap-0.5 text-[11px] transition-all ${
                currentTab === "safety" ? "text-[#D4AF37] font-bold" : "text-gray-500"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Safety</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
