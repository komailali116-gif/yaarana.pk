import React from "react";
import { motion } from "motion/react";
import { HeartHandshake, Sparkles, LogOut, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";
import { UserProfile } from "../types";

interface RoleSelectionPageProps {
  user: UserProfile;
  onSelectRole: (role: "client" | "companion") => void;
  onLogout: () => void;
}

export default function RoleSelectionPage({ user, onSelectRole, onLogout }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2D2D2D] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial soft lights */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Spacer Header */}
      <div className="flex justify-between items-center max-w-4xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
            Y
          </div>
          <span className="font-serif text-lg font-bold text-[#1A1A1A] tracking-tight">
            Yarana<span className="text-[#D4AF37]">.pk</span>
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E1D8] bg-white text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content Choice Area */}
      <div className="max-w-4xl w-full mx-auto my-auto py-10 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3 mb-10"
        >
          <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-[0.2em] bg-[#FFF4E5] border border-[#FFE0B2] px-3 py-1 rounded-full inline-block">
            Welcome, {user.name}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#1A1A1A] tracking-tight leading-tight">
            Choose Your Purpose on Yarana<span className="text-[#D4AF37]">.pk</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed font-light">
            Pakistan's premier, safety-first companionship gateway. Whether you are looking to hire high-quality companion hosts or register to offer verified services, we've got you covered.
          </p>
        </motion.div>

        {/* Choice Cards (Bento style grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1: Hire a Companion */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            onClick={() => onSelectRole("client")}
            className="group relative bg-white border border-[#E5E1D8] hover:border-[#D4AF37] p-8 rounded-3xl text-left transition-all hover:shadow-lg hover:scale-[1.01] flex flex-col justify-between min-h-[280px] cursor-pointer"
            id="role-select-client-card"
          >
            <div>
              <div className="p-3 bg-[#FFF4E5] border border-[#FFE0B2] text-[#E65100] rounded-2xl w-fit group-hover:scale-110 transition-all shadow-sm">
                <HeartHandshake className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A] mt-5">
                Hire a Companion
              </h3>
              <p className="text-[11px] text-gray-500 mt-2 font-light leading-relaxed">
                Connect with highly qualified, respectful, and fully verified companions for dining, social gatherings, exam prep/study aid, phone support, or group travel.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>100% Verified Profiles</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-wider text-[#D4AF37] group-hover:translate-x-1.5 transition-all">
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* Card 2: Become a Companion */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onClick={() => onSelectRole("companion")}
            className="group relative bg-white border border-[#E5E1D8] hover:border-[#D4AF37] p-8 rounded-3xl text-left transition-all hover:shadow-lg hover:scale-[1.01] flex flex-col justify-between min-h-[280px] cursor-pointer"
            id="role-select-companion-card"
          >
            <div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition-all shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A] mt-5">
                Become a Companion
              </h3>
              <p className="text-[11px] text-gray-500 mt-2 font-light leading-relaxed">
                Register as a companion host on Pakistan's premier marketplace. Set your own hours, select offerable services, receive requests, and earn safe, flexible income.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-mono">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Earn Flexible PKR Hourly Rates</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-wider text-indigo-600 group-hover:translate-x-1.5 transition-all">
              <span>Submit Application</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Safety Policy Disclaimer at bottom */}
      <div className="text-center max-w-lg w-full mx-auto relative z-10 text-[10px] text-gray-400">
        <p className="leading-relaxed">
          🔒 Yarana.pk is committed to Pakistan's local values and rigorous verification guidelines. All companion applications require mandatory CNIC upload, background checks, and active manual vetting by our administration before being listed live.
        </p>
      </div>
    </div>
  );
}
