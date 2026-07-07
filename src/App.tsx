import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
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
import { Companion, Booking, Review, UserProfile, CompanionStatus, PaymentRequest, PricingTier, parsePaymentNote, stringifyPaymentNote } from "./types";
import { INITIAL_COMPANIONS } from "./data/companions";
// @ts-ignore
import { supabase } from "./supabaseClient";
import { countUploadedPics } from "./lib/limits";
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
  DEFAULT_ADMIN
} from "./lib/storage";

// Database Model Mapping Helper Functions
function mapProfileFromDB(dbProfile: any): UserProfile {
  return {
    name: dbProfile.name,
    email: dbProfile.email,
    phone: dbProfile.phone || "",
    city: dbProfile.city || "Lahore",
    avatar: dbProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    isAdmin: Boolean(dbProfile.is_admin),
    selectedRole: dbProfile.selected_role || undefined,
  };
}

function mapProfileToDB(profile: UserProfile, userId: string): any {
  return {
    id: userId,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    avatar: profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    is_admin: profile.isAdmin,
    selected_role: profile.selectedRole || null,
    updated_at: new Date().toISOString()
  };
}

function mapCompanionFromDB(c: any): Companion {
  const rawTagline = c.tagline || "";
  let tier: "Silver" | "Platinum" | "Gold" = "Silver";
  let tagline = rawTagline;
  let photos: string[] = [];

  const tierMatch = rawTagline.match(/^\[Tier:(Silver|Platinum|Gold)\]/);
  if (tierMatch) {
    tier = tierMatch[1] as "Silver" | "Platinum" | "Gold";
  } else {
    // If no explicit [Tier:...] prefix exists in the db, look up default seed tier
    if (c.id === "comp_1" || c.id === "comp_4") {
      tier = "Gold";
    } else if (c.id === "comp_2" || c.id === "comp_5") {
      tier = "Platinum";
    }
  }

  // Extract photos pattern if present
  const photosMatch = rawTagline.match(/\[Photos:(\[[^\]]*\])\]/);
  if (photosMatch) {
    try {
      photos = JSON.parse(photosMatch[1]);
    } catch (e) {
      console.error("Failed to parse packed photos:", e);
    }
  }

  // If no photos, fall back to seed data if this is a default seed companion
  if (photos.length === 0) {
    const seed = INITIAL_COMPANIONS.find(sc => sc.id === c.id);
    if (seed && seed.photos) {
      photos = seed.photos;
    }
  }

  // Clean the tagline
  tagline = rawTagline
    .replace(/^\[Tier:(Silver|Platinum|Gold)\]/, "")
    .replace(/\[Photos:\[[^\]]*\]\]/, "");

  return {
    id: c.id,
    name: c.name,
    age: Number(c.age),
    gender: c.gender,
    city: c.city,
    avatar: c.avatar,
    bio: c.bio,
    rating: Number(c.rating ?? 5.0),
    reviewsCount: Number(c.reviews_count ?? 0),
    languages: c.languages || [],
    interests: c.interests || [],
    services: c.services || [],
    status: c.status,
    isOnline: Boolean(c.is_online),
    featured: Boolean(c.featured),
    tagline: tagline || undefined,
    pricingTier: tier,
    cnic: c.cnic || undefined,
    mobile: c.mobile || undefined,
    userId: c.user_id || undefined,
    photos: photos.length > 0 ? photos : undefined
  };
}

function mapCompanionToDB(c: Companion, userId?: string | null): any {
  const tier = c.pricingTier || "Silver";
  const photosStr = c.photos && c.photos.length > 0 ? `[Photos:${JSON.stringify(c.photos)}]` : "";
  const packedTagline = `[Tier:${tier}]${photosStr}${c.tagline || ""}`;

  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    city: c.city,
    avatar: c.avatar,
    bio: c.bio,
    rating: c.rating,
    reviews_count: c.reviewsCount,
    languages: c.languages,
    interests: c.interests,
    services: c.services,
    status: c.status,
    is_online: c.isOnline,
    featured: c.featured,
    tagline: packedTagline,
    cnic: c.cnic || null,
    mobile: c.mobile || null,
    user_id: userId !== undefined ? userId : (c.userId || null)
  };
}

