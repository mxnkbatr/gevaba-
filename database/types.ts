import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId | string;
  clerkId: string; // Links to Clerk Auth (or 'custom-db' for direct users)
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  password?: string; // Hashed password for direct DB auth

  // Spiritual Stats
  dateOfBirth?: string; // YYYY-MM-DD
  zodiacYear?: string;
  karma: number;
  meditationDays: number;
  totalMerits: number;
  earnings?: number; // Total earnings for monks
  role: "seeker" | "monk" | "admin";
  monkStatus?: "pending" | "approved" | "rejected"; // Approval status for monks
  wishlist?: string[]; // Array of Monk IDs
  fcmToken?: string; // Firebase Cloud Messaging Token for Push Notifications
  createdAt: Date;
  updatedAt: Date;
}

export interface Monk {
  _id?: ObjectId | string;
  name: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  title: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  image: string;
  video?: string;
  specialties: string[]; // e.g., ["Astrology", "Meditation"]
  bio: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  isAvailable: boolean;
  quote: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  monkNumber?: number; // Order/Display number
  showOnHomepage?: boolean; // Admin-controlled: Display on homepage

  // New Fields
  phone?: string;
  isSpecial?: boolean; // Admin-controlled special status
  isBadMonk?: boolean; // Admin-controlled: forced schedule restriction
  yearsOfExperience: number;
  education: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  philosophy: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  services: {
    id: string;
    name: {
      mn: string;
      en: string;
      ko?: string;
      de?: string;
    };
    price: number; // in local currency
    duration: string; // e.g., "30 min", "1 hour"
    status?: 'pending' | 'active' | 'rejected';
  }[];
  schedule?: {
    day: string;
    start: string;
    end: string;
    active: boolean;
    slots?: string[]; // New: Specific flexible slots
  }[];
  blockedSlots?: {
    id: string;
    date: string;
    time: string;
  }[];
  rating?: string | number; // Added for UI display
  department?: string; // Added for UI display
}

export interface Booking {
  _id?: ObjectId | string;
  userId: string; // Clerk ID or Custom ID
  monkId: ObjectId | string;
  date: Date;
  time?: string; // Add time to interface as it is used
  userPhone?: string;
  userEmail?: string;
  type?: "Astrology" | "Counseling" | "Prayer" | "Ritual"; // Made optional as it might be derived from service
  serviceName?: { mn: string; en: string; ko?: string; de?: string; }; // Add serviceName to interface
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected"; // Add rejected
  notes?: string;
  createdAt: Date;
}

export interface Comment {
  _id?: ObjectId | string;
  userId?: string; // Optional if guest
  authorName: string;
  authorRole: string;
  avatar: string;
  text: string;
  karma: number; // Likes/Upvotes
  element: "gold" | "saffron" | "ochre" | "light" | "earth" | "wind" | "water" | "fire" | "air" | "dark"; // Visual theme
  createdAt: Date;
}
export interface Service {
  _id?: ObjectId | string;
  id: string;
  name: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  price: number
  duration: string; // e.g., "30 min", "1 hour"
  type: "teaching" | "divination"; // Aesthetic theme
  desc: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  }
  subtitle: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  title: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
  image?: string;
  quote?: {
    mn: string;
    en: string;
    ko?: string;
    de?: string;
  };
}

export interface Message {
  _id?: ObjectId | string;
  bookingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export interface Notification {
  _id?: string | ObjectId;
  userId: string;
  title: { mn: string; en: string };
  message: { mn: string; en: string };
  type: "booking" | "reminder" | "system" | "message";
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface Review {
  _id?: ObjectId | string;
  monkId: string | ObjectId;
  userId: string; // Clerk ID or Custom ID
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  bookingId?: string | ObjectId; // Optional link to a specific booking
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shop (Products / Orders)
// ─────────────────────────────────────────────────────────────────────────────

export type ShopCategory =
  | "sutra" // Ном судар
  | "incense" // Хүж
  | "statue" // Бурхан
  | "mala" // Эрих
  | "ritual" // Тахилын зүйл
  | "blessing" // Адислал (digital)
  | "other";

export interface ShopProduct {
  _id?: ObjectId | string;
  name: { mn: string; en: string };
  description: { mn: string; en: string };
  price: number; // MNT
  images: string[]; // Cloudinary URLs
  category: ShopCategory;
  stock: number; // -1 = unlimited
  isActive: boolean;
  isFeatured: boolean;
  type: "physical" | "digital";
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopOrder {
  _id?: ObjectId | string;
  userId: string;
  userEmail?: string;
  items: {
    productId: string;
    name: { mn: string; en: string };
    price: number;
    quantity: number;
    image?: string;
  }[];
  totalAmount: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  qpayInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryInfo?: {
    name: string;
    phone: string;
    address: string;
    district: string;
    note?: string;
  };
}
