import React, { useState } from "react";
import { Smartphone, ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Building2, Copy, Check, Upload, Calendar, User, Eye } from "lucide-react";
import { Companion, UserProfile, stringifyPaymentNote } from "../types";
import { supabase } from "../supabaseClient";
import { SafeImage } from "./SafeImage";

interface PaymentPageProps {
  bookingDetail: {
    serviceId: string;
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    totalPrice: number;
    meetingLocationType?: string;
    meetingAddress?: string;
    meetingInstructions?: string;
  };
  companion: Companion;
  profile: UserProfile;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

type PaymentMethod = "EasyPaisa";

export default function PaymentPage({
  bookingDetail,
  companion,
  profile,
  onSubmitSuccess,
  onCancel
}: PaymentPageProps) {
  const [method] = useState<PaymentMethod>("EasyPaisa");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const paymentDetails = {
    EasyPaisa: {
      accountNumber: "03173223559",
      accountTitle: "NOMAN KHAN",
      instructions: "Transfer the amount via EasyPaisa App or USSD code."
    }
  };

  const currentDetails = paymentDetails[method];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        throw new Error("User session not found. Please log in again.");
      }

      const generatedTxnId = "YRN-PAY-" + Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);

      // Stringify the manual checkout data in payment_note
      const extendedNote = stringifyPaymentNote({
        note: "Instant payment confirmation",
        senderName: profile.name || "Anonymous User",
        senderAccountNumber: "0000",
        paymentDateTime: localISOTime,
        screenshotUrl: "",
        method: method
      } as any);

      // Insert record in payment_requests table
      const { error: insertError } = await supabase.from("payment_requests").insert({
        user_id: userId,
        user_email: profile.email,
        companion_id: companion.id,
        companion_name: companion.name,
        companion_avatar: companion.avatar,
        service_id: bookingDetail.serviceId,
        service_name: bookingDetail.serviceName,
        booking_date: bookingDetail.date,
        booking_time: bookingDetail.time,
        duration: bookingDetail.duration,
        total_price: bookingDetail.totalPrice,
        meeting_location_type: bookingDetail.meetingLocationType || "Public Cafe",
        meeting_address: bookingDetail.meetingAddress || "To be arranged",
        meeting_instructions: bookingDetail.meetingInstructions || "",
        transaction_id: generatedTxnId,
        last_four: "0000",
        payment_note: extendedNote,
        status: "Pending"
      });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit payment request:", err);
      setError(err.message || "Could not save payment request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-3xl p-6 sm:p-8 shadow-md text-center space-y-6 animate-fade-in" id="payment-page-success">
        <div className="inline-flex p-4 rounded-full bg-green-50 border border-green-100 text-green-650 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Payment Request Submitted</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Your manual payment request has been dispatched. Yarana Administrators will verify your transaction and approve the booking shortly!
          </p>
        </div>
        <div className="bg-[#F3F0E9]/20 border border-[#E5E1D8]/60 p-4 rounded-2xl text-left text-xs font-mono space-y-2">
          <p><span className="text-gray-400 font-bold">Companion:</span> {companion.name}</p>
          <p><span className="text-gray-400 font-bold">Total Price:</span> {bookingDetail.totalPrice.toLocaleString()} PKR</p>
          <p><span className="text-gray-400 font-bold">Payment Method:</span> {method}</p>
          <p><span className="text-gray-400 font-bold">Status:</span> <span className="text-amber-600 font-bold">Pending Approval</span></p>
        </div>
        <button
          onClick={onSubmitSuccess}
          className="w-full py-3.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Check My Booking Requests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-3xl p-6 sm:p-8 shadow-md space-y-6" id="payment-page">
      
      {/* Back button */}
      {!submitting && (
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-black cursor-pointer transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          Cancel and Return
        </button>
      )}

      {/* Booking summary header */}
      <div className="bg-[#F3F0E9]/30 border border-[#E5E1D8]/60 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <SafeImage
            src={(companion.photos && companion.photos.filter(Boolean).length > 0) ? companion.photos.filter(Boolean)[0] : companion.avatar}
            alt={companion.name}
            referrerPolicy="no-referrer"
            fallbackType={companion.gender as any}
            wrapperClassName="w-12 h-12 rounded-full border border-[#E5E1D8]"
            className="w-full h-full object-cover"
          />
          <div className="text-left">
            <h4 className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider leading-none">Booking Summary</h4>
            <p className="text-sm font-bold text-[#1A1A1A] mt-1">{companion.name}</p>
            <p className="text-[10px] text-gray-500 leading-none mt-1">{bookingDetail.serviceName} &bull; {bookingDetail.duration} {bookingDetail.serviceId === "call" ? "mins" : "hours"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wider leading-none">Grand Total</p>
          <p className="text-lg font-black text-orange-600 mt-1">{bookingDetail.totalPrice.toLocaleString()} PKR</p>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Manual Payment Checkout</h3>
        <p className="text-xs text-gray-500">Please make the payment transfer to the official EasyPaisa account below.</p>
      </div>

      {/* Payment Method Badge */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#3ebd5c]/10 border border-[#3ebd5c]/30 text-[#2a8b41] font-bold text-xs uppercase tracking-wider">
          <Smartphone className="w-4 h-4 text-[#3ebd5c]" />
          <span>EasyPaisa Official Account</span>
        </div>
      </div>

      {/* Payment Details Container */}
      <div className="bg-[#F3F0E9]/40 border border-[#E5E1D8] p-5 rounded-2xl space-y-3 shadow-inner">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] text-gray-400 uppercase font-mono tracking-wider font-semibold">Account Title</p>
            <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">{currentDetails.accountTitle}</p>
          </div>
        </div>

        <div>
          <p className="text-[9px] text-gray-400 uppercase font-mono tracking-wider font-semibold">Account / IBAN Number</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-extrabold text-gray-800 font-mono tracking-wide">{currentDetails.accountNumber}</span>
            <button
              onClick={() => handleCopy(currentDetails.accountNumber)}
              className="p-1 rounded bg-white hover:bg-gray-100 border border-[#E5E1D8] text-gray-500 cursor-pointer transition-all"
              title="Copy account number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-normal italic bg-white/70 p-3 rounded-xl border border-[#E5E1D8]/40">
          💡 {currentDetails.instructions}
        </p>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs flex gap-2.5 items-center shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl text-xs text-gray-600 space-y-1.5 shadow-sm">
          <p className="font-bold text-green-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            No Reference Number Required
          </p>
          <p>
            Simply transfer the amount of <span className="font-extrabold text-[#1A1A1A]">{bookingDetail.totalPrice.toLocaleString()} PKR</span> to the {method} account shown above. Once done, tap the button below to confirm. No receipt, screenshot, or transaction ID is required.
          </p>
        </div>

        {/* Security / Encrypted badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span>Secured transaction. Yarana administrators will verify your transfer instantly.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black"
          }`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Confirming Payment Request...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Submit Request</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