function mapBookingFromDB(b: any): Booking {
  return {
    id: b.id,
    companionId: b.companion_id,
    companionName: b.companion_name,
    companionAvatar: b.companion_avatar,
    serviceId: b.service_id,
    serviceName: b.service_name,
    date: b.date,
    time: b.time,
    duration: Number(b.duration),
    totalPrice: Number(b.total_price),
    status: b.status,
    paymentMethod: b.payment_method || undefined,
    paymentNumber: b.payment_number || undefined,
    meetingLocationType: b.meeting_location_type || undefined,
    meetingAddress: b.meeting_address || undefined,
    meetingInstructions: b.meeting_instructions || undefined,
    createdAt: b.created_at
  };
}

function mapBookingToDB(b: Booking, userId: string): any {
  return {
    id: b.id,
    companion_id: b.companionId,
    companion_name: b.companionName,
    companion_avatar: b.companionAvatar,
    service_id: b.serviceId,
    service_name: b.serviceName,
    date: b.date,
    time: b.time,
    duration: b.duration,
    total_price: b.totalPrice,
    status: b.status,
    payment_method: b.paymentMethod || null,
    payment_number: b.paymentNumber || null,
    meeting_location_type: b.meetingLocationType || null,
    meeting_address: b.meetingAddress || null,
    meeting_instructions: b.meetingInstructions || null,
    user_id: userId
  };
}

function mapReviewFromDB(r: any): Review {
  return {
    id: r.id,
    companionId: r.companion_id,
    userName: r.user_name,
    userAvatar: r.user_avatar,
    rating: Number(r.rating),
    comment: r.comment,
    date: r.date
  };
}

