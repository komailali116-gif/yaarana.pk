import React, { useState } from "react";
import { ShieldCheck, PhoneCall, ShieldAlert, Heart, FileText, Send, CheckCircle2, MessageSquare } from "lucide-react";

export default function SafetyPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setSubject("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="space-y-8 text-[#2D2D2D]" id="safety-hub-page">
      
      {/* Upper Banner */}
      <div className="bg-white border border-[#E5E1D8] p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden shadow-sm">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-[70px] pointer-events-none" />
        
        <div className="inline-flex p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-4 text-[#D4AF37] shadow-sm animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A1A]">Safety &amp; Trust Center</h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          At Yarana.pk, your peace of mind and physical protection are our topmost priorities. We strictly monitor all interactions to foster a community based on respect, honor, and dignity.
        </p>

        {/* Quick Emergency Contacts Grid (Bento Style Color-Coded) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#E5E1D8]/60 text-left">
          {/* Emergency Helpline - Soft Red */}
          <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl space-y-1.5 flex items-start gap-3 shadow-sm hover:scale-[1.01] transition-all">
            <PhoneCall className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-red-700 font-bold uppercase tracking-wider leading-none">Emergency Helpline</p>
              <p className="text-sm font-bold text-red-950 mt-1">042-111-YARANA</p>
              <p className="text-[10px] text-red-700/60 font-mono">Available 24 hours &bull; Lahore &amp; Karachi</p>
            </div>
          </div>

          {/* WhatsApp Support - Soft Green */}
          <div className="p-4 bg-green-50/70 border border-green-100 rounded-2xl space-y-1.5 flex items-start gap-3 shadow-sm hover:scale-[1.01] transition-all">
            <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-green-700 font-bold uppercase tracking-wider leading-none">WhatsApp Support</p>
              <p className="text-sm font-bold text-green-950 mt-1">+92 300 1234567</p>
              <p className="text-[10px] text-green-700/60 font-mono">Instant Chat Assistance</p>
            </div>
          </div>

          {/* Email Support - Soft Blue */}
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1.5 flex items-start gap-3 shadow-sm hover:scale-[1.01] transition-all">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-blue-700 font-bold uppercase tracking-wider leading-none">Police Liaison Desk</p>
              <p className="text-sm font-bold text-blue-950 mt-1">safety@yarana.pk</p>
              <p className="text-[10px] text-blue-700/60 font-mono">Direct escalation to local desk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Regulations & Rules Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Policy Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#E5E1D8]/60">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Yarana Rules &amp; Respect Charter</h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
              {/* Rule 1 */}
              <div className="p-4 bg-gray-50 border border-[#E5E1D8]/50 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  1. Strict Mutual Respect Boundaries
                </h4>
                <p className="text-[12px] text-gray-500 pl-3.5">
                  Any physical violence, verbal abuse, harassment, or non-consensual behavior towards any companion is strictly prohibited. Companionship services must be treated as formal mutual agreements for friendly interaction only. Violation results in legal actions.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 bg-gray-50 border border-[#E5E1D8]/50 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  2. Safe Public Venues ONLY
                </h4>
                <p className="text-[12px] text-gray-500 pl-3.5">
                  All in-person sessions (Dining, Movies, Study Companion, Day Out) must happen in open public venues like shopping malls, high-end restaurants, secure universities, libraries, or coffee houses. Private homes are strictly out-of-bounds unless special vetted clearance is granted.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 bg-gray-50 border border-[#E5E1D8]/50 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  3. Travel Companion Guidelines (Double Rooms)
                </h4>
                <p className="text-[12px] text-gray-500 pl-3.5">
                  During multi-day travel bookings, the hiring user is legally responsible for booking separate hotel rooms with safe security setups. The user must provide the exact travel itinerary to Yarana administrators prior to departure.
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-4 bg-gray-50 border border-[#E5E1D8]/50 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  4. User Responsibility for Food &amp; Tickets
                </h4>
                <p className="text-[12px] text-gray-500 pl-3.5">
                  Where applicable (Dining, Cinema Movies, Travel, Day out), the user is responsible for covering companion expenses, transport tickets, meals, and emergency medical kits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact / Safety Reporting Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="pb-2.5 border-b border-[#E5E1D8]/60">
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Report an Incident</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Dispatched directly to the Yarana Security Response Desk.</p>
            </div>

            {submitted ? (
              <div className="p-5 bg-green-50/70 border border-green-100 rounded-2xl text-center space-y-3" id="safety-report-success">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                <h4 className="text-xs font-bold text-green-950 uppercase tracking-wider">Incident Logged</h4>
                <p className="text-[11px] text-green-800 leading-relaxed">
                  Your ticket was successfully created. An investigator from our emergency desk will verify details and reach out within 15 minutes. Stay safe.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs text-[#D4AF37] hover:underline font-bold"
                >
                  File another report
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="safety-report-form">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subject / Issue Category</label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    id="safety-subject-select"
                  >
                    <option value="">-- Choose Category --</option>
                    <option value="boundary_violation">Boundary Violation / Abuse</option>
                    <option value="pricing_dispute">Pricing Dispute</option>
                    <option value="no_show">Companion No-Show</option>
                    <option value="safety_concern">Immediate Physical Safety Concern</option>
                    <option value="general_help">Account / General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide full description. Please mention companion name, dates, times, and phone contacts where relevant..."
                    className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37]"
                    id="safety-message-textarea"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    id="safety-btn-submit"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Security Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-2 border-t border-[#E5E1D8]/60">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>We advocate for a safe social Pakistan.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
