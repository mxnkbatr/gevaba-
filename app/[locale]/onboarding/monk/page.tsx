"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, Loader2, ImageIcon, X, CheckCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext"; // Ensure this import exists

// --- THE INTERFACE ---
export interface Monk {
  name: { mn: string; en: string };
  title: { mn: string; en: string };
  image: string;
  video?: string;
  specialties: string[];
  bio: { mn: string; en: string };
  isAvailable: boolean;
  quote: { mn: string; en: string };
  yearsOfExperience: number;
  education: { mn: string; en: string };
  philosophy: { mn: string; en: string };
  services: {
    id: string;
    name: { mn: string; en: string };
    price: number;
    duration: string;
  }[];
  phone?: string;
}

export default function MonkOnboarding() {
  const { user } = useUser();
  const router = useRouter();
  const { language } = useLanguage(); // 'mn' or 'en'
  const langKey = language === 'mn' ? 'mn' : 'en';

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    if (user === null) {
      router.push(`/${language}/sign-in`);
    }
  }, [user, router, language]);

  // --- TRANSLATION DICTIONARY ---
  const TEXT = {
    en: {
      headerTitle: "Monk Profile Setup",
      headerDesc: "Complete your profile to join the community.",
      sectionBasic: "Basic Information",
      sectionMedia: "Media",
      sectionDetails: "Details",
      sectionWisdom: "Wisdom",
      sectionServices: "Services",
      
      labelNameMN: "Name (Mongolian)",
      labelNameEN: "Name (English)",
      labelTitleMN: "Title (MN - e.g. Gavji)",
      labelTitleEN: "Title (EN - e.g. Master)",
      
      labelProfilePic: "Profile Picture",
      labelVideo: "Video Intro URL (Optional)",
      placeholderVideo: "e.g. YouTube or Vimeo link",
      
      placeholderBioMN: "Bio (Mongolian)",
      placeholderBioEN: "Bio (English)",
      
      labelExp: "Years Experience",
      labelSpecialties: "Specialties (Press Enter)",
      placeholderSpecialties: "Type and press Enter...",
      
      placeholderEduMN: "Education (Mongolian)",
      placeholderEduEN: "Education (English)",
      placeholderPhilMN: "Philosophy (Mongolian)",
      placeholderPhilEN: "Philosophy (English)",
      
      btnServicesAdd: "Add Service",
      placeholderSvcNameMN: "Service Name (MN)",
      placeholderSvcNameEN: "Service Name (EN)",
      placeholderPrice: "Price (₮)",
      placeholderDuration: "Duration",
      
      btnSubmit: "Submit Application",
      
      successTitle: "Application Received",
      successDesc: "Your profile has been successfully submitted to the Nirvana Administration.",
      successStatus: "Your account status is currently Pending. You will be notified via email once your application is approved.",
      btnHome: "Return to Home",
      
      alertImg: "Please upload a profile image.",
      alertError: "Something went wrong submitting your application.",
      labelPhone: "Phone Number"
    },
    mn: {
      headerTitle: "Ламын мэдээлэл бүртгэх",
      headerDesc: "Сангхад нэгдэхийн тулд мэдээллээ бүрэн бөглөнө үү.",
      sectionBasic: "Үндсэн мэдээлэл",
      sectionMedia: "Зураг & Видео",
      sectionDetails: "Дэлгэрэнгүй",
      sectionWisdom: "Боловсрол & Үзэл баримтлал",
      sectionServices: "Үйлчилгээнүүд",
      
      labelNameMN: "Нэр (Монгол)",
      labelNameEN: "Нэр (Англи)",
      labelTitleMN: "Цол хэргэм (МН - ж.нь Гавьж)",
      labelTitleEN: "Цол хэргэм (EN - ж.нь Master)",
      
      labelProfilePic: "Цээж зураг",
      labelVideo: "Танилцуулга бичлэг (Заавал биш)",
      placeholderVideo: "Youtube эсвэл Vimeo холбоос",
      
      placeholderBioMN: "Намтар (Монгол)",
      placeholderBioEN: "Намтар (Англи)",
      
      labelExp: "Ажилласан жил",
      labelSpecialties: "Мэргэшсэн чиглэл (Enter дарна уу)",
      placeholderSpecialties: "Бичээд Enter дар...",
      
      placeholderEduMN: "Боловсрол (Монгол)",
      placeholderEduEN: "Боловсрол (Англи)",
      placeholderPhilMN: "Үзэл баримтлал (Монгол)",
      placeholderPhilEN: "Үзэл баримтлал (Англи)",
      
      btnServicesAdd: "Үйлчилгээ нэмэх",
      placeholderSvcNameMN: "Үйлчилгээний нэр (МН)",
      placeholderSvcNameEN: "Үйлчилгээний нэр (EN)",
      placeholderPrice: "Үнэ (₮)",
      placeholderDuration: "Хугацаа (ж.нь 30 мин)",
      
      btnSubmit: "Хүсэлт илгээх",
      
      successTitle: "Хүсэлт хүлээн авлаа",
      successDesc: "Таны мэдээлэл Нирваан админд амжилттай илгээгдлээ.",
      successStatus: "Таны бүртгэл хүлээгдэж буй төлөвт байна. Админ баталгаажуулсны дараа танд имэйлээр мэдэгдэх болно.",
      btnHome: "Нүүр хуудас руу буцах",
      
      alertImg: "Профайл зураг оруулна уу.",
      alertError: "Хүсэлт илгээхэд алдаа гарлаа.",
      labelPhone: "Утасны дугаар"
    }
  }[langKey];

  // --- FORM STATE ---
  const [formData, setFormData] = useState<Monk>({
    name: { mn: "", en: "" },
    title: { mn: "", en: "" },
    image: "",
    video: "",
    specialties: [],
    bio: { mn: "", en: "" },
    isAvailable: true,
    quote: { mn: "", en: "" },
    yearsOfExperience: 0,
    education: { mn: "", en: "" },
    philosophy: { mn: "", en: "" },
    services: [],
    phone: "",
  });

  // --- HELPERS ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing");
      setUploadingImage(false);
      return;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
      if (!res.ok) throw new Error("Image upload failed");
      const fileData = await res.json();
      setFormData((prev) => ({ ...prev, image: fileData.secure_url }));
    } catch (error: any) {
      console.error(error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => setFormData((prev) => ({ ...prev, image: "" }));

  const handleInputChange = (section: keyof Monk, subField: string | null, value: any) => {
    setFormData((prev) => {
      if (subField && typeof prev[section] === "object" && prev[section] !== null) {
        // @ts-ignore
        return { ...prev, [section]: { ...prev[section], [subField]: value } };
      }
      return { ...prev, [section]: value };
    });
  };

  const handleSpecialtyAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (!formData.specialties.includes(val)) setFormData((prev) => ({ ...prev, specialties: [...prev.specialties, val] }));
      e.currentTarget.value = "";
    }
  };

  const removeSpecialty = (item: string) => setFormData((prev) => ({ ...prev, specialties: prev.specialties.filter((s) => s !== item) }));

  const addService = () => setFormData((prev) => ({ ...prev, services: [...prev.services, { id: crypto.randomUUID(), name: { mn: "", en: "" }, price: 0, duration: "30 min" }] }));

  const updateService = (id: string, field: string, subField: string | null, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((svc) => {
        if (svc.id !== id) return svc;
        // @ts-ignore
        if (subField) return { ...svc, [field]: { ...svc[field], [subField]: value } };
        return { ...svc, [field]: value };
      }),
    }));
  };

  const removeService = (id: string) => setFormData((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== id) }));

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.image) {
        alert(TEXT.alertImg);
        return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
      };

      const res = await fetch('/api/monks/apply', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      if (!res.ok) throw new Error("Failed to submit application");
      setIsSuccess(true);
      
    } catch (error) {
      console.error(error);
      alert(TEXT.alertError);
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream p-6 flex items-center justify-center font-serif text-ink selection:bg-gold/20">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="monastery-card max-w-lg w-full bg-white/92 p-10 rounded-[2rem] border border-gold/16 shadow-gold backdrop-blur-sm text-center"
        >
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-semibold mb-4 text-gold-dark">{TEXT.successTitle}</h2>
            <p className="text-earth/70 mb-8 leading-relaxed">
                {language === 'en' ? `Thank you, ${formData.name.en}.` : `Баярлалаа, ${formData.name.mn}.`} <br/>
                {TEXT.successDesc}
                <br/><br/>
                {TEXT.successStatus}
            </p>
            <button 
                onClick={() => router.push(`/${language}`)}
                className="cta-button w-full py-4 min-h-[52px] rounded-[1.15rem] text-lg transition-all flex items-center justify-center gap-2 border-0"
            >
                {TEXT.btnHome} <ArrowRight size={20} />
            </button>
        </motion.div>
      </div>
    );
  }

  // --- MAIN FORM ---
  return (
    <div className="min-h-screen bg-cream p-6 md:p-12 font-serif text-ink selection:bg-gold/20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-semibold mb-2 text-gold-dark tracking-tight">{TEXT.headerTitle}</h1>
          <p className="text-earth/70">{TEXT.headerDesc}</p>
        </header>

        <form onSubmit={handleSubmit} className="monastery-card space-y-8 bg-white/88 p-8 rounded-[1.75rem] border border-gold/14 shadow-gold backdrop-blur-sm">
           
           {/* 1. Basic Info */}
           <section className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-gold/18 pb-2 text-ink">{TEXT.sectionBasic}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder={TEXT.labelNameMN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.name.mn} onChange={(e) => handleInputChange("name", "mn", e.target.value)} required />
              <input placeholder={TEXT.labelNameEN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.name.en} onChange={(e) => handleInputChange("name", "en", e.target.value)} required />
              <input placeholder={TEXT.labelTitleMN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.title.mn} onChange={(e) => handleInputChange("title", "mn", e.target.value)} />
              <input placeholder={TEXT.labelTitleEN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.title.en} onChange={(e) => handleInputChange("title", "en", e.target.value)} />
              <input placeholder={TEXT.labelPhone} className="col-span-1 md:col-span-2 p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.phone || ""} onChange={(e) => handleInputChange("phone", null, e.target.value)} />
            </div>
          </section>

          {/* 2. Media */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-gold/18 pb-2 text-ink">{TEXT.sectionMedia}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gold-dark mb-2 uppercase">{TEXT.labelProfilePic}</label>
                {formData.image ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gold-dark/35 group">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button>
                    </div>
                ) : (
                    <div className="relative w-full h-40 rounded-xl border-2 border-dashed border-gold/35 bg-white flex flex-col items-center justify-center">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadingImage} />
                        {uploadingImage ? <Loader2 className="animate-spin text-gold-dark" /> : <ImageIcon className="text-gold-dark/60" />}
                    </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gold-dark mb-2 uppercase">{TEXT.labelVideo}</label>
                <input placeholder={TEXT.placeholderVideo} className="w-full p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.video} onChange={(e) => handleInputChange("video", null, e.target.value)} />
              </div>
            </div>
          </section>

          {/* 3. Details */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-gold/18 pb-2 text-ink">{TEXT.sectionDetails}</h3>
            <div className="grid grid-cols-1 gap-4">
              <textarea placeholder={TEXT.placeholderBioMN} rows={3} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.bio.mn} onChange={(e) => handleInputChange("bio", "mn", e.target.value)} />
              <textarea placeholder={TEXT.placeholderBioEN} rows={3} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.bio.en} onChange={(e) => handleInputChange("bio", "en", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold uppercase text-gold-dark mb-1">{TEXT.labelExp}</label>
                  <input type="number" className="w-full p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.yearsOfExperience} onChange={(e) => handleInputChange("yearsOfExperience", null, parseInt(e.target.value))} />
               </div>
               <div>
                  <label className="text-xs font-bold uppercase text-gold-dark mb-1">{TEXT.labelSpecialties}</label>
                  <input onKeyDown={handleSpecialtyAdd} className="w-full p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" placeholder={TEXT.placeholderSpecialties} />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialties.map(s => <span key={s} className="bg-gold/10 text-gold-dark px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">{s}<button type="button" onClick={() => removeSpecialty(s)}><Trash2 size={12}/></button></span>)}
                  </div>
               </div>
            </div>
          </section>

          {/* 4. Wisdom */}
          <section className="space-y-4">
             <h3 className="text-xl font-semibold border-b border-gold/18 pb-2 text-ink">{TEXT.sectionWisdom}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea placeholder={TEXT.placeholderEduMN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.education.mn} onChange={(e) => handleInputChange("education", "mn", e.target.value)} />
                <textarea placeholder={TEXT.placeholderEduEN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.education.en} onChange={(e) => handleInputChange("education", "en", e.target.value)} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea placeholder={TEXT.placeholderPhilMN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.philosophy.mn} onChange={(e) => handleInputChange("philosophy", "mn", e.target.value)} />
                <textarea placeholder={TEXT.placeholderPhilEN} className="p-3 rounded-xl bg-white border border-gold/18 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 outline-none" value={formData.philosophy.en} onChange={(e) => handleInputChange("philosophy", "en", e.target.value)} />
             </div>
          </section>

          {/* 5. Services */}
          <section className="space-y-4">
            <div className="flex justify-between items-center border-b border-gold/18 pb-2">
              <h3 className="text-xl font-bold">{TEXT.sectionServices}</h3>
              <button type="button" onClick={addService} className="cta-button flex items-center gap-1 text-[11px] px-4 py-2 rounded-full border-0"><Plus size={16} /> {TEXT.btnServicesAdd}</button>
            </div>
            {formData.services.map((svc) => (
              <motion.div key={svc.id} className="bg-white p-4 rounded-xl border border-gold/12 relative group">
                <button type="button" onClick={() => removeService(svc.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                   <input placeholder={TEXT.placeholderSvcNameMN} value={svc.name.mn} onChange={(e) => updateService(svc.id, "name", "mn", e.target.value)} className="p-2 border rounded-lg text-sm" />
                   <input placeholder={TEXT.placeholderSvcNameEN} value={svc.name.en} onChange={(e) => updateService(svc.id, "name", "en", e.target.value)} className="p-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-3">
                   <input type="number" placeholder={TEXT.placeholderPrice} value={svc.price} onChange={(e) => updateService(svc.id, "price", null, parseInt(e.target.value))} className="p-2 border rounded-lg text-sm w-24" />
                   <input placeholder={TEXT.placeholderDuration} value={svc.duration} onChange={(e) => updateService(svc.id, "duration", null, e.target.value)} className="p-2 border rounded-lg text-sm flex-1" />
                </div>
              </motion.div>
            ))}
          </section>

          <div className="pt-6">
            <button type="submit" disabled={loading || uploadingImage} className="cta-button w-full py-4 min-h-[52px] rounded-[1.15rem] text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-0">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {TEXT.btnSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}