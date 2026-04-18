"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Users, Calendar, LayoutDashboard,
  Search, Trash2, CheckCircle, XCircle,
  Loader2, UserCog, ScrollText, TrendingUp, Check, X,
  FileText, Clock, Edit, Plus, RefreshCw, LogOut, Eye
} from "lucide-react";
import { formatDate } from "@/app/lib/dateUtils";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

const BookingDetailModal = dynamic(() => import('./BookingDetailModal'));
const MonkEditModal = dynamic(() => import('./MonkEditModal'));
const ServiceCreateModal = dynamic(() => import('./ServiceCreateModal'));
const UserEditModal = dynamic(() => import('./UserEditModal'));
import { useAuth } from "@/contexts/AuthContext";

// --- TYPES ---
// --- TYPES ---
interface LocalizedString {
  mn?: string;
  en?: string;
  [key: string]: string | undefined;
}

interface User {
  _id: string;
  name?: LocalizedString | any; // handling flexible structures seen in code
  email?: string;
  image?: string;
  role?: string;
  monkStatus?: string;
  showOnHomepage?: boolean;
  createdAt: string | Date;
  // properties used in applications view
  title?: LocalizedString;
  yearsOfExperience?: number;
  phone?: string;
}

interface Service {
  id: string;
  name?: LocalizedString;
  title?: LocalizedString;
  type?: string;
  price?: number;
  duration?: string;
  desc?: string;
  subtitle?: string;
  image?: string;
  quote?: string;
  monkName?: LocalizedString;
  status?: string;
  description?: LocalizedString;
  availableMonks?: number;
  isUniversal?: boolean;
  source?: string;
}

interface Booking {
  _id: string;
  userId?: string; // Clerk ID or Custom ID
  monkId?: string; // Add this field
  serviceName?: LocalizedString | string;
  price?: number;
  clientName?: string;
  clientEmail?: string;
  userPhone?: string; // Add this field
  date: string | Date;
  time?: string;
  status?: string;
}

interface Application extends User { }

interface AdminData {
  users: User[];
  bookings: Booking[];
  services: Service[];
  applications: Application[];
  stats: {
    totalUsers: number;
    totalMonks: number;
    totalBookings: number;
    revenue: number;
  };
}