function mapReviewToDB(r: Review, userId?: string | null): any {
  return {
    id: r.id,
    companion_id: r.companionId,
    user_name: r.userName,
    user_avatar: r.userAvatar,
    rating: r.rating,
    comment: r.comment,
    date: r.date,
    user_id: userId || null
  };
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // App-wide persistent states
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [appSettings, setAppSettings] = useState({
    announcement: "✨ Welcome to Yarana.pk - Pakistan's #1 Safe and Verified Companionship Platform!",
    bannerEnabled: true,
    bannerText: "📢 Official Notice: All host companions undergo manual identity verification for maximum safety and compliance.",
    silverMultiplier: 1.0,
    goldMultiplier: 1.3,
    platinumMultiplier: 2.21,
    membershipSilverFee: 0,
    membershipGoldFee: 4999,
    membershipPlatinumFee: 9999,
    adminLogs: [] as any[]
  });

  // Navigation & Dialog states
  const [currentTab, setCurrentTab] = useState("browse");
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  const loadPaymentRequests = async (currentProfile: UserProfile | null, userId?: string) => {
    if (!userId) {
      setPaymentRequests([]);
      return;
    }
    try {
      let query = supabase.from("payment_requests").select("*").order("created_at", { ascending: false });
      
      // If NOT admin, filter by user_id
      if (currentProfile && !currentProfile.isAdmin) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const mapped: PaymentRequest[] = data.map((pr: any) => ({
          id: pr.id,
          userId: pr.user_id,
          companionId: pr.companion_id,
          companionName: pr.companion_name,
          companionAvatar: pr.companion_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
          serviceId: pr.service_id,
          serviceName: pr.service_name,
          bookingDate: pr.booking_date,
          bookingTime: pr.booking_time,
          duration: pr.duration,
          totalPrice: Number(pr.total_price),
          meetingLocationType: pr.meeting_location_type || "",
          meetingAddress: pr.meeting_address || "",
          meetingInstructions: pr.meeting_instructions || "",
          transactionId: pr.transaction_id || "",
          lastFour: pr.last_four,
          paymentNote: pr.payment_note || "",
          status: pr.status as any,
          createdAt: pr.created_at,
          userEmail: pr.user_email || ""
        }));
        setPaymentRequests(mapped);
      }
    } catch (err) {
      console.error("Failed to load payment requests:", err);
    }
  };

  // Load Companions, Reviews and Bookings from Supabase, or use elegant seeds as fallback
  const loadCompanionsAndReviews = async (currentProfile: UserProfile | null, userId?: string) => {
    try {
      // 1. Fetch companions from Supabase
      const { data: dbCompanions, error: compError } = await supabase
        .from("companions")
        .select("*")
        .order("created_at", { ascending: true });

      let resolvedCompanions: Companion[] = [];
      if (!compError && dbCompanions && dbCompanions.length > 0) {
        resolvedCompanions = await Promise.all(
          dbCompanions.map(async (c) => {
            const mapped = mapCompanionFromDB(c);

            // Auto-assign pre-seeded companion tiers for any database matches defaulting to Silver
            const matchedSeed = INITIAL_COMPANIONS.find(ic => ic.id === mapped.id || ic.name === mapped.name);
            if (matchedSeed && mapped.pricingTier === "Silver" && matchedSeed.pricingTier && matchedSeed.pricingTier !== "Silver") {
              mapped.pricingTier = matchedSeed.pricingTier;
            }

            if (mapped.avatar && !mapped.avatar.startsWith("http://") && !mapped.avatar.startsWith("https://") && !mapped.avatar.startsWith("data:")) {
              try {
                const { data: signedData, error: signedError } = await supabase.storage
                  .from("app-files")
                  .createSignedUrl(mapped.avatar, 3600);
                if (!signedError && signedData) {
                  mapped.avatar = signedData.signedUrl;
                }
              } catch (err) {
                console.error("Error signing url for", mapped.id, err);
              }
            }

            if (mapped.photos && mapped.photos.length > 0) {
              try {
                mapped.photos = await Promise.all(
                  mapped.photos.map(async (photo) => {
                    if (photo && !photo.startsWith("http://") && !photo.startsWith("https://") && !photo.startsWith("data:")) {
                      const { data: signedData, error: signedError } = await supabase.storage
                        .from("app-files")
                        .createSignedUrl(photo, 3600);
                      if (!signedError && signedData) {
                        return signedData.signedUrl;
                      }
                    }
                    return photo;
                  })
                );
              } catch (err) {
                console.error("Error signing portfolio photos for", mapped.id, err);
              }
            }
            return mapped;
          })
        );
        setCompanions(resolvedCompanions);
      } else {
        const localComps = getStoredCompanions();
        resolvedCompanions = localComps;
        setCompanions(localComps);

        // Seed companions table if empty and user is logged in
        if (!compError && (!dbCompanions || dbCompanions.length === 0) && userId) {
          const seedData = localComps.map(c => mapCompanionToDB(c));
          await supabase.from("companions").insert(seedData);
        }
      }

      // 2. Fetch reviews from Supabase
      const { data: dbReviews, error: revError } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: true });

      if (!revError && dbReviews && dbReviews.length > 0) {
        setReviews(dbReviews.map(mapReviewFromDB));
      } else {
        const localReviews = getStoredReviews();
        setReviews(localReviews);

        // Seed reviews table if empty and user is logged in
        if (!revError && (!dbReviews || dbReviews.length === 0) && userId) {
          const seedData = localReviews.map(r => mapReviewToDB(r));
          await supabase.from("reviews").insert(seedData);
        }
      }

      // 3. Fetch Bookings from Supabase
      if (userId) {
        let bookingsQuery = supabase.from("bookings").select("*").order("created_at", { ascending: false });
        if (currentProfile && !currentProfile.isAdmin) {
          bookingsQuery = bookingsQuery.eq("user_id", userId);
        }
        const { data: dbBookings, error: bookError } = await bookingsQuery;
        if (!bookError && dbBookings) {
          const mappedBookings = dbBookings.map(b => {
            const booking = mapBookingFromDB(b);
            const comp = resolvedCompanions.find(c => c.id === booking.companionId);
            if (comp) {
              booking.companionAvatar = comp.avatar;
            }
            return booking;
          });
          setBookings(mappedBookings);
        } else {
          setBookings(getStoredBookings());
        }
      } else {
        setBookings([]);
      }
      
      // 4. Fetch Payment Requests from Supabase
      await loadPaymentRequests(currentProfile, userId);

      // 5. Fetch all profiles if owner admin
      if (currentProfile && currentProfile.email.toLowerCase() === "komailali116@gmail.com") {
        try {
          const { data: dbProfiles, error: profError } = await supabase.from("profiles").select("*");
          if (!profError && dbProfiles) {
            setAllProfiles(dbProfiles.map(mapProfileFromDB));
          }
        } catch (pe) {
          console.error("Failed to load all user profiles for admin dashboard:", pe);
        }
      }
    } catch (err) {
      console.error("Failed to load data from Supabase, falling back to offline seeds:", err);
      setCompanions(getStoredCompanions());
      setReviews(getStoredReviews());
      setBookings(getStoredBookings());
      setPaymentRequests([]);
    }
  };

  // Admin Logs & System Settings Governance Flow
  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .maybeSingle();

      if (data && data.avatar) {
        const parsed = JSON.parse(data.avatar);
        setAppSettings(prev => {
          const merged = { ...prev, ...parsed };
          // Sync multipliers immediately to local storage so pricing calculations updates instantly!
          localStorage.setItem("yarana_multipliers", JSON.stringify({
            silver: merged.silverMultiplier,
            gold: merged.goldMultiplier,
            platinum: merged.platinumMultiplier
          }));
          return merged;
        });
      } else {
        // Create special system settings row if it doesn't exist
        const defaultSettings = {
          announcement: "✨ Welcome to Yarana.pk - Pakistan's #1 Safe and Verified Companionship Platform!",
          bannerEnabled: true,
          bannerText: "📢 Official Notice: All host companions undergo manual identity verification for maximum safety and compliance.",
          silverMultiplier: 1.0,
          goldMultiplier: 1.3,
          platinumMultiplier: 2.21,
          membershipSilverFee: 0,
          membershipGoldFee: 4999,
          membershipPlatinumFee: 9999,
          adminLogs: [
            { id: "log_1", timestamp: new Date().toISOString(), title: "Governance Booted", details: "Initial security baseline established", ip: "System Kernel" }
          ]
        };
        await supabase.from("profiles").insert({
          id: "00000000-0000-0000-0000-000000000000",
          name: "System Settings",
          email: "settings@yarana.pk",
          avatar: JSON.stringify(defaultSettings),
          is_admin: true,
          phone: "SYSTEM",
          city: "SYSTEM"
        });
      }
    } catch (err) {
      console.error("Failed to load global settings:", err);
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    setAppSettings(newSettings);
    localStorage.setItem("yarana_multipliers", JSON.stringify({
      silver: newSettings.silverMultiplier,
      gold: newSettings.goldMultiplier,
      platinum: newSettings.platinumMultiplier
    }));

    try {
      await supabase.from("profiles").upsert({
        id: "00000000-0000-0000-0000-000000000000",
        name: "System Settings",
        email: "settings@yarana.pk",
        avatar: JSON.stringify(newSettings),
        is_admin: true,
        phone: "SYSTEM",
        city: "SYSTEM",
        updated_at: new Date().toISOString()
      });
      await logAdminAction("Settings Modified", "Updated system multipliers or announcement banners");
    } catch (err) {
      console.error("Failed to save global settings:", err);
    }
  };

  const logAdminAction = async (title: string, details: string) => {
    const newLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      title,
      details,
      ip: user?.email || "komailali116@gmail.com"
    };

    setAppSettings(prev => {
      const updatedLogs = [newLog, ...(prev.adminLogs || [])];
      const updatedSettings = { ...prev, adminLogs: updatedLogs };

      // Async write to DB
      supabase.from("profiles").upsert({
        id: "00000000-0000-0000-0000-000000000000",
        name: "System Settings",
        email: "settings@yarana.pk",
        avatar: JSON.stringify(updatedSettings),
        is_admin: true,
        phone: "SYSTEM",
        city: "SYSTEM",
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error("Async log write failed:", error);
      });

      return updatedSettings;
    });
  };

  const handleSuspendUser = async (targetUserId: string, isSuspended: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ selected_role: isSuspended ? "suspended" : "client" })
        .eq("id", targetUserId);

      if (error) throw error;

      await logAdminAction(isSuspended ? "User Suspended" : "User Reactivated", `Modified account state for profile ID: ${targetUserId}`);

      // Reload profiles list
      const { data: dbProfiles } = await supabase.from("profiles").select("*");
      if (dbProfiles) {
        setAllProfiles(dbProfiles.map(mapProfileFromDB));
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
      alert("Error updating user status: " + (err as any).message);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm("CRITICAL WARNING: Are you absolutely sure you want to delete this user profile? All review history and bookings will be wiped. This action is permanent and irreversible.")) {
      return;
    }
    try {
      await supabase.from("reviews").delete().eq("user_id", targetUserId);
      await supabase.from("bookings").delete().eq("user_id", targetUserId);
      const { error } = await supabase.from("profiles").delete().eq("id", targetUserId);

      if (error) throw error;

      await logAdminAction("User Deleted", `Permanently dropped profile record: ${targetUserId}`);

      // Reload profiles list
      const { data: dbProfiles } = await supabase.from("profiles").select("*");
      if (dbProfiles) {
        setAllProfiles(dbProfiles.map(mapProfileFromDB));
      }
    } catch (err) {
      console.error("Failed to delete user profile:", err);
      alert("Error dropping user profile: " + (err as any).message);
    }
  };

  const handleEditCompanionProfile = async (id: string, updatedFields: Partial<Companion>) => {
    const updated = companions.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setCompanions(updated);
    saveStoredCompanions(updated);

    try {
      const { data } = await supabase.from("companions").select("*").eq("id", id).maybeSingle();
      if (data) {
        let rawTagline = `[Tier:${updatedFields.pricingTier || data.tagline?.match(/\[Tier:(\w+)\]/)?.[1] || "Silver"}]`;
        if (updatedFields.photos) {
          rawTagline += ` [Photos:${JSON.stringify(updatedFields.photos)}]`;
        }
        const cleanTag = (updatedFields.tagline || data.tagline || "").replace(/\[Tier:\w+\]|\[Photos:\[.*?\]\]/g, "").trim();
        if (cleanTag) {
          rawTagline += ` ${cleanTag}`;
        }

        const { error } = await supabase.from("companions").update({
          name: updatedFields.name || data.name,
          age: updatedFields.age !== undefined ? updatedFields.age : data.age,
          city: updatedFields.city || data.city,
          bio: updatedFields.bio || data.bio,
          tagline: rawTagline,
          is_online: updatedFields.isOnline !== undefined ? updatedFields.isOnline : data.is_online,
        }).eq("id", id);

        if (error) throw error;
        await logAdminAction("Companion Edited", `Modified profile attributes for companion: ${id}`);
      }
    } catch (err) {
      console.error("Failed to edit companion profile in DB:", err);
    }
  };

  // Initial Session Checking and Data Synchronization
  useEffect(() => {
    const checkSupabaseSession = async () => {
      await loadGlobalSettings();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        localStorage.removeItem("yarana_profile");
        loadCompanionsAndReviews(null);
      } else {
        const userId = session.user.id;
        let profileData: UserProfile | null = null;

        try {
          // Fetch or upsert user profile in profiles table
          const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
          if (data) {
            profileData = mapProfileFromDB(data);
            const email = (profileData.email || session.user.email || "").toLowerCase();
            // Ensure ONLY the owner (komailali116@gmail.com) can ever be an admin.
            if (email === "komailali116@gmail.com") {
              profileData.isAdmin = true;
              profileData.email = "komailali116@gmail.com";
            } else {
              profileData.isAdmin = false;
            }
          } else {
            const email = session.user.email || "";
            const metadata = session.user.user_metadata || {};
            const isAdmin = email.toLowerCase() === "komailali116@gmail.com";
            const initialProfile: UserProfile = {
              name: metadata.name || email.split("@")[0].split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || "Yarana Member",
              email: email,
              phone: metadata.phone || "0300-1234567",
              city: metadata.city || "Lahore",
              avatar: metadata.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
              isAdmin: isAdmin,
            };
            const { error: insertError } = await supabase.from("profiles").insert(mapProfileToDB(initialProfile, userId));
            if (!insertError) {
              profileData = initialProfile;
            }
          }
        } catch (e) {
          console.error("Profiles sync failed, falling back to local storage:", e);
        }

        if (profileData) {
          setUser(profileData);
          saveStoredProfile(profileData);
          if (profileData.isAdmin) {
            setCurrentTab("admin");
          } else if (profileData.selectedRole === "companion") {
            setCurrentTab("become_companion");
          } else {
            setCurrentTab("browse");
          }
          loadCompanionsAndReviews(profileData, userId);
        } else {
          const storedUser = localStorage.getItem("yarana_profile");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            loadCompanionsAndReviews(parsedUser, userId);
          }
        }
      }
    };

    checkSupabaseSession();
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        localStorage.removeItem("yarana_profile");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update User Profile in local state, localStorage, and Supabase database
  const handleUpdateProfile = async (updated: UserProfile) => {
    setUser(updated);
    saveStoredProfile(updated);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("profiles").upsert(mapProfileToDB(updated, session.user.id));
      }
    } catch (err) {
      console.error("Could not save profile to Supabase database:", err);
    }
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



  // Switch between admin and client user easily for testing
  const handleToggleAdminRole = () => {
    if (!user) return;
    if (user.email.toLowerCase() !== "komailali116@gmail.com") {
      alert("Access Denied: Only the owner (komailali116@gmail.com) can access the admin panel.");
      return;
    }
    if (user.isAdmin) {
      const normalUser = { ...user, isAdmin: false, selectedRole: "client" as const };
      handleUpdateProfile(normalUser);
      setCurrentTab("browse");
    } else {
      const adminUser = { ...user, isAdmin: true };
      handleUpdateProfile(adminUser);
      setCurrentTab("admin");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("yarana_profile");
    supabase.auth.signOut();
    setCurrentTab("browse");
  };

  const loadBookings = async (currentProfile: UserProfile | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      let bookingsQuery = supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (currentProfile && !currentProfile.isAdmin) {
        bookingsQuery = bookingsQuery.eq("user_id", userId);
      }
      const { data: dbBookings, error: bookError } = await bookingsQuery;
      if (!bookError && dbBookings) {
        const mappedBookings = dbBookings.map(b => {
          const booking = mapBookingFromDB(b);
          const comp = companions.find(c => c.id === booking.companionId);
          if (comp) {
            booking.companionAvatar = comp.avatar;
          }
          return booking;
        });
        setBookings(mappedBookings);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  // Callback when a manual payment request is successfully saved in Supabase
  const handlePaymentRequestSubmitted = async () => {
    setCheckoutBooking(null);
    setSelectedCompanion(null);
    
    // Refresh user's payment request logs
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await loadPaymentRequests(user, session.user.id);
    }
    
    setCurrentTab("bookings");
  };

  // Cancel booking (without wallet refund)
  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking || targetBooking.status !== "paid") return;

    // 1. Update booking status
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: "cancelled" as const };
      }
      return b;
    });

    setBookings(updatedBookings);
    saveStoredBookings(updatedBookings);

    try {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    } catch (err) {
      console.error("Failed to cancel booking on Supabase database:", err);
    }
  };

  // Admin approves manual payment
  const handleApprovePayment = async (requestId: string) => {
    try {
      const req = paymentRequests.find(r => r.id === requestId);
      if (!req) return;

      // 1. Update request status to Approved in database
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({ status: "Approved" })
        .eq("id", requestId);
      if (updateError) throw updateError;

      // 2. Create actual paid booking in database
      const newBooking: Booking = {
        id: "book_" + Date.now(),
        companionId: req.companionId,
        companionName: req.companionName,
        companionAvatar: req.companionAvatar,
        serviceId: req.serviceId,
        serviceName: req.serviceName,
        date: req.bookingDate,
        time: req.bookingTime,
        duration: req.duration,
        totalPrice: req.totalPrice,
        status: "paid",
        paymentMethod: "Manual",
        paymentNumber: req.lastFour,
        meetingLocationType: req.meetingLocationType || "Public Cafe",
        meetingAddress: req.meetingAddress || "To be arranged",
        meetingInstructions: req.meetingInstructions || "",
        createdAt: new Date().toISOString()
      };

      const { error: insertBookingError } = await supabase
        .from("bookings")
        .insert(mapBookingToDB(newBooking, req.userId));
      
      if (insertBookingError) throw insertBookingError;

      // 3. Reload logs & bookings lists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadPaymentRequests(user, session.user.id);
      }
      await loadBookings(user);
    } catch (err: any) {
      console.error("Failed to approve payment:", err);
      alert("Error approving payment request: " + err.message);
    }
  };

  // Admin rejects manual payment
  const handleRejectPayment = async (requestId: string) => {
    try {
      // Update request status to Rejected in database
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({ status: "Rejected" })
        .eq("id", requestId);
      if (updateError) throw updateError;

      // Reload logs
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadPaymentRequests(user, session.user.id);
      }
    } catch (err: any) {
      console.error("Failed to reject payment:", err);
      alert("Error rejecting payment request: " + err.message);
    }
  };

  // Complete booking & submit review feedback
  const handleCompleteBooking = async (bookingId: string, rating: number, comment: string) => {
    if (!user) return;

    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return;

    // 1. Update Booking status in local state and localStorage
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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Update booking status in database
      await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
      // Insert new review
      await supabase.from("reviews").insert(mapReviewToDB(newReview, session ? session.user.id : null));
      // Update companion stats
      await supabase.from("companions").update({
        rating: avgRating,
        reviews_count: companionReviews.length
      }).eq("id", targetBooking.companionId);
    } catch (err) {
      console.error("Failed to complete booking and post feedback on Supabase:", err);
    }
  };

  // ADMIN ACTION: Approve pending host application
  const handleApproveCompanion = async (id: string, tier?: "Silver" | "Platinum" | "Gold") => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, status: CompanionStatus.APPROVED, pricingTier: tier || c.pricingTier || "Silver" };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      const compObj = updatedCompanions.find(c => c.id === id);
      if (compObj) {
        await supabase.from("companions").update(mapCompanionToDB(compObj)).eq("id", id);
      }
    } catch (err) {
      console.error("Failed to approve companion in Supabase database:", err);
    }
  };

  // ADMIN ACTION: Update dynamic pricing tier for active host
  const handleUpdateCompanionTier = async (id: string, tier: "Silver" | "Platinum" | "Gold") => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, pricingTier: tier };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      const compObj = updatedCompanions.find(c => c.id === id);
      if (compObj) {
        await supabase.from("companions").update(mapCompanionToDB(compObj)).eq("id", id);
      }
    } catch (err) {
      console.error("Failed to update companion pricing tier in Supabase database:", err);
    }
  };

  const handleUpdateCompanionPhotos = async (id: string, photos: string[]) => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, photos };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      const compObj = updatedCompanions.find(c => c.id === id);
      if (compObj) {
        await supabase.from("companions").update(mapCompanionToDB(compObj)).eq("id", id);
      }
    } catch (err) {
      console.error("Failed to update companion photos in Supabase database:", err);
    }
  };

  // ADMIN ACTION: Reject pending host application
  const handleRejectCompanion = async (id: string) => {
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, status: CompanionStatus.REJECTED };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      await supabase.from("companions").update({ status: CompanionStatus.REJECTED }).eq("id", id);
    } catch (err) {
      console.error("Failed to reject companion in Supabase database:", err);
    }
  };

  // ADMIN ACTION: Dissolve host profile
  const handleRemoveCompanion = async (id: string) => {
    if (window.confirm("Are you absolutely sure you want to remove this companion from the database? This action is irreversible.")) {
      const updatedCompanions = companions.filter(c => c.id !== id);
      setCompanions(updatedCompanions);
      saveStoredCompanions(updatedCompanions);

      try {
        // Fetch original storage path first
        const { data: currentComp } = await supabase
          .from("companions")
          .select("avatar")
          .eq("id", id)
          .maybeSingle();

        if (currentComp && currentComp.avatar) {
          const path = currentComp.avatar;
          if (!path.startsWith("http://") && !path.startsWith("https://") && !path.startsWith("data:")) {
            const { error: storageError } = await supabase.storage
              .from("app-files")
              .remove([path]);
            if (storageError) {
              console.error("Failed to delete companion avatar from Storage:", path, storageError);
            } else {
              console.log("Deleted companion avatar from Storage:", path);
            }
          }
        }

        await supabase.from("companions").delete().eq("id", id);
      } catch (err) {
        console.error("Failed to remove companion from Supabase database:", err);
      }
    }
  };

  // ADMIN ACTION: Toggle host availability
  const handleToggleOnline = async (id: string) => {
    const targetComp = companions.find(c => c.id === id);
    const updatedCompanions = companions.map(c => {
      if (c.id === id) {
        return { ...c, isOnline: !c.isOnline };
      }
      return c;
    });
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      if (targetComp) {
        await supabase.from("companions").update({ is_online: !targetComp.isOnline }).eq("id", id);
      }
    } catch (err) {
      console.error("Failed to toggle availability status in Supabase database:", err);
    }
  };

  // ADMIN ACTION: Register new companion
  const handleAddNewCompanion = async (newComp: Companion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (uid) {
        const isHost = user?.selectedRole === "companion";
        const isAppAdmin = user?.isAdmin;
        const hasNoLimits = isAppAdmin || isHost;

        if (!hasNoLimits) {
          const isCustomAvatar = newComp.avatar && !newComp.avatar.startsWith("http") && !newComp.avatar.startsWith("data:");
          if (isCustomAvatar) {
            const picCount = await countUploadedPics(uid);
            if (picCount >= 3) {
              setShowLimitModal(true);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed limit check in handleAddNewCompanion:", err);
    }

    const updatedCompanions = [...companions, newComp];
    setCompanions(updatedCompanions);
    saveStoredCompanions(updatedCompanions);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("companions").insert(mapCompanionToDB(newComp, session ? session.user.id : null));
    } catch (err) {
      console.error("Failed to create new companion in Supabase database:", err);
    }
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
      ) : user.selectedRole === "suspended" ? (
        <div className="min-h-screen bg-[#F9F8F6] text-[#2D2D2D] font-sans flex flex-col justify-center items-center p-6 text-center space-y-6" id="suspension-overlay">
          <div className="p-5 bg-red-50 border border-red-150 rounded-full text-red-650 shadow-sm animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-serif font-black text-gray-900 tracking-tight">Account Suspended</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your Yarana member profile has been suspended by administrators due to safety policy violations or transaction anomalies.
            </p>
          </div>
          <div className="p-4 bg-white border border-[#E5E1D8] rounded-2xl max-w-sm w-full text-xs text-left text-gray-500 font-mono space-y-1">
            <p><span className="font-bold text-gray-700">Member:</span> {user.name}</p>
            <p><span className="font-bold text-gray-700">Email:</span> {user.email}</p>
            <p><span className="font-bold text-gray-700">Status:</span> <span className="text-red-600 font-bold">Immutable Suspended</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-[#1A1C20] text-white hover:bg-[#D4AF37] hover:text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            Logout and Exit
          </button>
        </div>
      ) : !user.selectedRole && !user.isAdmin ? (
        <RoleSelectionPage
          user={user}
          onSelectRole={handleSwitchRole}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Top Global Announcement Bar */}
          {appSettings.announcement && (
            <div className="bg-[#1A1C20] text-white py-2 px-4 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-2 border-b border-[#D4AF37]/20 select-none animate-fade-in" id="global-announcement">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-ping shrink-0" />
              <span>{appSettings.announcement}</span>
            </div>
          )}

          {/* Main Top Navigation */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            profile={user}
            onLogout={handleLogout}
            onToggleAdmin={handleToggleAdminRole}
            onSwitchRole={handleSwitchRole}
          />

          {/* Global Alert Banner */}
          {appSettings.bannerEnabled && appSettings.bannerText && (
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 animate-fade-in" id="global-alert-banner">
              <div className="bg-amber-50 border border-[#D4AF37]/30 text-[#856404] px-4 py-3 rounded-2xl text-[11px] flex items-center gap-3 shadow-sm font-medium">
                <span className="p-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">📢</span>
                <span className="flex-grow">{appSettings.bannerText}</span>
              </div>
            </div>
          )}

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
                  paymentRequests={paymentRequests}
                  onUpdateProfile={handleUpdateProfile}
                  onCancelBooking={handleCancelBooking}
                  onCompleteBooking={handleCompleteBooking}
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
                  onUpdateCompanionPhotos={handleUpdateCompanionPhotos}
                  onResubmitApplication={async (companionId) => {
                    const updated = companions.filter(c => c.id !== companionId);
                    setCompanions(updated);
                    saveStoredCompanions(updated);
                    try {
                      // Fetch original storage path first
                      const { data: currentComp } = await supabase
                        .from("companions")
                        .select("avatar")
                        .eq("id", companionId)
                        .maybeSingle();

                      if (currentComp && currentComp.avatar) {
                        const path = currentComp.avatar;
                        if (!path.startsWith("http://") && !path.startsWith("https://") && !path.startsWith("data:")) {
                          const { error: storageError } = await supabase.storage
                            .from("app-files")
                            .remove([path]);
                          if (storageError) {
                            console.error("Failed to delete companion avatar from Storage:", path, storageError);
                          } else {
                            console.log("Deleted companion avatar from Storage:", path);
                          }
                        }
                      }

                      await supabase.from("companions").delete().eq("id", companionId);
                    } catch (err) {
                      console.error("Failed to delete companion from database:", err);
                    }
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
                  paymentRequests={paymentRequests}
                  onApproveCompanion={handleApproveCompanion}
                  onRejectCompanion={handleRejectCompanion}
                  onRemoveCompanion={handleRemoveCompanion}
                  onToggleOnline={handleToggleOnline}
                  onAddNewCompanion={handleAddNewCompanion}
                  onUpdateCompanionTier={handleUpdateCompanionTier}
                  onApprovePayment={handleApprovePayment}
                  onRejectPayment={handleRejectPayment}
                  user={user}
                  allProfiles={allProfiles}
                  appSettings={appSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onSuspendUser={handleSuspendUser}
                  onDeleteUser={handleDeleteUser}
                  onEditCompanionProfile={handleEditCompanionProfile}
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
                onSubmitSuccess={handlePaymentRequestSubmitted}
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
                <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold border border-red-100 text-[10px] uppercase">
                  Emergency Support 24/7
                </span>
              </div>
            </div>
          </footer>
        </>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#E5E1D8] shadow-2xl text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#1A1A1A]">Free plan limit reached.</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                You can only upload up to 3 pictures on the Free Plan. Upgrade to Pro to create unlimited companions and upload more pictures.
              </p>
            </div>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full bg-[#1A1A1A] hover:bg-black text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Understood
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
