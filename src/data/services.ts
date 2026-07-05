import { Service } from "../types";

export const SERVICES: Service[] = [
  {
    id: "dining",
    name: "Dining Companion",
    description: "Spend a beautiful 2-hour dinner with a companion. Share conversations, laughter, and gourmet meals at top-tier restaurants.",
    basePrice: 1999,
    baseHours: 2,
    extraHourPrice: 500,
    extraUnitName: "hour",
    userResponsibility: "User covers the cost of dinner and drinks for both.",
    icon: "Utensils"
  },
  {
    id: "movie",
    name: "Movie Companion",
    description: "Watch your favorite blockbusters or classics together. No more going to the theater alone.",
    basePrice: 2499,
    baseHours: 3,
    extraHourPrice: 700,
    extraUnitName: "hour",
    userResponsibility: "User covers cinema tickets, popcorn, and snacks for both.",
    icon: "Film"
  },
  {
    id: "call",
    name: "Call a Companion",
    description: "Connect instantly on call through our secure, masked companion hotline. Share your thoughts and day details securely.",
    basePrice: 1000,
    baseHours: 1, // 1 hour = 60 minutes
    extraHourPrice: 40, // 40 PKR per extra minute
    extraUnitName: "minute",
    userResponsibility: "None. All calls are placed through our masked system lines.",
    icon: "PhoneCall"
  },
  {
    id: "day_spend",
    name: "Spend a Day",
    description: "Explore the city, visit museums, go shopping, or run errands with a friendly companion for a whole day (8 hours).",
    basePrice: 1699,
    baseHours: 8,
    extraHourPrice: 999,
    extraUnitName: "hour",
    userResponsibility: "User provides food, entry tickets, and transport essentials.",
    icon: "Sun"
  },
  {
    id: "travel",
    name: "Travel Companion",
    description: "Plan an adventure or a quiet trip to northern areas, beach resorts, or cultural sites to drive away loneliness.",
    basePrice: 20999,
    baseHours: 48, // 2 days
    extraHourPrice: 1999, // extra hour price is 1999 PKR (and doubles every additional hour - handled in calculation)
    extraUnitName: "hour",
    userResponsibility: "User covers safe accommodation (separate rooms), travel tickets, and all food costs.",
    icon: "Compass"
  },
  {
    id: "night_spend",
    name: "Spend a Night",
    description: "Spend a respectful 8-hour overnight social session with a companion. Deep conversations and peaceful night walks with strict mutual respect.",
    basePrice: 16999,
    baseHours: 8,
    extraHourPrice: 999,
    extraUnitName: "hour",
    userResponsibility: "Strict respectful boundaries apply. User provides dinner/food and comfortable lounge seating.",
    icon: "Moon"
  },
  {
    id: "study",
    name: "Study Companion",
    description: "Study or prepare for exams in your favorite subjects together. Keep motivated and stay focused on your academic goals.",
    basePrice: 1499,
    baseHours: 2,
    extraHourPrice: 499,
    extraUnitName: "hour",
    userResponsibility: "User arranges a public or university library workspace or cafe.",
    icon: "BookOpen"
  }
];

export function getTierMultiplier(tier: string | undefined): number {
  if (!tier) return 1.0;
  const t = tier.trim().toLowerCase();
  if (t === "platinum") return 1.30;
  if (t === "gold") return 1.30 * 1.70; // Gold is 70% higher than Platinum rates
  return 1.0; // Silver is the base rate
}

export function calculatePrice(serviceId: string, duration: number, tier?: string): number {
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) return 0;

  const multiplier = getTierMultiplier(tier);
  const basePrice = Math.round(service.basePrice * multiplier);
  const extraHourPrice = Math.round(service.extraHourPrice * multiplier);

  const baseDuration = service.baseHours;
  if (duration <= baseDuration) {
    return basePrice;
  }

  const extra = duration - baseDuration;

  if (serviceId === "travel") {
    // Travel extra hour doubles every additional hour!
    let totalExtra = 0;
    let currentHourPrice = extraHourPrice;
    for (let i = 0; i < extra; i++) {
      totalExtra += currentHourPrice;
      currentHourPrice *= 2;
      // Cap so it doesn't overflow inf
      if (currentHourPrice > 1000000) currentHourPrice = 1000000;
    }
    return basePrice + totalExtra;
  }

  if (service.extraUnitName === "minute") {
    // For calls, base duration is 1 hour (60 minutes).
    const baseMinutes = baseDuration * 60;
    if (duration <= baseMinutes) return basePrice;
    const extraMins = duration - baseMinutes;
    return basePrice + extraMins * extraHourPrice;
  }

  // General hourly services:
  return basePrice + Math.ceil(extra) * extraHourPrice;
}
