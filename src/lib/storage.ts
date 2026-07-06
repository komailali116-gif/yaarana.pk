import { Companion, Booking, Review, UserProfile, CompanionStatus } from "../types";
import { INITIAL_COMPANIONS, INITIAL_REVIEWS } from "../data/companions";

const COMPANIONS_KEY = "yarana_companions";
const BOOKINGS_KEY = "yarana_bookings";
const REVIEWS_KEY = "yarana_reviews";
const PROFILE_KEY = "yarana_profile";

export function getStoredCompanions(): Companion[] {
  const stored = localStorage.getItem(COMPANIONS_KEY);
  if (!stored) {
    localStorage.setItem(COMPANIONS_KEY, JSON.stringify(INITIAL_COMPANIONS));
    return INITIAL_COMPANIONS;
  }
  try {
    const list = JSON.parse(stored) as Companion[];
    let upgraded = false;
    const healed = list.map(c => {
      const seed = INITIAL_COMPANIONS.find(sc => sc.id === c.id);
      if (!c.pricingTier || (c.pricingTier === "Silver" && seed?.pricingTier && seed.pricingTier !== "Silver")) {
        c.pricingTier = seed?.pricingTier || "Silver";
        upgraded = true;
      }
      return c;
    });
    if (upgraded) {
      localStorage.setItem(COMPANIONS_KEY, JSON.stringify(healed));
    }
    return healed;
  } catch (e) {
    localStorage.setItem(COMPANIONS_KEY, JSON.stringify(INITIAL_COMPANIONS));
    return INITIAL_COMPANIONS;
  }
}

export function saveStoredCompanions(companions: Companion[]) {
  localStorage.setItem(COMPANIONS_KEY, JSON.stringify(companions));
}

export function getStoredBookings(): Booking[] {
  const stored = localStorage.getItem(BOOKINGS_KEY);
  if (!stored) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(stored);
}

export function saveStoredBookings(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function getStoredReviews(): Review[] {
  const stored = localStorage.getItem(REVIEWS_KEY);
  if (!stored) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  return JSON.parse(stored);
}

export function saveStoredReviews(reviews: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export const DEFAULT_USER: UserProfile = {
  name: "",
  email: "",
  phone: "",
  city: "Lahore",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
  isAdmin: false
};

export const DEFAULT_ADMIN: UserProfile = {
  name: "Yarana Admin",
  email: "admin@yarana.pk",
  phone: "0300-7654321",
  city: "Islamabad",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
  isAdmin: true
};

export function getStoredProfile(): UserProfile {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  }
  return JSON.parse(stored);
}

export function saveStoredProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function resetLocalStorage() {
  localStorage.removeItem(COMPANIONS_KEY);
  localStorage.removeItem(BOOKINGS_KEY);
  localStorage.removeItem(REVIEWS_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