export default function AdminDashboard() {
  // Use AuthContext as source of truth for Role (Database)
  // this bypasses stale Clerk tokens
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "bookings" | "services" | "applications">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingMonk, setEditingMonk] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [wasm, setWasm] = useState<typeof import("rust-modules") | null>(null);

  const isLoaded = !authLoading;
  const isAdmin = user?.role === "admin" || (user as any)?.isSpecial === true;
  const isDark = false;

  useEffect(() => {
    // Load Rust WASM module
    import("rust-modules").then(async (mod) => {
      await mod.default();
      setWasm(mod);
    }).catch(err => console.error("WASM load failed", err));
  }, []);

  // --- FETCH DATA ---
  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        // Filter users to find pending applications if API doesn't separate them
        if (!json.applications) {
          json.applications = json.users.filter((u: any) => u.monkStatus === 'pending');
        }
        setData(json);
      } else {
        router.push("/");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isLoaded) {
      if (!user) { router.push("/sign-in"); return; }
      if (!isAdmin) { router.push("/"); return; }
      fetchAdminData();
    }
  }, [isLoaded, user, isAdmin, router]);

  // --- ACTIONS ---

  // 0. Create Service
  const [editingService, setEditingService] = useState<any>(null); // New state for editing service
  const [syncingServices, setSyncingServices] = useState(false);
  const [generatingBadMonk, setGeneratingBadMonk] = useState(false);

  // 0. Create/Edit Service Helper
  const handleSaveService = async (serviceData: any, id?: string) => {
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/admin/services/${id}` : "/api/services";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData)
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        await fetchAdminData();
        setIsServiceModalOpen(false);
        setEditingService(null);
      } else {
        const errorMessage = responseData.message || `Failed to ${id ? 'update' : 'create'} service`;
        alert(`Error: ${errorMessage}`);
        console.error(`Service ${id ? 'update' : 'creation'} failed:`, responseData);
      }
    } catch (e) {
      console.error(`Error ${id ? 'updating' : 'creating'} service:`, e);
      alert(`Network error during service ${id ? 'update' : 'creation'}. Please try again.`);
    }
  };

  const handleSaveMonk = async (id: string, updatedData: any) => {
    try {
      const res = await fetch(`/api/monks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        await fetchAdminData();
        setEditingMonk(null);
      } else {
        const errorMessage = responseData.message || "Failed to update monk";
        alert(`Error: ${errorMessage}`);
        console.error(`Monk update failed:`, responseData);
      }
    } catch (e) {
      console.error("Error updating monk:", e);
      alert("Network error during monk update. Please try again.");
    }
  };

  const handleSaveUser = async (id: string, updatedData: any) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        await fetchAdminData();
        setEditingUser(null);
      } else {
        const errorMessage = responseData.message || "Failed to update user";
        alert(`Error: ${errorMessage}`);
        console.error(`User update failed:`, responseData);
      }
    } catch (e) {
      console.error("Error updating user:", e);
      alert("Network error during user update. Please try again.");
    }
  };

  // 1. Approve/Reject Monk Application
  const handleApplication = async (userId: string, action: 'approve' | 'reject') => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/applications/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        // Only refresh data if the operation was successful
        await fetchAdminData();
      } else {
        // Show error message to user
        const errorMessage = responseData.message || `Failed to ${action} application`;
        alert(`Error: ${errorMessage}`);
        console.error(`${action} operation failed:`, responseData);
      }
    } catch (e) {
      console.error(`Error during ${action} operation:`, e);
      alert(`Network error during ${action} operation. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  // 2. Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Та энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?")) return;
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        // Only refresh data if the operation was successful
        await fetchAdminData();
      } else {
        // Show error message to user

        const errorMessage = responseData.message || "Failed to delete user";
        alert(`Error: ${errorMessage}`);
        console.error(`User deletion failed:`, responseData);
      }
    } catch (e) {
      console.error("Error during user deletion:", e);
      alert("Network error during user deletion. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Approve/Reject/Delete Services
  const handleServiceAction = async (serviceId: string, action: 'approve' | 'reject') => {
    setProcessingId(serviceId);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        // Only refresh data if the operation was successful
        await fetchAdminData();
      } else {
        // Show error message to user
        const errorMessage = responseData.message || `Failed to ${action} service`;
        alert(`Error: ${errorMessage}`);
        console.error(`Service ${action} operation failed:`, responseData);
      }
    } catch (e) {
      console.error(`Error during service ${action} operation:`, e);
      alert(`Network error during service ${action} operation. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Та энэ үйлчилгээг устгахдаа итгэлтэй байна уу?")) return;
    setProcessingId(serviceId);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: 'DELETE' });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        // Only refresh data if the operation was successful
        await fetchAdminData();
      } else {
        // Show error message to user
        const errorMessage = responseData.message || "Failed to delete service";
        alert(`Error: ${errorMessage}`);
        console.error(`Service deletion failed:`, responseData);
      }
    } catch (e) {
      console.error("Error during service deletion:", e);
      alert("Network error during service deletion. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Handle Bookings
  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    setProcessingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      const responseData = await res.json();

      if (res.ok && responseData.success) {
        // Only refresh data if the operation was successful
        await fetchAdminData();
      } else {
        // Show error message to user
        const errorMessage = responseData.message || `Failed to ${action} booking`;
        alert(`Error: ${errorMessage}`);
        console.error(`Booking ${action} operation failed:`, responseData);
      }
    } catch (e) {
      console.error(`Error during booking ${action} operation:`, e);
      alert(`Network error during booking ${action} operation. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  }

  // Filters with Rust WASM
  const getFilteredData = <T,>(items: T[], term: string): T[] => {
    if (!items) return [];
    if (wasm) {
      try {
        const result = wasm.fuzzy_search(JSON.stringify(items), term);
        return JSON.parse(result);
      } catch (e) {
        console.error("Rust search error:", e);
      }
    }
    // Fallback JS
    return items.filter(item => JSON.stringify(item).toLowerCase().includes(term.toLowerCase()));
  };

  const filteredUsers = useMemo(() => getFilteredData(data?.users || [], searchTerm), [data?.users, searchTerm, wasm]);
  const filteredBookings = useMemo(() => getFilteredData(data?.bookings || [], searchTerm), [data?.bookings, searchTerm, wasm]);
  const filteredServices = useMemo(() => getFilteredData(data?.services || [], searchTerm), [data?.services, searchTerm, wasm]);

  // Loading State
  if (!isLoaded || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#05051a]">
      <Loader2 className="animate-spin text-amber-600" size={48} />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className={`min-h-screen font-sans ${isDark ? "bg-[#05051a] text-white" : "bg-cream text-ink"}`}>
      <main className="container mx-auto px-4 md:px-6 pb-20" style={{ paddingTop: 'calc(var(--header-height-mobile) + env(safe-area-inset-top, 0px))' }}>

        {/* HEADER */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-red-500 w-5 h-5" />
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] opacity-60">Admin System</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight">Удирдлагын самбар</h1>
            <p className="opacity-60 text-sm mt-1">Хэрэглэгч, лам нар болон захиалгуудыг удирдах.</p>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4 p-3 rounded-2xl bg-black/5 md:bg-transparent dark:bg-white/5 md:dark:bg-transparent">
            <div className="flex items-center gap-3">
              <button
                onClick={async () => await logout()}
                className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 px-4"
                title="Гарах"
              >
                <LogOut size={16} />
                <span className="text-xs font-bold uppercase hidden md:inline">Гарах</span>
              </button>
              <div className="text-left md:text-right">
                <p className="text-xs font-bold uppercase">{user?.fullName}</p>
                <span className="text-red-500 text-[10px] font-semibold uppercase tracking-tighter">Super Admin</span>
              </div>
              <div className="scale-110 md:scale-125"><UserButton /></div>
            </div>
          </div>
        </header>

        {/* NAVIGATION & SEARCH */}
        <div className="space-y-4 mb-8">
          {/* Horizontal Scrollable Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {[
              { id: "overview", icon: LayoutDashboard, label: "Тойм" },
              { id: "applications", icon: FileText, label: "Хүсэлтүүд" },
              { id: "services", icon: ScrollText, label: "Үйлчилгээ" },
              { id: "users", icon: Users, label: "Хэрэглэгч" },
              { id: "bookings", icon: Calendar, label: "Захиалга" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? "bg-[#D97706] text-white shadow-lg shadow-amber-900/20"
                  : `${isDark ? "bg-white/5" : "bg-black/5"} opacity-60 hover:opacity-100`
                  }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {/* Badge for Pending Items */}
                {tab.id === 'applications' && data?.applications && data.applications.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] animate-pulse">
                    {data.applications.length}
                  </span>
                )}
                {tab.id === 'services' && data?.services && data.services.filter(s => s.status === 'pending').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
                    {data.services.filter(s => s.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            <input
              placeholder="Хэрэглэгч, захиалга эсвэл үйлчилгээ хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-12 pr-4 py-4 rounded-2xl w-full outline-none border transition-all text-sm ${isDark ? "bg-[#0C164F] border-white/10" : "bg-white border-amber-100"}`}
            />
          </div>
        </div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">

          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Нийт хэрэглэгч" value={data?.stats.totalUsers || 0} icon={Users} color="bg-blue-500" />
              <StatCard title="Идэвхтэй лам нар" value={data?.stats.totalMonks || 0} icon={UserCog} color="bg-amber-500" />
              <StatCard title="Нийт захиалга" value={data?.stats.totalBookings || 0} icon={Calendar} color="bg-purple-500" />
              <StatCard title="Орлого" value={data?.stats.revenue || 0} icon={TrendingUp} color="bg-green-500" />

              {data?.applications && data.applications.length > 0 && (
                <div className="col-span-full bg-red-500/10 border border-red-500/20 p-5 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                    <div className="p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-900/20"><ShieldAlert size={28} /></div>
                    <div>
                      <h3 className="font-semibold text-lg">Лам болох хүсэлтүүд</h3>
                      <p className="opacity-70 text-sm">{data.applications.length} хэрэглэгч зөвшөөрөл хүлээж байна.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('applications')} className="w-full md:w-auto bg-red-500 text-white px-8 py-4 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-red-600 transition-all">
                    Шалгах
                  </button>
                </div>
              )}

              {/* Bad Monk Schedule Generator */}
              <div className="col-span-full bg-orange-500/10 border border-orange-500/20 p-5 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                  <div className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-900/20"><ShieldAlert size={28} /></div>
                  <div>
                    <h3 className="font-semibold text-lg">Муу Лам - Хуваарь Үүсгэх</h3>
                    <p className="opacity-70 text-sm">Сарын 20-нд муу лам нарын хязгаарлалтын хуваарийг автоматаар үүсгэнэ. 50% өдрүүд хаагдах, үлдсэн өдрүүдэд 80% цагийг хаана.</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setGeneratingBadMonk(true);
                    try {
                      const res = await fetch('/api/admin/bad-monk-schedule', { method: 'POST' });
                      const result = await res.json();
                      if (res.ok && result.success) {
                        alert(`Амжилттай: ${result.message}\n\n${result.results?.map((r: any) => `${r.name}: ${r.totalSlots} цаг хаагдсан`).join('\n') || ''}`);
                        await fetchAdminData();
                      } else {
                        alert(`Алдаа: ${result.message}`);
                      }
                    } catch (error) {
                      alert('Хуваарь үүсгэх явцад алдаа гарлаа');
                    } finally {
                      setGeneratingBadMonk(false);
                    }
                  }}
                  disabled={generatingBadMonk}
                  className="w-full md:w-auto bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {generatingBadMonk ? <><Loader2 size={16} className="animate-spin" /> Үүсгэж байна...</> : <><RefreshCw size={16} /> Хуваарь Үүсгэх</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. APPLICATIONS */}
          {activeTab === "applications" && (
            <motion.div key="applications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.applications?.map((app) => (
                  <div key={app._id} className={`p-6 rounded-[2rem] border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-amber-100"}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={app.image || "/default-avatar.png"} className="w-14 h-14 rounded-2xl object-cover" alt="applicant" />
                      <div>
                        <h4 className="font-semibold text-base">{app.name?.mn || app.name?.en || app.phone}</h4>
                        <p className="text-xs opacity-50">{app.title?.mn || app.title?.en}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-6 text-xs">
                      <span className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">{app.yearsOfExperience} жилийн туршлага</span>
                      <span className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">{app.email || app.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApplication(app._id, 'approve')} className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-semibold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                        {processingId === app._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Зөвшөөрөх
                      </button>
                      <button onClick={() => handleApplication(app._id, 'reject')} className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-semibold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
                        <X size={14} /> Татгалзах
                      </button>
                    </div>
                  </div>
                ))}
                {data?.applications?.length === 0 && <p className="col-span-full text-center opacity-50 py-10">Хүлээгдэж буй хүсэлт алга.</p>}
              </div>
            </motion.div>
          )}

          {/* 3. SERVICES */}
          {activeTab === "services" && (
            <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={async () => {
                    setSyncingServices(true);
                    try {
                      const res = await fetch('/api/admin/sync-services', { method: 'POST' });
                      const result = await res.json();
                      if (res.ok && result.success) {
                        alert(`Амжилттай: ${result.message}`);
                        await fetchAdminData();
                      } else {
                        alert(`Алдаа: ${result.message}`);
                      }
                    } catch (error) {
                      alert('Синхрончлох явцад алдаа гарлаа');
                    } finally {
                      setSyncingServices(false);
                    }
                  }}
                  disabled={syncingServices}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-900/20 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {syncingServices ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Синхрончлох...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} /> Бүх лам нартай синхрончлох
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Шинэ Үйлчилгээ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices?.map((s) => (
                  <div key={s.id} className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between ${isDark ? "bg-white/5 border-white/10" : "bg-white border-amber-100"}`}>
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{s.name?.mn || s.name?.en || s.title?.mn || s.title?.en}</h4>
                        <StatusBadge status={s.status || 'pending'} />
                      </div>
                      <p className="text-xs opacity-50 mb-1 font-bold">Үнэ: {s.price}₮ • {s.duration}</p>
                      <p className="text-[10px] opacity-40">
                        {s.isUniversal ? "Бүх лам нартай" : "Лам: " + (s.monkName?.mn || s.monkName?.en || "Тодорхойгүй")}
                        {s.availableMonks && ` (${s.availableMonks} лам)`}
                      </p>
                    </div>

                    <div className="flex gap-2 border-t pt-4 border-black/5 dark:border-white/5">
                      <button
                        onClick={() => {
                          setEditingService(s);
                          setIsServiceModalOpen(true);
                        }}
                        className="flex-1 py-3 bg-blue-500/10 text-blue-600 rounded-xl font-bold text-[10px] uppercase hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={14} /> Засах
                      </button>
                      {(!s.status || s.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handleServiceAction(s.id, 'approve')}
                            disabled={processingId === s.id}
                            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            {processingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Зөвшөөрөх
                          </button>
                          <button
                            onClick={() => handleServiceAction(s.id, 'reject')}
                            disabled={processingId === s.id}
                            className="flex-1 py-3 bg-amber-500/10 text-amber-600 rounded-xl font-bold text-[10px] uppercase hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={14} /> Татгалзах
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        disabled={processingId === s.id}
                        className="py-3 px-4 bg-red-500/10 text-red-500 rounded-xl font-bold text-[10px] uppercase hover:bg-red-500/20 transition-colors flex items-center justify-center"
                        title="Устгах"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {s.status === 'active' && <p className="text-[10px] text-green-600 text-center font-bold mt-2 opacity-60">Сайт дээр идэвхтэй</p>}
                  </div>
                ))}
                {filteredServices?.length === 0 && <p className="col-span-full text-center opacity-50 py-10">Үйлчилгээ олдсонгүй.</p>}
              </div>
            </motion.div>
          )}

          {/* 4. USERS */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredUsers?.map((u) => (
                <div key={u._id} className={`p-6 rounded-[2rem] border flex items-center justify-between group ${isDark ? "bg-white/5 border-white/10" : "bg-white border-amber-100"}`}>
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isDark ? "bg-white/10" : "bg-amber-100 text-amber-800"}`}>
                      {u.image ? <img src={u.image} alt={u.name?.mn || u.phone} className="w-full h-full rounded-full object-cover" /> : (u.name?.mn?.[0] || u.name?.en?.[0] || u.phone?.[0] || "U")}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">{u.name?.mn || u.name?.en || u.phone || "Нэргүй"}</h4>
                        {(u.role === 'monk' || u.monkStatus === 'active') && <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Лам</span>}
                        {u.role === 'admin' && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Админ</span>}
                        {u.showOnHomepage && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1"><LayoutDashboard size={8} /> Нүүр</span>}
                      </div>
                      <p className="text-xs opacity-50 truncate">{u.email || u.phone}</p>
                      <p className="text-[10px] opacity-30 mt-1">Бүртгүүлсэн: {formatDate(u.createdAt, "mn")}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {u.role === 'monk' ? (
                      <button
                        onClick={() => setEditingMonk(u)}
                        className="p-2 hover:bg-amber-500/10 hover:text-amber-500 rounded-lg transition-colors"
                        title="Мэдээллийг засах"
                      >
                        <Edit size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-2 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors"
                        title="Хэрэглэгчийг засах"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      disabled={processingId === u._id || u.role === 'admin'}
                      className={`p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors ${u.role === 'admin' ? 'hidden' : ''}`}
                      title="Хэрэглэгчийг устгах"
                    >
                      {processingId === u._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers?.length === 0 && <p className="col-span-full text-center opacity-50 py-10">Хэрэглэгч олдсонгүй.</p>}
            </motion.div>
          )}

          {/* 5. BOOKINGS */}
          {activeTab === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto rounded-[2rem] border border-black/5 dark:border-white/5">
                <table className={`w-full text-left text-sm ${isDark ? "bg-white/5" : "bg-white"}`}>
                  <thead className={`uppercase text-[10px] font-semibold tracking-wider ${isDark ? "bg-black/20 text-white/50" : "bg-amber-50 text-amber-900/50"}`}>
                    <tr>
                      <th className="p-6">Үйлчилгээ / Лам</th>
                      <th className="p-6">Захиалагч</th>
                      <th className="p-6">Огноо & Цаг</th>
                      <th className="p-6">Төлөв</th>
                      <th className="p-6 text-right">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredBookings?.map((b) => (
                      <tr key={b._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-6">
                          <div className="font-bold">
                            {typeof b.serviceName === 'object'
                              ? (b.serviceName?.mn || b.serviceName?.en || "Тодорхойгүй")
                              : b.serviceName}
                          </div>
                          <div className="text-[10px] mt-1 text-amber-600 font-bold uppercase tracking-wider">
                            {data?.users?.find((u: any) => u._id === b.monkId)?.name?.mn || "Стандарт үйлчилгээ"}
                          </div>
                          <div className="text-xs opacity-50">{b.price}₮</div>
                        </td>
                        <td className="p-6">
                          <div
                            onClick={() => setSelectedBooking(b)}
                            className="font-medium flex items-center gap-2 cursor-pointer hover:text-amber-600 transition-colors"
                          >
                            {b.clientName}
                            <div className="p-1 rounded-full bg-stone-100 hover:bg-stone-200">
                              <Eye size={12} />
                            </div>
                            {b.userPhone && <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded opacity-70 font-mono">{b.userPhone}</span>}
                          </div>
                          <div className="text-xs opacity-50">{b.clientEmail}</div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="opacity-50" />
                            <span>{formatDate(b.date, "mn")}</span>
                          </div>
                          <div className="text-xs opacity-50 pl-6">{b.time}</div>
                        </td>
                        <td className="p-6">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleBookingAction(b._id, 'confirmed')}
                                  className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                  title="Баталгаажуулах"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleBookingAction(b._id, 'rejected')}
                                  className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                  title="Цуцлах"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs opacity-30 font-bold uppercase">Шийдвэрлэгдсэн</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBookings?.length === 0 && <div className="p-10 text-center opacity-50">Захиалга олдсонгүй.</div>}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* MODALS */}
        <MonkEditModal
          isOpen={!!editingMonk}
          monk={editingMonk}
          onClose={() => setEditingMonk(null)}
          onSave={handleSaveMonk}
        />
        <UserEditModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />

        {/* Helper to find user for selected booking */
          (() => {
            if (!selectedBooking) return null;
            // Try to find user by matching _id or clerkId to booking.userId
            // The booking.userId might be an ObjectID string or Clerk ID
            const foundUser = data?.users.find(u =>
              u._id === selectedBooking.userId ||
              (u as any).clerkId === selectedBooking.userId ||
              u.phone === selectedBooking.userPhone
            );
            const foundMonk = data?.users.find(u => u._id === selectedBooking.monkId);
            return (
              <BookingDetailModal
                isOpen={!!selectedBooking}
                booking={selectedBooking}
                user={foundUser}
                monk={foundMonk}
                onClose={() => setSelectedBooking(null)}
                onAction={handleBookingAction}
              />
            );
          })()
        }

        <ServiceCreateModal
          isOpen={isServiceModalOpen}
          onClose={() => {
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
          onSave={handleSaveService}
          initialData={editingService}
        />
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-amber-100 dark:border-white/10 p-6 rounded-[2rem] flex items-center gap-5 relative overflow-hidden group">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5 z-10 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className="z-10">
        <p className="opacity-50 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-semibold font-serif">{value.toLocaleString()}</h3>
      </div>
      {/* Background Decor */}
      <div className={`absolute -right-6 -bottom-6 opacity-10 ${color.replace('bg-', 'text-')} transform rotate-12`}>
        <Icon size={120} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const styles = {
    active: "bg-green-500 text-white",
    confirmed: "bg-green-500 text-white",
    pending: "bg-amber-500 text-white",
    rejected: "bg-red-500 text-white",
    cancelled: "bg-gray-500 text-white",
  };

  // Translation map
  const labels: Record<string, string> = {
    active: "Идэвхтэй",
    confirmed: "Баталгаажсан",
    pending: "Хүлээгдэж буй",
    rejected: "Татгалзсан",
    cancelled: "Цуцлагдсан"
  };

  // Default to gray if status unknown
  const activeStyle = styles[(status || "") as keyof typeof styles] || "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  const label = (status && labels[status]) || status || "Unknown"; // Use Mongolian label or fallback to English key

  return (
    <span className={`${activeStyle} px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider`}>
      {label}
    </span>
  );
}