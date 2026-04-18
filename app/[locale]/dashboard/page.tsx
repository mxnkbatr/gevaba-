"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Sun, Clock, ScrollText, Plus, Trash2, X, History, Video,
    Loader2, Save, Ban, CheckCircle, Edit, ImageIcon, Upload, MessageCircle, ShieldCheck, UserCircle,
    LogOut,
    Calendar,
    TrendingUp,
    Phone
} from "lucide-react";
import LiveRitualRoom from "../../components/LiveRitualRoom";
import ChatWindow from "../../components/ChatWindow";
import BookingDetailModal from "../admin/BookingDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import Link from "next/link";
import dynamic from "next/dynamic";

const DashboardStats = dynamic(() => import('./DashboardStats'), { loading: () => <div className="h-40 animate-pulse bg-stone/20 rounded-3xl" /> });
const DashboardSchedule = dynamic(() => import('./DashboardSchedule'), { loading: () => <div className="h-64 animate-pulse bg-stone/20 rounded-3xl" /> });
const DashboardBookings = dynamic(() => import('./DashboardBookings'), { loading: () => <div className="h-64 animate-pulse bg-stone/20 rounded-3xl" /> });

// --- TYPES ---
interface ServiceItem {
    id: string;
    name: { mn: string; en: string };
    price: number;
    duration: string;
    status?: 'pending' | 'approved' | 'rejected' | 'active';
}

interface BlockedSlot {
    id: string;
    date: string;
    time: string;
}

interface UserProfile {
    _id: string;
    role: "client" | "monk";
    monkStatus?: "pending" | "approved" | "rejected";
    name?: { mn: string; en: string };
    title?: { mn: string; en: string };
    services?: ServiceItem[];
    schedule?: { day: string; start: string; end: string; active: boolean; slots?: string[] }[];
    blockedSlots?: BlockedSlot[];
    earnings?: number;
    image?: string;
    avatar?: string;
    bio?: { mn: string; en: string };
    specialties?: string[];
    education?: { mn: string; en: string };
    philosophy?: { mn: string; en: string };
    yearsOfExperience?: number;
    video?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    zodiacYear?: string;
    isSpecial?: boolean;
}

