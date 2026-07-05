export const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Peshawar",
  "Quetta",
  "Multan",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Jhelum",
  "Murree",
  "Swat",
  "Abbottabad",
  "Gujrat",
  "Sahiwal",
  "Okara",
  "Sheikhupura",
  "Mardan",
  "Kasur",
  "Rahim Yar Khan",
  "Dera Ghazi Khan",
  "Mirpur",
  "Muzaffarabad",
  "Skardu",
  "Gilgit",
  "Gwadar",
  "Mandi Bahauddin",
  "Pakpattan",
  "Burewala",
  "Nowshera",
  "Nawabshah",
  "Kohat",
  "Muzaffargarh",
  "Chiniot",
  "Kamoke",
  "Saddiqabad",
  "Bhalwal",
  "Hassan Abdal",
  "Khuzdar",
  "Chaman",
  "Zhob",
  "Dera Ismail Khan",
  "Bannu",
  "Charsadda",
  "Swabi",
  "Chitral"
] as const;

export type PakistanCity = typeof PAKISTAN_CITIES[number];

export enum CompanionGender {
  FEMALE = "Female",
  MALE = "Male",
  OTHER = "Other"
}

export enum CompanionStatus {
  PENDING = "Pending Approval",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export interface Companion {
  id: string;
  name: string;
  age: number;
  gender: CompanionGender;
  city: PakistanCity;
  avatar: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  languages: string[];
  interests: string[];
  services: string[]; // List of service IDs they offer
  status: CompanionStatus;
  isOnline: boolean;
  featured: boolean;
  tagline?: string;
  cnic?: string;
  mobile?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number; // in PKR
  baseHours: number; // duration covered by base price
  extraHourPrice: number; // in PKR
  extraUnitName: "hour" | "minute";
  userResponsibility: string;
  icon: string; // Lucide icon string
}

export interface Booking {
  id: string;
  companionId: string;
  companionName: string;
  companionAvatar: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number; // hours or minutes
  totalPrice: number;
  status: "pending" | "paid" | "completed" | "cancelled";
  paymentMethod?: "JazzCash" | "EasyPaisa";
  paymentNumber?: string;
  meetingLocationType?: string;
  meetingAddress?: string;
  meetingInstructions?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  companionId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar: string;
  walletBalance: number; // in PKR
  isAdmin: boolean;
  selectedRole?: "client" | "companion";
}
