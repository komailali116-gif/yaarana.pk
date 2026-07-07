import React, { useState } from "react";
import { Smartphone, ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, Building2, Copy, Check, Upload, Calendar, User, Eye } from "lucide-react";
import { Companion, UserProfile, stringifyPaymentNote } from "../types";
import { supabase } from "../supabaseClient";

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

type PaymentMethod = "EasyPaisa" | "JazzCash";

export default function PaymentPage({
  bookingDetail,
  companion,
  profile,
  onSubmitSuccess,
  onCancel
}: PaymentPageProps) {
  const [method, setMethod] = useState<PaymentMethod>("EasyPaisa");
  const [senderName, setSenderName] = useState("");
  const [senderAccountNumber, setSenderAccountNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(bookingDetail.totalPrice);
  const [lastFour, setLastFour] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDateTime, setPaymentDateTime] = useState(() => {
    const d = new Date();
    // Format to local ISO (YYYY-MM-DDTHH:MM)
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  });
  
  // Screenshot states
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState("");
  const [uploadedPath, setUploadedPath] = useState("");

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const paymentDetails = {
    EasyPaisa: {
      accountNumber: "03095523073",
      accountTitle: "MUHAMMAD ASHRAF",
      instructions: "Transfer the amount via EasyPaisa App or USSD code. Keep the transaction ID safe."
    },
    JazzCash: {
      accountNumber: "03009453388",
      accountTitle: "SHAHZAIB",
      instructions: "Transfer the amount via JazzCash App or USSD code. Keep the transaction ID safe."
    }
  };

  const currentDetails = paymentDetails[method];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotChange = async (file: File) => {
    setScreenshotError("");
    setScreenshotFile(file);
    
    // Create local object URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setScreenshotPreview(previewUrl);

    // Direct upload to Supabase storage 'app-files'
    setIsUploadingScreenshot(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id || "anonymous";

      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'png';
      const filePath = `screenshots/${uid}/${uuid}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("app-files")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadedPath(filePath);
    } catch (err: any) {
      console.error("Screenshot upload failed:", err);
      setScreenshotError("Failed to upload screenshot to cloud: " + err.message);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!senderName.trim()) {
      setError("Please enter the sender's full name.");
      return;
    }

    if (!senderAccountNumber.trim()) {
      setError("Please enter the sender's account number.");
      return;
    }

    if (!transactionId.trim()) {
      setError("Please enter the transaction ID.");
      return;
    }

    if (!amountPaid || amountPaid <= 0) {
      setError("Please enter a valid positive amount paid.");
      return;
    }

    if (!lastFour || lastFour.length < 4) {
      setError("Please enter the last 4 digits of your sending phone/bank account.");
      return;
    }

    if (isUploadingScreenshot) {
      setError("Please wait while your screenshot is uploading...");
      return;
    }

    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        throw new Error("User session not found. Please log in again.");
      }

      // Stringify the full manual checkout data in payment_note
      const extendedNote = stringifyPaymentNote({
        note: paymentNote,
        senderName,
        senderAccountNumber,
        paymentDateTime,
        screenshotUrl: uploadedPath,
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
        total_price: amountPaid,
        meeting_location_type: bookingDetail.meetingLocationType || "Public Cafe",
        meeting_address: bookingDetail.meetingAddress || "To be arranged",
        meeting_instructions: bookingDetail.meetingInstructions || "",
        transaction_id: transactionId,
        last_four: lastFour,
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
            Your manual payment request has been dispatched to Yarana Administrators. We will audit your transaction and approve the booking shortly!
          </p>
        </div>
        <div className="bg-[#F3F0E9]/20 border border-[#E5E1D8]/60 p-4 rounded-2xl text-left text-xs font-mono space-y-2">
          <p><span className="text-gray-400 font-bold">Companion:</span> {companion.name}</p>
          <p><span className="text-gray-400 font-bold">Total Price:</span> {bookingDetail.totalPrice.toLocaleString()} PKR</p>
          <p><span className="text-gray-400 font-bold">Sender Name:</span> {senderName}</p>
          <p><span className="text-gray-400 font-bold">Sender Account:</span> {senderAccountNumber}</p>
          {transactionId && <p><span className="text-gray-400 font-bold">Transaction ID:</span> {transactionId}</p>}
          <p><span className="text-gray-400 font-bold">Account Last 4:</span> {lastFour}</p>
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
          <img
            src={companion.avatar}
            alt={companion.name}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8]"
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
        <p className="text-xs text-gray-500">Choose your preferred payment method and follow the details below.</p>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-2 gap-2.5">
        {(["EasyPaisa", "JazzCash"] as PaymentMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
              method === m
                ? m === "EasyPaisa"
                  ? "bg-[#3ebd5c]/5 border-[#3ebd5c] text-[#3ebd5c] scale-[1.02]"
                  : "bg-[#cb1c24]/5 border-[#cb1c24] text-[#cb1c24] scale-[1.02]"
                : "bg-white border-[#E5E1D8] hover:bg-gray-50 text-gray-600"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{m}</span>
          </button>
        ))}
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

        {/* Required checkout details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Sender Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <User className="w-3.5 h-3.5 text-gray-450" />
              </span>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Muhammad Khan"
                className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 pl-10 pr-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Sender Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none font-mono text-[10px] font-bold text-gray-400">
                #
              </span>
              <input
                type="text"
                required
                value={senderAccountNumber}
                onChange={(e) => setSenderAccountNumber(e.target.value)}
                placeholder="e.g. 03001234567 or IBAN"
                className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 pl-8 pr-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Payment Date &amp; Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Calendar className="w-3.5 h-3.5 text-gray-450" />
              </span>
              <input
                type="datetime-local"
                required
                value={paymentDateTime}
                onChange={(e) => setPaymentDateTime(e.target.value)}
                className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 pl-10 pr-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Last 4 Digits <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 4321"
              className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 px-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Transaction ID or Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN-10029302"
              className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 px-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Amount Paid (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              placeholder="e.g. 5000"
              className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-3 px-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] font-mono font-bold text-orange-600"
            />
          </div>
        </div>

        {/* Drag-and-drop or manual upload of screenshots */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Upload Payment Screenshot (Optional)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F9F8F6] border border-[#E5E1D8] p-4 rounded-2xl">
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 border border-dashed border-[#E5E1D8] hover:border-[#D4AF37] rounded-xl bg-white cursor-pointer transition-all hover:bg-gray-50 text-xs text-gray-600 font-semibold shrink-0">
              <Upload className={`w-4 h-4 text-[#D4AF37] ${isUploadingScreenshot ? "animate-bounce" : ""}`} />
              <span>{isUploadingScreenshot ? "Uploading..." : "Select File"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingScreenshot}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScreenshotChange(file);
                }}
              />
            </label>
            <div className="text-left w-full">
              <p className="text-[10px] text-gray-400">Supported formats: JPG, PNG. Direct upload to secure cloud database.</p>
              {screenshotFile && (
                <p className="text-[10px] text-green-700 font-bold mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Selected: {screenshotFile.name} (Uploaded)</span>
                </p>
              )}
              {screenshotError && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold">{screenshotError}</p>
              )}
            </div>
          </div>

          {/* Screenshot preview if uploaded */}
          {screenshotPreview && (
            <div className="mt-2.5 relative border border-[#E5E1D8] rounded-2xl overflow-hidden aspect-video bg-gray-50 max-h-40 w-fit mx-auto">
              <img
                src={screenshotPreview}
                alt="Screenshot Preview"
                className="h-full object-contain mx-auto"
              />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <Eye className="w-3 h-3" />
                <span>Screenshot Preview</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Optional Payment Note
          </label>
          <textarea
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="e.g., Transferred from my personal account"
            rows={2}
            className="w-full bg-[#F3F0E9]/20 border border-[#E5E1D8] rounded-xl py-2.5 px-3.5 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37] resize-none"
          />
        </div>

        {/* Security / Encrypted badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-450 pt-1">
          <ShieldCheck className="w-4 h-4 text-green-650" />
          <span>Secured transaction registry. Admin validation required.</span>
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
              <span>Submitting Payment Request...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Submit Payment Request</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
