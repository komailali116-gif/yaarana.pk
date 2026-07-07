import React, { useState } from "react";
import { UserProfile, Booking, PaymentRequest } from "../types";
import { User, Wallet, Phone, Mail, MapPin, Edit3, Save, Calendar, Clock, Star, AlertCircle, CheckCircle2, CreditCard } from "lucide-react";

interface AccountInfoProps {
  profile: UserProfile;
  bookings: Booking[];
  paymentRequests: PaymentRequest[];
  onUpdateProfile: (updated: UserProfile) => void;
  onCancelBooking: (bookingId: string) => void;
  onCompleteBooking: (bookingId: string, rating: number, comment: string) => void;
  onPaySubscription: () => void;
}

export default function AccountInfo({
  profile,
  bookings,
  paymentRequests,
  onUpdateProfile,
  onCancelBooking,
  onCompleteBooking,
  onPaySubscription
}: AccountInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);

  const isSubscriptionActive = profile.isAdmin || profile.selectedRole === "companion" || paymentRequests.some(pr => pr.companionId === "subscription" && pr.status === "Approved");
  const isSubscriptionPending = paymentRequests.some(pr => pr.companionId === "subscription" && pr.status === "Pending");
  const isSubscriptionRejected = paymentRequests.some(pr => pr.companionId === "subscription" && pr.status === "Rejected");
  const rejectedSubscriptionRequest = paymentRequests.find(pr => pr.companionId === "subscription" && pr.status === "Rejected");

  const parseSafeNote = (noteStr: string) => {
    try {
      const parsed = JSON.parse(noteStr);
      return parsed.adminNote || "";
    } catch {
      if (noteStr.includes("Admin Note:")) {
        return noteStr.split("Admin Note:")[1]?.trim() || "";
      }
      return "";
    }
  };

  // Review state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      email,
      phone,
      city
    });
    setIsEditing(false);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError("Please write a small comment summarizing your companionship experience.");
      return;
    }
    if (reviewBookingId) {
      onCompleteBooking(reviewBookingId, rating, comment);
      setReviewBookingId(null);
      setComment("");
      setRating(5);
      setReviewError("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-[#2D2D2D]" id="account-info-page">
      
      {/* Profile Card & Top-Up Wallet Section */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm text-center space-y-4">
          <div className="relative inline-block">
            <img
              src={profile.avatar}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-[#D4AF37] shadow-sm"
            />
            <span className="absolute bottom-1 right-1 p-2 rounded-full bg-[#1A1C20] text-[#D4AF37] shadow-sm">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{profile.name}</h3>
            <p className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-block">
              {profile.isAdmin ? "Certified System Admin" : "Premium Member"}
            </p>
          </div>

          {/* Contact Details List */}
          {!isEditing ? (
            <div className="space-y-3.5 text-xs text-left text-gray-600 pt-4 border-t border-[#E5E1D8]/60">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate text-gray-700">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{profile.city}, Pakistan</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 py-2.5 bg-[#F3F0E9] hover:bg-[#E5E1D8]/50 border border-[#E5E1D8] text-gray-800 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs"
                id="btn-edit-profile-trigger"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Edit Profile</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5 text-left pt-4 border-t border-[#E5E1D8]/60">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] text-gray-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-1/2 py-2.5 bg-white text-gray-600 border border-[#E5E1D8] text-xs rounded-xl font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                  id="btn-save-profile"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Subscription / Activation Card */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E5E1D8]/60">
            <span className="p-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">👑</span>
            <h4 className="text-sm font-bold text-[#1A1A1A]">Subscription & Membership</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Account Status</span>
              {isSubscriptionActive ? (
                <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active / Paid
                </span>
              ) : isSubscriptionPending ? (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending Review
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  Inactive / Unpaid
                </span>
              )}
            </div>

            {/* Notification messages for Rejected or Inactive subscriptions */}
            {isSubscriptionRejected && rejectedSubscriptionRequest && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-2xl text-[11px] text-red-850 space-y-1">
                <p className="font-bold">⚠️ Subscription Request Rejected</p>
                <p className="text-red-600 leading-relaxed font-sans">
                  The admin has reviewed your payment slip and rejected it. Reason:{" "}
                  <span className="italic font-bold">
                    {parseSafeNote(rejectedSubscriptionRequest.paymentNote) || "Invalid transaction details."}
                  </span>
                </p>
              </div>
            )}

            {!isSubscriptionActive && !isSubscriptionPending && (
              <div className="space-y-3 pt-1">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  To view verified companion listings and book security-cleared physical sessions or phone calls, your Yarana account must be activated with a premium lifetime subscription.
                </p>
                <button
                  onClick={onPaySubscription}
                  className="w-full py-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Activate Premium (PKR 4,999)</span>
                </button>
              </div>
            )}

            {isSubscriptionPending && (
              <p className="text-[11px] text-gray-500 leading-relaxed italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 text-center">
                ⏳ Your payment is currently being audited. We are verifying the transaction ID and screenshot. Account features will unlock immediately upon approval!
              </p>
            )}

            {isSubscriptionActive && (
              <p className="text-[11px] text-green-700 leading-relaxed font-sans font-medium bg-green-50/50 p-3 rounded-xl border border-green-150 text-center">
                🎉 Congratulations! Your account has a fully verified active subscription. Enjoy premium safety-audited companionship services on Yarana.pk!
              </p>
            )}
          </div>
        </div>

        {/* Manual Payment Requests Panel */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E5E1D8]/60">
            <CreditCard className="w-5 h-5 text-[#D4AF37]" />
            <h4 className="text-sm font-bold text-[#1A1A1A]">Payment Audits Log ({paymentRequests.length})</h4>
          </div>
          
          {paymentRequests.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">No payment requests submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {paymentRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-[#F3F0E9]/30 border border-[#E5E1D8]/50 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1A1A1A]">{req.companionName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      req.status === "Pending"
                        ? "bg-amber-100 text-amber-850"
                        : req.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[10px]">
                    <span>{req.serviceName} &bull; {req.totalPrice.toLocaleString()} PKR</span>
                  </div>
                  <div className="text-[9px] text-gray-400 flex justify-between items-center font-mono">
                    <span>Sender: ...{req.lastFour}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-400 italic text-center">
            Review status updates in real-time. Admins typically audit within 15 minutes.
          </p>
        </div>
      </div>

      {/* Bookings Table / Session Tracking */}
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-sm min-h-[450px]">
          <div className="border-b border-[#E5E1D8]/60 pb-4 mb-4">
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Your Bookings History</h3>
            <p className="text-xs text-gray-400 mt-0.5">Track your companionship sessions, billing status, and live call credentials.</p>
          </div>

          {/* Review form overlay */}
          {reviewBookingId && (
            <div className="bg-[#FFF9C4]/30 border border-[#FFF176] p-5 rounded-2xl mb-6 space-y-4 shadow-sm" id="review-compose-panel">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-widest flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Leave a Companion Review
                </h4>
                <button
                  onClick={() => setReviewBookingId(null)}
                  className="text-xs text-gray-500 hover:text-black font-semibold"
                >
                  Cancel
                </button>
              </div>

              {reviewError && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {reviewError}
                </p>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star selection */}
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-gray-600 mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="p-1 cursor-pointer hover:scale-110 transition-all"
                    >
                      <Star className={`w-5 h-5 ${val <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>

                {/* Comment box */}
                <div>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your session. How did you enjoy your conversations and time spent?"
                    className="w-full bg-white border border-[#E5E1D8] rounded-xl p-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Submit Review & Complete Session
                  </button>
                </div>
              </form>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center" id="empty-bookings-view">
              <Calendar className="w-12 h-12 text-gray-300 mb-3" />
              <h4 className="text-sm font-bold text-[#1A1A1A]">No companionship booked yet</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs leading-normal">
                Browse our approved hosts from Lahore, Karachi, and Islamabad, select a service, and book your first session today!
              </p>
            </div>
          ) : (
            <div className="space-y-4" id="bookings-history-list">
              {bookings.slice().reverse().map(booking => (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl bg-[#F3F0E9]/20 border border-[#E5E1D8]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  id={`booking-card-${booking.id}`}
                >
                  {/* Left part: Companion & Service info */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-3">
                      <img
                        src={booking.companionAvatar}
                        alt={booking.companionName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-[#E5E1D8]"
                      />
                      <div className="text-left space-y-0.5">
                        <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider leading-none">{booking.serviceName}</p>
                        <p className="text-sm font-semibold text-[#1A1A1A]">with {booking.companionName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 font-mono">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {booking.date}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {booking.time} ({booking.duration} {booking.serviceId === "call" ? "minutes" : "hours"})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Meeting Location Banner */}
                    {booking.meetingAddress && (
                      <div className="mt-3.5 p-3 rounded-2xl bg-blue-50/60 border border-blue-100/45 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
                        <div>
                          <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">📍 Meeting Coordinates ({booking.meetingLocationType})</p>
                          <p className="text-xs text-gray-800 font-semibold mt-0.5">{booking.meetingAddress}</p>
                        </div>
                        {booking.meetingInstructions && (
                          <div className="border-t md:border-t-0 md:border-l border-blue-200/55 pt-2.5 md:pt-0 md:pl-3.5 max-w-sm">
                            <p className="text-[9px] text-blue-700 font-bold uppercase tracking-wider">Arrival Instructions</p>
                            <p className="text-[11px] text-gray-650 italic mt-0.5 font-medium">"{booking.meetingInstructions}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right part: Price and Status button controls */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E1D8]/60">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold leading-none">Paid Amount</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">{booking.totalPrice.toLocaleString()} PKR</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === "paid" && (
                        <>
                          <button
                            onClick={() => onCancelBooking(booking.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[10px] font-bold uppercase transition-all cursor-pointer"
                            id={`btn-cancel-booking-${booking.id}`}
                          >
                            Cancel Hire
                          </button>
                          <button
                            onClick={() => setReviewBookingId(booking.id)}
                            className="px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            id={`btn-complete-booking-${booking.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            <span>Complete</span>
                          </button>
                        </>
                      )}

                      {booking.status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-green-100 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}

                      {booking.status === "cancelled" && (
                        <span className="text-[10px] bg-gray-50 text-gray-400 font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-gray-100">
                          Refunded & Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
