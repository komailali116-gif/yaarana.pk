import React, { useState } from "react";
import { Wallet, Smartphone, ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import { Companion, UserProfile } from "../types";

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
  onPaymentSuccess: (method: "JazzCash" | "EasyPaisa", phoneNum: string) => void;
  onCancel: () => void;
  onTopUp: (amount: number) => void;
}

export default function PaymentPage({
  bookingDetail,
  companion,
  profile,
  onPaymentSuccess,
  onCancel,
  onTopUp
}: PaymentPageProps) {
  const [method, setMethod] = useState<"JazzCash" | "EasyPaisa">("JazzCash");
  const [phoneNumber, setPhoneNumber] = useState(profile.phone || "");
  const [step, setStep] = useState(1); // 1: Input details, 2: OTP / PIN, 3: Processing
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");

  const handleInitializePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Phone number validation for Pakistan
    const pakPhoneRegex = /^(03|923|\+923)\d{9}$/;
    const formattedPhone = phoneNumber.replace(/[-\s]/g, "");
    if (!pakPhoneRegex.test(formattedPhone)) {
      setError("Please enter a valid Pakistani mobile wallet number (e.g., 03001234567).");
      return;
    }

    // Check balance
    if (profile.walletBalance < bookingDetail.totalPrice) {
      setError(`Insufficient balance. You need ${(bookingDetail.totalPrice - profile.walletBalance).toLocaleString()} PKR more in your Yarana Wallet.`);
      return;
    }

    setStep(2); // Go to OTP and PIN verification step
  };

  const handleVerifyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("Please enter a valid 4 or 5-digit wallet MPIN.");
      return;
    }

    // Simulated payment processing
    setStep(3);
    setTimeout(() => {
      onPaymentSuccess(method, phoneNumber);
    }, 2200);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-[#E5E1D8] text-[#2D2D2D] rounded-3xl p-6 sm:p-8 shadow-md space-y-6" id="payment-page">
      
      {/* Back button */}
      {step === 1 && (
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
          <img
            src={companion.avatar}
            alt={companion.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8]"
          />
          <div className="text-left">
            <h4 className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider leading-none">Hiring Companion</h4>
            <p className="text-sm font-bold text-[#1A1A1A] mt-1">{companion.name}</p>
            <p className="text-[10px] text-gray-500 leading-none mt-1">{bookingDetail.serviceName} &bull; {bookingDetail.duration} {bookingDetail.serviceId === "call" ? "mins" : "hours"}</p>
            {bookingDetail.meetingAddress && (
              <p className="text-[10px] text-blue-700 font-bold mt-1 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-md inline-block">
                📍 {bookingDetail.meetingLocationType}: {bookingDetail.meetingAddress}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wider leading-none">Grand Total</p>
          <p className="text-lg font-black text-orange-600 mt-1">{bookingDetail.totalPrice.toLocaleString()} PKR</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Select Wallet Payment</h3>
            <p className="text-xs text-gray-500 mt-1">Pay instantly using JazzCash or EasyPaisa mobile wallets.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-xs flex gap-2.5 items-center shadow-sm" id="payment-error-box">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-grow">
                <span>{error}</span>
                {profile.walletBalance < bookingDetail.totalPrice && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        onTopUp(10000);
                        setError("");
                      }}
                      className="px-3 py-1.5 bg-[#1A1C20] hover:bg-black text-white rounded-xl font-bold text-[10px] cursor-pointer"
                    >
                      Top up +10K PKR (Sandbox)
                    </button>
                    <button
                      onClick={() => {
                        onTopUp(20000);
                        setError("");
                      }}
                      className="px-3 py-1.5 bg-[#1A1C20] hover:bg-black text-white rounded-xl font-bold text-[10px] cursor-pointer"
                    >
                      Top up +20K PKR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-4">
            {/* JazzCash Option */}
            <div
              onClick={() => setMethod("JazzCash")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                method === "JazzCash"
                  ? "bg-[#cb1c24]/5 border-[#cb1c24] scale-[1.02]"
                  : "bg-white border-[#E5E1D8] hover:bg-gray-50"
              }`}
              id="payment-method-jazzcash"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-extrabold text-[#cb1c24] text-xs">
                JC
              </div>
              <p className="text-xs font-bold text-gray-800">JazzCash</p>
              <span className="text-[9px] text-gray-400">Secure Wallet Ingress</span>
            </div>

            {/* EasyPaisa Option */}
            <div
              onClick={() => setMethod("EasyPaisa")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                method === "EasyPaisa"
                  ? "bg-[#3ebd5c]/5 border-[#3ebd5c] scale-[1.02]"
                  : "bg-white border-[#E5E1D8] hover:bg-gray-50"
              }`}
              id="payment-method-easypaisa"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-extrabold text-[#3ebd5c] text-xs">
                EP
              </div>
              <p className="text-xs font-bold text-gray-800">EasyPaisa</p>
              <span className="text-[9px] text-gray-400">Telenor Microfinance</span>
            </div>
          </div>

          {/* Phone Form */}
          <form onSubmit={handleInitializePayment} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Registered {method} Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-3 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
                  id="payment-phone-input"
                />
              </div>
              <p className="text-[10px] text-gray-400 leading-normal pt-1">
                An instant validation charge of <strong className="text-orange-600">{bookingDetail.totalPrice.toLocaleString()} PKR</strong> will be authorized against your account.
              </p>
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              className={`w-full py-4 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 ${
                method === "JazzCash"
                  ? "bg-[#cb1c24] hover:bg-[#b0161d]"
                  : "bg-[#3ebd5c] hover:bg-[#34a44f]"
              }`}
              id="payment-btn-initiate"
            >
              <Smartphone className="w-4.5 h-4.5" />
              <span>Initiate {method} Checkout</span>
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] mb-3 text-[#D4AF37] shadow-sm animate-pulse">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Enter MPIN Securely</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">A checkout notification has been dispatched to {phoneNumber}. Please supply your 4 or 5-digit wallet MPIN to confirm.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs flex gap-2 items-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPayment} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Wallet MPIN
              </label>
              <input
                type="password"
                maxLength={5}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="&bull;&bull;&bull;&bull;"
                className="w-40 mx-auto bg-[#F3F0E9]/40 border border-[#E5E1D8] rounded-xl py-3 text-center text-gray-800 text-lg font-bold tracking-[0.6em] focus:outline-none focus:border-[#D4AF37] font-mono block"
                id="payment-mpin-input"
              />
            </div>

            <div className="pt-2 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              End-to-end encrypted under PCI-DSS standards.
            </div>

            {/* Confirm Payment Button */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 bg-white border border-[#E5E1D8] text-gray-600 rounded-xl text-xs font-bold cursor-pointer transition-all hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="payment-btn-verify"
              >
                <span>Authorize & Pay</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-[#D4AF37] rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#D4AF37] animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1 animate-pulse">
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Processing Transaction...</h3>
            <p className="text-xs text-gray-400">Contacting {method} microfinance core banking channels...</p>
          </div>
        </div>
      )}

    </div>
  );
}
