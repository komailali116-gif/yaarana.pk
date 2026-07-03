import { useState, useEffect } from "react";
import SplashIntro from "./components/SplashIntro";
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import BrowseCompanions from "./components/BrowseCompanions";
import CompanionDetailModal from "./components/CompanionDetailModal";
import PaymentPage from "./components/PaymentPage";
import AccountInfo from "./components/AccountInfo";
import SafetyPage from "./components/SafetyPage";
import AdminPanel from "./components/AdminPanel";
import RoleSelectionPage from "./components/RoleSelectionPage";
import CompanionWorkspace from "./components/CompanionWorkspace";
import { Companion, Booking, Review, UserProfile, CompanionStatus } from "./types";
import {
  getStoredCompanions,
  saveStoredCompanions,
  getStoredBookings,
  saveStoredBookings,
  getStoredReviews,
  saveStoredReviews,
  getStoredProfile,
  saveStoredProfile,
  DEFAULT_USER,
  DEFAULT_ADMIN,
  resetLocalStorage
} from "./lib/storage";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // App-wide persistent states
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Navigation & Dialog states
  const [currentTab, setCurrentTab] = useState("browse");
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<{
    serviceId: string;
    serviceName: string;
    date: string;
    time: string;
    duration: number;
    totalPrice: number;
    meetingLocationType?: string;
    meetingAddress?: string;
    meetingInstructions?: string;
  } | null>(null);

  // Initial Seed Loading
  useEffect(() => {
    setCompanions(getStoredCompanions());
    setBookings(getStoredBookings());
    setReviews(getStoredReviews());
    
    // Check if user session exists in localStorage
    const storedUser = localStorage.getItem("yarana_profile");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.isAdmin) {
        setCurrentTab("admin");
      } else if (parsedUser.selectedRole === "companion") {
        setCurrentTab("become_companion");
      } else {
        setCurrentTab("browse");
      }
    }
  }, []);

  // Update user in state and local storage
  const handleUpdateProfile = (updated: UserProfile) => {
    setUser(updated);
    saveStoredProfile(updated);
  };

  // Switch roles between client (hire) and companion (become)
  const handleSwitchRole = (newRole: "client" | "companion") => {
    if (!user) return;
    const updated = {
      ...user,
      selectedRole: newRole
    };
    handleUpdateProfile(updated);
    if (newRole === "companion") {
      setCurrentTab("become_companion");
    } else {
      setCurrentTab("browse");
    }
  };

  // Reset selectedRole to undefined to allow going back to the selection screen
  const handleGoBackToRoleSelection = () => {
    if (!user) return;
    const updated = {
      ...user,
      selectedRole: undefined
    };
    handleUpdateProfile(updated);
  };

  // Top up user balance
  const handleTopUp = (amount: number) => {
    if (!user) return;
    const updated = {
      ...user,
      walletBalance: user.walletBalance + amount
    };
    handleUpdateProfile(updated);
  };

  // Switch between admin and client user easily for testing
  const handleToggleAdminRole = () => {
    if (!user) return;
    if (user.isAdmin) {
      // Switch back to normal user with client role
      const normalUser = { ...DEFAULT_USER, selectedRole: "client" as const };
      handleUpdateProfile(normalUser);
      setCurrentTab("browse");
    } else {
      // Switch to admin
      handleUpdateProfile(DEFAULT_ADMIN);
      setCurrentTab("admin");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("yarana_profile");
    setCurrentTab("browse");
  };

  // Reset application to default seeds
  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to restore default demo data? All custom bookings, reviews, and host profiles will be reset.")) {
      resetLocalStorage();
      setCompanions(getStoredCompanions());
      setBookings(getStoredBookings());
      setReviews(getStoredReviews());
      if (user) {
        handleUpdateProfile(user.isAdmin ? DEFAULT_ADMIN : DEFAULT_USER);
      }
    }
  };

  // Execute payment transaction & confirm booking
  const handlePaymentSuccess = (method: "JazzCash" | "EasyPaisa", phoneNum: string) => {
    if (!user || !selectedCompanion || !checkoutBooking) return;

    // Deduct amount
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance - checkoutBooking.totalPrice
    };
    handleUpdateProfile(updatedUser);

    // Create booking
    const newBooking: Booking = {
      id: "book_" + Date.now(),
      companionId: selectedCompanion.id,
      companionName: selectedCompanion.name,
      companionAvatar: selectedCompanion.avatar,
      serviceId: checkoutBooking.serviceId,
      serviceName: checkoutBooking.serviceName,
      date: checkoutBooking.date,
      time: checkoutBooking.time,
      duration: checkoutBooking.duration,
      totalPrice: checkoutBooking.totalPrice,
      status: "paid",
      paymentMethod: method,
      paymentNumber: phoneNum,
      meetingLocationType: checkoutBooking.meetingLocationType || "Public Cafe",
      meetingAddress: checkoutBooking.meetingAddress || "To be arranged",
      meetingInstructions: checkoutBooking.meetingInstructions || "",
      createdAt: new Date().toISOString()
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    saveStoredBookings(updatedBookings);

    // Reset modals and switch view
    setCheckoutBooking(null);
    setSelectedCompanion(null);
    setCurrentTab("bookings");
  };

  // Cancel booking and process refund
  const handleCancelBooking = (bookingId: string) => {
    if (!user) return;
    
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking || targetBooking.status !== "paid") return;

    // Process refund
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance + targetBooking.totalPrice
    };
    handleUpdateProfile(updatedUser);

    // Update booking status
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: "cancelled" as const };
      }
      return b;
    });

    setBookings(updatedBookings);
    saveStoredBookings(updatedBookings);
  };

  // Complete booking & submit review feedback
  const handleCompleteBooking = (bookingId: string, rating: number, comment: string) => {
    if (!user) return;

    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return;

    // 1. Update Booking status
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: "completed" as const };
      }
      return b;
    });
    setBookings(updatedBookings);
    saveStoredBookings(updatedBookings);

    // 2. Submit Review
    const newReview: Review = {
      id: "rev_" + Date.now(),
      companionId: targetBooking.companionId,
      userName: user.name,
      userAvatar: user.avatar,
      rating,
      comment,
      date: new Date().toISOString().split("T")[0]
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    saveStoredReviews(updatedReviews);

    // 3. Re-calculate companion average rating
    const companionReviews = updatedReviews.filter(r => r.companionId === targetBooking.companionId);
    const avgRating = companionReviews.reduce((sum, r) => sum + r.rating, 0) / companionReviews.length;

    const updatedCompanions = companions.map(c => {
      if (c.id === targetBooking.companionId) {
        return {
          ...c,
          rating: avgRating,
          reviewsCount: companionReviews.length
        };
      }
      return c;
    });

    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);
  };

  // ADMIN ACTION: Approve pending host application
  const handleApproveCompanion = (id: string) => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, status: CompanionStatus.APPROVED };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);
  };

  // ADMIN ACTION: Reject pending host application
  const handleRejectCompanion = (id: string) => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, status: CompanionStatus.REJECTED };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);
  };

  // ADMIN ACTION: Dissolve host profile
  const handleRemoveCompanion = (id: string) => {
    if (window.confirm("Are you absolutely sure you want to remove this companion from the database? This action is irreversible.")) {
      const updatedCompanions = companions.filter(c => c.id !== id);
      setCompanions(updatedCompanions);
      saveStoredCompanions(updatedCompanions);
    }
  };

  // ADMIN ACTION: Toggle host availability
  const handleToggleOnline = (id: string) => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, isOnline: !c.isOnline };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);
  };

  // ADMIN ACTION: Register new companion
  const handleAddNewCompanion = (newComp: Companion) => {
    const updatedCompanions = [...companions, newComp];
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2D2D2D] font-sans flex flex-col justify-between selection:bg-[#D4AF37] selection:text-black" id="yarana-app-root">
      
      {/* Immersive cinematic welcome intro splash */}
      {showSplash && (
        <SplashIntro onEnter={() => setShowSplash(false)} />
      )}

      {/* Auth Screen Wrapper */}
      {!user ? (
        <AuthPage onLoginSuccess={(profile) => {
          setUser(profile);
          saveStoredProfile(profile);
          if (profile.isAdmin) {
            setCurrentTab("admin");
          } else if (profile.selectedRole === "companion") {
            setCurrentTab("become_companion");
          } else if (profile.selectedRole === "client") {
            setCurrentTab("browse");
          }
        }} />
      ) : !user.selectedRole && !user.isAdmin ? (
        <RoleSelectionPage
          user={user}
          onSelectRole={handleSwitchRole}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Main Top Navigation */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            profile={user}
            onLogout={handleLogout}
            onToggleAdmin={handleToggleAdminRole}
            onResetApp={handleResetApp}
            onSwitchRole={handleSwitchRole}
          />

          {/* Master Content Stage */}
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            
            {/* View Tab router */}
            <div className="space-y-6">
              {currentTab === "browse" && (
                <BrowseCompanions
                  companions={companions}
                  onSelectCompanion={(comp) => setSelectedCompanion(comp)}
                  onGoBackToRoleSelection={handleGoBackToRoleSelection}
                />
              )}

              {(currentTab === "bookings" || currentTab === "account") && (
                <AccountInfo
                  profile={user}
                  bookings={bookings}
                  onUpdateProfile={handleUpdateProfile}
                  onCancelBooking={handleCancelBooking}
                  onCompleteBooking={handleCompleteBooking}
                  onTopUp={handleTopUp}
                />
              )}

              {currentTab === "become_companion" && (
                <CompanionWorkspace
                  user={user}
                  companions={companions}
                  bookings={bookings}
                  reviews={reviews}
                  onSubmitApplication={handleAddNewCompanion}
                  onToggleOnline={handleToggleOnline}
                  onResubmitApplication={(companionId) => {
                    const updated = companions.filter(c => c.id !== companionId);
                    setCompanions(updated);
                    saveStoredCompanions(updated);
                  }}
                  onGoBackToRoleSelection={handleGoBackToRoleSelection}
                />
              )}

              {currentTab === "safety" && (
                <SafetyPage />
              )}

              {currentTab === "admin" && user.isAdmin && (
                <AdminPanel
                  companions={companions}
                  bookings={bookings}
                  onApproveCompanion={handleApproveCompanion}
                  onRejectCompanion={handleRejectCompanion}
                  onRemoveCompanion={handleRemoveCompanion}
                  onToggleOnline={handleToggleOnline}
                  onAddNewCompanion={handleAddNewCompanion}
                />
              )}
            </div>

          </main>

          {/* Dialog Modals */}

          {/* Companion Details and pricing selection */}
          {selectedCompanion && !checkoutBooking && (
            <CompanionDetailModal
              companion={selectedCompanion}
              onClose={() => setSelectedCompanion(null)}
              onProceedToPayment={(det) => setCheckoutBooking(det)}
            />
          )}

          {/* Wallet / mobile money gateway checkout */}
          {checkoutBooking && selectedCompanion && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex justify-center items-center p-4">
              <PaymentPage
                bookingDetail={checkoutBooking}
                companion={selectedCompanion}
                profile={user}
                onCancel={() => setCheckoutBooking(null)}
                onPaymentSuccess={handlePaymentSuccess}
                onTopUp={handleTopUp}
              />
            </div>
          )}

          {/* Global Footer */}
          <footer className="bg-white border-t border-[#E5E1D8] py-4 text-xs text-gray-500 font-medium">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-wider text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-500 animate-pulse">●</span>
                  <span>Safety Response Active</span>
                </div>
                <span className="hidden md:inline text-gray-200">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Payments:</span>
                  <span className="text-[#1A1A1A] font-bold">JazzCash, EasyPaisa</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="italic font-serif text-gray-400 mr-2">"Curing loneliness with respect & safety"</span>
                <button
                  onClick={handleResetApp}
                  className="text-[10px] text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer border border-[#D4AF37]/30 px-2 py-1 rounded-full transition-all"
                  title="Wipe data from localStorage and seed defaults"
                >
                  Reset App Data
                </button>
                <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold border border-red-100 text-[10px] uppercase">
                  Emergency Support 24/7
                </span>
              </div>
            </div>
          </footer>
        </>
      )}

    </div>
  );
}