interface Booking {
    _id: string;
    monkId: string;
    clientId?: string;
    clientName: string;
    serviceName: any;
    date: string;
    time: string;
    status: string;
    callStatus?: string;
}

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_MN = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const ALL_24_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const { language } = useLanguage();
    const { signOut } = useClerk();
    const router = useRouter();
    const langKey = language === 'mn' ? 'mn' : 'en';

    // --- TRANSLATION DICTIONARY ---
    const TEXT = {
        en: {
            clientRole: "Seeker",
            earnings: "Total Earnings",
            bookBtn: "Book New Ritual",
            availability: "Availability Manager",
            updateBtn: "Update System",
            step1: "Step 1: Weekly Availability",
            step1Desc: "Toggle hours you are USUALLY available each week (00:00 - 24:00)",
            step2: "Step 2: Manage Exceptions",
            step2Desc: "Pick a date to mark specific hours as",
            busy: "Busy",
            unblockDay: "Unblock Day",
            blockDay: "Block Day",
            noHours: "No working hours set for this day.",
            checkAbove: "Check your Weekly Schedule above.",
            ritualsClient: "Client Rituals",
            ritualsMy: "My Rituals",
            join: "Join",
            noRituals: "No scheduled rituals.",
            services: "Services",
            active: "Active",
            pending: "Pending",
            deleteSvc: "Delete Service",
            wisdomTitle: "Daily Wisdom",
            wisdomQuote: "Wisdom comes from within. Do not seek it without.",
            modalBookTitle: "Book a Ritual",
            selectGuide: "Select Guide",
            selectDate: "Select Date",
            unavailable: "Unavailable on this day.",
            selectService: "Select Service",
            confirmBook: "Confirm Booking",
            modalSvcTitle: "New Service",
            cancel: "Cancel",
            submitReview: "Submit for Review",
            alertSaved: "Availability updated successfully!",
            alertSent: "Request sent!",
            alertDelete: "Delete this service?",
            editProfile: "Edit Profile",
            saveProfile: "Save Profile",
            modalProfileTitle: "Edit Profile",
            labelNameMN: "Name (MN)",
            labelNameEN: "Name (EN)",
            labelTitleMN: "Title (MN)",
            labelTitleEN: "Title (EN)",
            labelBioMN: "Bio (MN)",
            labelBioEN: "Bio (EN)",
            labelExp: "Years of Experience",
            labelSpecialties: "Specialties (comma separated)",
            labelImage: "Profile Image",
            labelPhone: "Phone Number",
            uploading: "Uploading...",
            enterRoom: "Enter Ritual Room",
            startsIn: "Starts in",
            roomOpen: "Room Open",
            roomClosed: "Room Closed",
            startVideo: "Start Video Call",
            signOut: "Sign Out",
            signingOut: "Signing Out...",
            chat: "Chat",
            acceptedBookings: "Accepted Bookings"
        },
        mn: {
            clientRole: "Эрхэм сүсэгтэн",
            earnings: "Нийт орлого",
            bookBtn: "Засал захиалах",
            availability: "Цагийн хуваарь",
            updateBtn: "Хадгалах",
            step1: "Алхам 1: 7 хоногийн тогтмол цаг",
            step1Desc: "Долоо хоног бүр тогтмол ажиллах цагаа сонгоно уу (00:00 - 24:00)",
            step2: "Алхам 2: Тусгай өдөр тохируулах",
            step2Desc: "Тодорхой өдрийн цагийг хаах бол өдрөө сонгоно уу",
            busy: "Завгүй",
            unblockDay: "Өдрийг нээх",
            blockDay: "Өдрийг хаах",
            noHours: "Энэ өдөр цагийн хуваарь байхгүй байна.",
            checkAbove: "Дээрх 7 хоногийн хуваарийг шалгана уу.",
            ritualsClient: "Сүсэгтний засал",
            ritualsMy: "Миний засал",
            join: "Нэгдэх",
            noRituals: "Захиалга алга байна.",
            services: "Үйлчилгээ",
            active: "Идэвхтэй",
            pending: "Хүлээгдэж буй",
            deleteSvc: "Устгах",
            wisdomTitle: "Өдрийн сургаал",
            wisdomQuote: "Гэгээрэл дотроос ирдэг. Гаднаас бүү хай.",
            modalBookTitle: "Засал захиалах",
            selectGuide: "Лам сонгох",
            selectDate: "Өдөр сонгох",
            unavailable: "Энэ өдөр боломжгүй.",
            selectService: "Үйлчилгээ сонгох",
            confirmBook: "Баталгаажуулах",
            modalSvcTitle: "Шинэ үйлчилгээ",
            cancel: "Болих",
            submitReview: "Илгээх",
            alertSaved: "Амжилттай хадгалагдлаа!",
            alertSent: "Хүсэлт илгээгдлээ!",
            alertDelete: "Та энэ үйлчилгээг устгахдаа итгэлтэй байна уу?",
            editProfile: "Профайл засах",
            saveProfile: "Хадгалах",
            modalProfileTitle: "Профайл засах",
            labelNameMN: "Нэр (Монгол)",
            labelNameEN: "Нэр (Англи)",
            labelTitleMN: "Цол (Монгол)",
            labelTitleEN: "Цол (Англи)",
            labelBioMN: "Намтар (Монгол)",
            labelBioEN: "Намтар (Англи)",
            labelExp: "Ажилласан жил",
            labelSpecialties: "Мэргэшсэн чиглэл (таслалаар тусгаарлах)",
            labelImage: "Профайл зураг",
            labelPhone: "Утасны дугаар",
            uploading: "Хуулж байна...",
            enterRoom: "Өрөөнд орох",
            startsIn: "Эхлэхэд",
            roomOpen: "Өрөө нээлттэй",
            roomClosed: "Хаагдсан",
            startVideo: "Видео дуудлага эхлүүлэх",
            signOut: "Гарах",
            signingOut: "Гарч байна...",
            chat: "Чат"
        }
    }[langKey];

    // --- DATA STATE ---
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeBookingTab, setActiveBookingTab] = useState<'upcoming' | 'history'>('upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [allMonks, setAllMonks] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);

    // --- VIDEO CALL STATE ---
    const [activeRoomToken, setActiveRoomToken] = useState<string | null>(null);
    const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
    const [chatProfileUser, setChatProfileUser] = useState<any>(null);
    const [chatClientInfo, setChatClientInfo] = useState<any>(null);
    const [activeBookingForRoom, setActiveBookingForRoom] = useState<Booking | null>(null);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
    const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);

    // --- MODALS ---
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

    // --- FORMS ---
    const [serviceForm, setServiceForm] = useState({ nameEn: "", nameMn: "", price: 0, duration: "30 min" });
    const [bookingForm, setBookingForm] = useState({ monkId: "", serviceId: "", date: "", time: "" });
    const [editForm, setEditForm] = useState<any>({});
    const [uploadingImage, setUploadingImage] = useState(false);

    // --- SCHEDULE STATE ---
    const [schedule, setSchedule] = useState<{ day: string; start: string; end: string; active: boolean; slots?: string[] }[]>(
        DAYS_EN.map(d => ({ day: d, start: "09:00", end: "17:00", active: true, slots: ALL_24_SLOTS }))
    );
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [selectedBlockDate, setSelectedBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    // --- ROLE CHECK ---
    const isMonk = profile?.role === 'monk';

    // --- REDIRECT LOGIC ---
    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/${language}/sign-in`);
            return;
        }
        // Redirect non-monk users to profile
        if (user && profile?.role === 'client') {
            router.push(`/${language}/profile`);
        }
    }, [authLoading, user, profile, router, language]);

    // --- VIDEO CALL HANDLER (FIXED) ---
    const joinVideoCall = React.useCallback(async (booking: Booking) => {
        setJoiningRoomId(booking._id);
        try {
            // 1. Optimistic Update (If Monk, mark as active immediately)
            if (profile?.role === 'monk') {
                // Update local state so UI reflects 'active' instantly
                setBookings(prev => prev.map(b =>
                    b._id === booking._id ? { ...b, callStatus: 'active' } : b
                ));

                // Send update to server in background
                await fetch(`/api/bookings/${booking._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callStatus: 'active' })
                });
            }

            // 2. Prepare Username & Fetch Token
            const username = user?.fullName || user?.firstName || user?.phone || "Anonymous";
            const encodedName = encodeURIComponent(username);

            const res = await fetch(`/api/livekit?room=${booking._id}&username=${encodedName}`);

            if (!res.ok) throw new Error("Failed to get room token");

            const data = await res.json();

            // 3. Enter Room
            setActiveRoomToken(data.token);
            setActiveRoomName(booking._id);
            setActiveBookingForRoom(booking);
        } catch (e) {
            console.error("Join Video Error:", e);
            alert("Could not join the video room. Please check your connection.");
        } finally {
            setJoiningRoomId(null);
        }
    }, [profile, user]);

    // --- FORCE START LOGIC ---
    useEffect(() => {
        // Automatically join room if an active call is detected and we aren't in one (CLIENTS ONLY)
        if (!isMonk && !activeRoomToken && bookings.length > 0) {
            const activeBooking = bookings.find(b => b.callStatus === 'active' && b.status === 'confirmed');
            if (activeBooking) {
                joinVideoCall(activeBooking);
            }
        }
    }, [bookings, activeRoomToken, joinVideoCall]);

    // --- FORCE END LOGIC ---
    useEffect(() => {
        if (activeRoomToken && activeRoomName) {
            const currentBooking = bookings.find(b => b._id === activeRoomName);
            if (currentBooking && currentBooking.callStatus === 'ended') {
                setActiveRoomToken(null);
                setActiveRoomName(null);
                alert("The ritual has ended.");
                window.location.reload();
            }
        }
    }, [bookings, activeRoomToken, activeRoomName]);

    // --- SIGN OUT HANDLER ---
    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await logout();
        } catch (error) {
            console.error("Sign out failed", error);
            window.location.href = "/sign-in";
        }
    };

    // --- FETCH DATA ---
    useEffect(() => {
        if (user && user.authType === 'clerk') {
            fetch('/api/sync-user', { method: 'POST' }).catch(err => console.error("User sync failed", err));
        }
    }, [user]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                setLoading(true);
                const userId = user.id;
                let profileData = null;

                if (user.role === 'monk') {
                    const monksRes = await fetch(`/api/monks/${userId}`);
                    if (monksRes.ok) {
                        profileData = await monksRes.json();
                    }
                } else {
                    const userRes = await fetch(`/api/users/${userId}`, { cache: 'no-store' });
                    if (userRes.ok) {
                        profileData = await userRes.json();
                    }
                }

                if (!profileData && user.authType === 'custom') {
                    profileData = user;
                }

                if (profileData) {
                    setProfile(profileData);
                    let currentBookings: Booking[] = [];
                    if (profileData.role === 'monk') {
                        if (profileData.schedule) setSchedule(profileData.schedule);
                        if (profileData.blockedSlots) setBlockedSlots(profileData.blockedSlots);
                        const bRes = await fetch(`/api/bookings?monkId=${profileData._id}`);
                        if (bRes.ok) currentBookings = await bRes.json();
                    } else {
                        if (!profileData.firstName || !profileData.lastName || !profileData.dateOfBirth) {
                            router.push("/complete-profile");
                            return;
                        }

                        const [bRes, allMonksRes] = await Promise.all([
                            fetch(`/api/bookings?userId=${profileData._id}`),
                            fetch('/api/monks')
                        ]);
                        if (bRes.ok) currentBookings = await bRes.json();
                        if (allMonksRes.ok) setAllMonks(await allMonksRes.json());
                    }
                    setBookings(currentBookings);
                } else {
                    const tempClientProfile: UserProfile = {
                        _id: userId,
                        role: "client",
                        name: { mn: user.firstName || "Хэрэглэгч", en: user.firstName || "User" },
                        phone: user.phone || "",
                        firstName: user.firstName,
                        lastName: user.lastName,
                    };
                    setProfile(tempClientProfile);
                    const allMonksRes = await fetch('/api/monks');
                    if (allMonksRes.ok) setAllMonks(await allMonksRes.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
            // Removed sequential await and 8s polling logic here, 
            // since we'll rely on Ably WebSockets or less aggressive updates.
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user]);

    // --- SEPARATE BOOKINGS ---
    const { upcomingBookings, historyBookings, acceptedCount, totalEarnings } = useMemo(() => {
        const now = new Date();
        const upcoming: Booking[] = [];
        const history: Booking[] = [];
        let accCount = 0;

        bookings.forEach(b => {
            let timeStr = b.time || "00:00";
            if (timeStr.includes(':')) {
                const [h, m] = timeStr.split(':').map(part => part.trim().padStart(2, '0'));
                timeStr = `${h}:${m}`;
            }
            const dateOnly = b.date.includes('T') ? b.date.split('T')[0] : b.date;
            const bookingDate = new Date(`${dateOnly}T${timeStr}`);
            
            // Logic: Keep in upcoming if status is confirmed or pending, UNLESS it's very old and system hasn't cleaned it.
            // But primarily, if status is 'completed', 'cancelled', or 'rejected', it's history.
            const isFinalized = ['completed', 'cancelled', 'rejected'].includes(b.status);
            
            // If it's confirmed, it stays in upcoming until it's completed.
            // If it's pending, it stays in upcoming.
            const shouldBeInUpcoming = !isFinalized && (b.status === 'confirmed' || b.status === 'pending');

            // Calculate stats
            if (['confirmed', 'completed'].includes(b.status)) {
                accCount++;
            }

            if (shouldBeInUpcoming) {
                upcoming.push(b);
            } else {
                history.push(b);
            }
        });

        upcoming.sort((a, b) => {
            const dateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const dateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;
            return new Date(`${dateA}T${a.time}`).getTime() - new Date(`${dateB}T${b.time}`).getTime();
        });
        history.sort((a, b) => {
            const dateA = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const dateB = b.date.includes('T') ? b.date.split('T')[0] : b.date;
            return new Date(`${dateA}T${a.time}`).getTime() - new Date(`${dateB}T${b.time}`).getTime();
        });

        const isSpecial = profile?.isSpecial === true;
        const rate = isSpecial ? 88800 : 40000;
        const earnings = accCount * rate;

        return { upcomingBookings: upcoming, historyBookings: history, acceptedCount: accCount, totalEarnings: earnings };
    }, [bookings, profile]);

    const dailySlotsForBlocking = useMemo(() => {
        return ALL_24_SLOTS;
    }, []);

    const checkRitualAvailability = (booking: Booking) => {
        if (booking.callStatus === 'active') return { isOpen: true, message: TEXT.roomOpen };
        
        let timeStr = booking.time || "00:00";
        if (timeStr.includes(':')) {
            const [h, m] = timeStr.split(':').map(part => part.trim().padStart(2, '0'));
            timeStr = `${h}:${m}`;
        }
        const bookingDateTime = new Date(`${booking.date}T${timeStr}`);
        const now = new Date();
        
        // Show "Enter" button up to 48 hours before start
        const openTime = new Date(bookingDateTime.getTime() - 48 * 60 * 60 * 1000);
        
        // If it's still 'confirmed' and we are past the open time, allow entry.
        // This ensures that even if a monk is late, they can still enter.
        // The backend/cleanup logic will eventually move it to 'completed'.
        if (now >= openTime) return { isOpen: true, message: TEXT.roomOpen };

        const diffMs = openTime.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return { isOpen: false, message: `${TEXT.startsIn} ${diffHrs}h ${diffMins}m` };
    };

    const saveScheduleSettings = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/monks/${profile._id}/schedule`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule, blockedSlots })
            });
            if (res.ok) alert(TEXT.alertSaved);
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const toggleBlockSlot = (time: string) => {
        const exists = blockedSlots.find(b => b.date === selectedBlockDate && b.time === time);
        if (exists) setBlockedSlots(blockedSlots.filter(b => b.id !== exists.id));
        else setBlockedSlots([...blockedSlots, { id: crypto.randomUUID(), date: selectedBlockDate, time }]);
    };

    const toggleBlockWholeDay = () => {
        const allBlocked = dailySlotsForBlocking.every(time => blockedSlots.some(b => b.date === selectedBlockDate && b.time === time));
        if (allBlocked) setBlockedSlots(blockedSlots.filter(b => b.date !== selectedBlockDate));
        else {
            const newBlocks = dailySlotsForBlocking
                .filter(time => !blockedSlots.some(b => b.date === selectedBlockDate && b.time === time))
                .map(time => ({ id: crypto.randomUUID(), date: selectedBlockDate, time }));
            setBlockedSlots([...blockedSlots, ...newBlocks]);
        }
    };

    const toggleWeeklySlot = (day: string, time: string) => {
        const newSchedule = [...schedule];
        const dayIdx = newSchedule.findIndex(s => s.day === day);
        if (dayIdx > -1) {
            const dayConfig = newSchedule[dayIdx];
            const slots = dayConfig.slots || [];
            if (slots.includes(time)) {
                dayConfig.slots = slots.filter(t => t !== time);
            } else {
                dayConfig.slots = [...slots, time];
            }
            setSchedule(newSchedule);
        }
    };

    const submitBooking = async () => {
        if (!bookingForm.monkId || !bookingForm.date || !bookingForm.time) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...bookingForm, userName: profile?.name?.[langKey] || user?.fullName || user?.firstName || user?.phone || "User", userEmail: user?.email, userId: profile?._id, serviceId: bookingForm.serviceId })
            });
            if (res.ok) { alert(TEXT.alertSent); setIsBookingModalOpen(false); window.location.reload(); }
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const submitService = async () => {
        if (!profile) return;
        setIsSaving(true);
        const newService: ServiceItem = { id: crypto.randomUUID(), name: { en: serviceForm.nameEn, mn: serviceForm.nameMn }, price: Number(serviceForm.price), duration: serviceForm.duration, status: 'pending' };
        const updatedServices = [...(profile.services || []), newService];
        try {
            const res = await fetch(`/api/monks/${profile._id}/service`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ services: updatedServices }) });
            if (res.ok) { setProfile({ ...profile, services: updatedServices }); setIsServiceModalOpen(false); }
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const deleteService = async (serviceId: string) => {
        if (!profile || !confirm(TEXT.alertDelete)) return;
        const updatedServices = (profile.services || []).filter(s => s.id !== serviceId);
        try {
            const res = await fetch(`/api/monks/${profile._id}/service`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ services: updatedServices }) });
            if (res.ok) setProfile({ ...profile, services: updatedServices });
        } catch (e) { console.error(e); }
    };

    // --- VIDEO CALL HANDLER (FIXED) ---


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: data });
            const fileData = await res.json();
            setEditForm((prev: any) => ({ ...prev, image: fileData.secure_url, avatar: fileData.secure_url }));
        } catch (error) { console.error(error); } finally { setUploadingImage(false); }
    };

    const saveProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const endpoint = profile.role === 'monk' ? `/api/monks/${profile._id}` : `/api/users/${user?.id}`;
            const res = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
            if (res.ok) { alert(TEXT.alertSaved); setProfile({ ...profile, ...editForm }); setIsEditProfileModalOpen(false); }
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    if (authLoading || !user) {
        return null;
    }

    if (activeRoomToken && activeRoomName) {
        return <LiveRitualRoom
            token={activeRoomToken}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
            roomName={activeRoomName}
            bookingId={activeRoomName}
            isMonk={isMonk}
            onLeave={async () => {
                if (isMonk && activeRoomName) {
                    await fetch(`/api/bookings/${activeRoomName}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callStatus: 'ended' }) });
                }
                setActiveRoomToken(null);
                setActiveRoomName(null);
                // Reload to refresh status
                window.location.reload();
            }}
        />;
    }

    if (isMonk && profile?.monkStatus === 'pending') {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center p-6 font-serif text-ink">
                <div className="max-w-md w-full monastery-card bg-white/80 backdrop-blur-sm p-10 rounded-[2.5rem] shadow-gold text-center">
                    <Loader2 className="animate-spin mx-auto mb-6 text-gold-dark" size={40} />
                    <h1 className="text-3xl font-bold mb-4 text-gold-dark">Application Pending</h1>
                    <p className="text-earth/70 mb-8">Your application is under review. You will receive an email once approved.</p>
                    <Link href={`/${language}`} className="cta-button inline-flex min-h-12 px-8 shadow-gold">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <main className="min-h-[100svh] bg-cream relative overflow-hidden" style={{
                paddingTop: "calc(var(--header-height-mobile) + env(safe-area-inset-top))",
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 100px)",
                paddingLeft: "env(safe-area-inset-left, 0px)",
                paddingRight: "env(safe-area-inset-right, 0px)"
            }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(201,160,58,0.06)_0%,_transparent_50%)] pointer-events-none" />

                {/* HERO SECTION */}
                <section className="container mx-auto mb-10 relative z-10">
                    <div className="bg-hero-bg rounded-[2.5rem] p-8 md:p-12 text-white shadow-modal flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')]" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left w-full lg:w-auto">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gold/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative">
                                    {user?.authType === 'clerk' ? (
                                        <div className="scale-[1.8] origin-center"><UserButton /></div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gold/10 text-gold flex items-center justify-center font-black overflow-hidden border-2 border-gold/20 shadow-lg">
                                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <span className="text-2xl">{user?.firstName?.[0]}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-h1 md:text-4xl font-serif font-black text-white mb-2">
                                    {profile?.name?.[langKey] || user?.fullName || user?.firstName || user?.phone || "Seeker"}
                                </h1>
                                <p className="text-label text-gold/80 tracking-[0.3em]">{isMonk ? profile?.title?.[langKey] : TEXT.clientRole}</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-wrap gap-4 items-center justify-center lg:justify-end">
                            {user?.role === 'admin' && (
                                <Link href={`/${language}/admin`} className="px-6 py-3.5 rounded-full bg-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all flex items-center gap-2">
                                    <ShieldCheck size={16} /> Admin Panel
                                </Link>
                            )}

                            <button onClick={() => { setEditForm(profile || {}); setIsEditProfileModalOpen(true); }} className="px-6 py-3.5 rounded-full bg-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/20 border border-white/10 backdrop-blur-md transition-all flex items-center gap-2">
                                <Edit size={16} /> {TEXT.editProfile}
                            </button>

                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className="px-6 py-3.5 rounded-full bg-red-500/10 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white border border-red-500/20 backdrop-blur-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSigningOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                                {isSigningOut ? TEXT.signingOut : TEXT.signOut}
                            </button>

                            {isMonk && (
                                <Link href={`/${language}/monk/content`} className="px-6 py-3.5 rounded-full bg-gold/10 text-gold font-black text-[10px] uppercase tracking-widest hover:bg-gold hover:text-white border border-gold/20 backdrop-blur-md transition-all flex items-center gap-2">
                                    <ScrollText size={16} /> Content
                                </Link>
                            )}

                            {!isMonk && (
                                <Link href={`/${language}/monks`} className="cta-button h-14 px-8 shadow-gold">
                                    <Plus size={18} className="mr-2" /> {TEXT.bookBtn}
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                <section className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    <div className="lg:col-span-2 space-y-8">
                        {isMonk && (
                            <DashboardStats 
                                isSpecial={profile?.isSpecial || false}
                                totalEarnings={totalEarnings}
                                acceptedCount={acceptedCount}
                                language={language}
                                TEXT={TEXT}
                            />
                        )}

                        {isMonk && (
                            <DashboardSchedule 
                                schedule={schedule}
                                setSchedule={setSchedule}
                                blockedSlots={blockedSlots}
                                setBlockedSlots={setBlockedSlots}
                                selectedBlockDate={selectedBlockDate}
                                setSelectedBlockDate={setSelectedBlockDate}
                                isSaving={isSaving}
                                saveScheduleSettings={saveScheduleSettings}
                                TEXT={TEXT}
                                DAYS_EN={DAYS_EN}
                                DAYS_MN={DAYS_MN}
                                ALL_24_SLOTS={ALL_24_SLOTS}
                                dailySlotsForBlocking={dailySlotsForBlocking}
                                toggleWeeklySlot={toggleWeeklySlot}
                                toggleBlockWholeDay={toggleBlockWholeDay}
                                toggleBlockSlot={toggleBlockSlot}
                            />
                        )}

                        <DashboardBookings 
                            activeBookingTab={activeBookingTab}
                            setActiveBookingTab={setActiveBookingTab}
                            upcomingBookings={upcomingBookings}
                            historyBookings={historyBookings}
                            isMonk={isMonk}
                            router={router}
                            language={language}
                            langKey={langKey}
                            TEXT={TEXT}
                            checkRitualAvailability={checkRitualAvailability}
                            joiningRoomId={joiningRoomId}
                            allMonks={allMonks}
                            setActiveChatBooking={setActiveChatBooking}
                            setChatClientInfo={setChatClientInfo}
                            setActiveBookingForRoom={setActiveBookingForRoom}
                            joinVideoCall={joinVideoCall}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="monastery-card p-10 bg-hero-bg text-white border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 opacity-10 bg-[url('/noise.svg')]" />
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl group-hover:bg-gold/20 transition-colors" />
                            
                            <Sun className="w-12 h-12 text-gold mb-6 animate-pulse" />
                            <h3 className="text-h2 text-white/90 mb-4 tracking-wide">{TEXT.wisdomTitle}</h3>
                            <p className="text-body italic text-white/60 leading-relaxed font-serif">"{TEXT.wisdomQuote}"</p>
                            
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                <span className="text-label text-gold/60">Gevabal Daily</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CHAT MODAL */}
                <AnimatePresence>
                    {activeChatBooking && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-md p-4">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                                className="bg-white rounded-[2.5rem] w-full max-w-xl h-[80vh] shadow-modal overflow-hidden flex flex-col border border-border"
                            >
                                <div className="p-6 border-b border-border flex justify-between items-center bg-stone/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gold/10 text-gold">
                                            <MessageCircle size={20} />
                                        </div>
                                        <h3 className="text-h2 text-ink">{TEXT.chat}</h3>
                                    </div>
                                    <button onClick={() => { setActiveChatBooking(null); setChatClientInfo(null); }} className="p-2 hover:bg-stone/50 rounded-full transition-colors text-earth"><X size={24} /></button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ChatWindow
                                        bookingId={activeChatBooking._id}
                                        currentUserId={user?.id || ""}
                                        currentUserName={profile?.name?.[langKey] || user?.fullName || user?.firstName || user?.phone || "User"}
                                        clientInfo={chatClientInfo}
                                        isMonk={isMonk}
                                        onProfileClick={async (senderId) => {
                                            if (!isMonk && user?.role !== 'admin') return;
                                            try {
                                                const res = await fetch(`/api/users/${senderId}`);
                                                if (res.ok) {
                                                    const userData = await res.json();
                                                    setChatProfileUser(userData);
                                                }
                                            } catch (e) {
                                                console.error("Failed to fetch user", e);
                                            }
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODALS */}
                <AnimatePresence>
                    {isEditProfileModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-md p-4">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                className="bg-white rounded-[3rem] p-10 w-full max-w-2xl h-[85vh] overflow-y-auto border border-border shadow-modal"
                            >
                                <div className="flex justify-between items-center mb-10 border-b border-border pb-6">
                                    <h3 className="text-display text-ink">{TEXT.modalProfileTitle}</h3>
                                    <button onClick={() => setIsEditProfileModalOpen(false)} className="p-2 hover:bg-stone/50 rounded-full transition-colors text-earth"><X size={28} /></button>
                                </div>
                                <div className="space-y-10">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-modal">
                                                <img src={editForm.image || editForm.avatar || user?.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <label className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <input type="file" className="hidden" onChange={handleImageUpload} />
                                                    <Upload className="text-white" size={32} />
                                                </label>
                                            </div>
                                        </div>
                                        {uploadingImage && <div className="flex items-center gap-2 text-label text-gold"><Loader2 className="animate-spin" size={14} /> {TEXT.uploading}</div>}
                                    </div>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-label text-earth/60 ml-4">{TEXT.labelPhone}</label>
                                            <div className="relative">
                                                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gold" />
                                                <input 
                                                    className="w-full pl-14 pr-6 py-4 rounded-2xl border border-border bg-stone/10 outline-none focus:border-gold transition-design font-black text-ink text-sm" 
                                                    placeholder="Phone" 
                                                    value={editForm.phone || ""} 
                                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={saveProfile} 
                                        disabled={isSaving}
                                        className="cta-button w-full h-16 shadow-gold group"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin mx-auto" /> : (
                                            <div className="flex items-center justify-center gap-3">
                                                <Save size={20} />
                                                <span className="text-sm uppercase tracking-[0.2em]">{TEXT.saveProfile}</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <BookingDetailModal
                        isOpen={!!chatProfileUser}
                        booking={activeChatBooking}
                        user={chatProfileUser}
                        onClose={() => setChatProfileUser(null)}
                        onAction={() => { }}
                    />
                </AnimatePresence>

            </main>
        </>
    );
}