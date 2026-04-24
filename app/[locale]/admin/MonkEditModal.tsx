"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface MonkEditModalProps {
  monk: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}

export default function MonkEditModal({ monk, isOpen, onClose, onSave }: MonkEditModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "bio" | "schedule" | "blocked" | "account">("basic");
  const [selectedblockDate, setSelectedBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (monk) {
      // Initialize form with monk data, ensuring objects exist
      setFormData({
        ...monk,
        name: monk.name || { mn: "", en: "" },
        title: monk.title || { mn: "", en: "" },
        bio: monk.bio || { mn: "", en: "" },
        education: monk.education || { mn: "", en: "" },
        philosophy: monk.philosophy || { mn: "", en: "" },
        quote: monk.quote || { mn: "", en: "" },
        specialties: monk.specialties || [],
        yearsOfExperience: monk.yearsOfExperience || 0,
        image: monk.image || "",
        schedule: monk.schedule || [
          { day: "Monday", start: "00:00", end: "23:59", active: true },
          { day: "Tuesday", start: "00:00", end: "23:59", active: true },
          { day: "Wednesday", start: "00:00", end: "23:59", active: true },
          { day: "Thursday", start: "00:00", end: "23:59", active: true },
          { day: "Friday", start: "00:00", end: "23:59", active: true },
          { day: "Saturday", start: "00:00", end: "23:59", active: false },
          { day: "Sunday", start: "00:00", end: "23:59", active: false },
          { day: "Sunday", start: "00:00", end: "23:59", active: false },
        ],
        blockedSlots: monk.blockedSlots || []
      });
    }
  }, [monk]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any, nestedField?: string) => {
    if (nestedField) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nestedField]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    const newSpecialties = [...formData.specialties];
    newSpecialties[index] = value;
    setFormData({ ...formData, specialties: newSpecialties });
  };

  const addSpecialty = () => {
    setFormData({ ...formData, specialties: [...formData.specialties, ""] });
  };

  const removeSpecialty = (index: number) => {
    const newSpecialties = formData.specialties.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, specialties: newSpecialties });
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(monk._id, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save monk", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0C164F] w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
          <div>
            <h2 className="text-2xl font-black font-serif text-amber-600 dark:text-amber-400">Лам засах</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Мэдээллийг шинэчлэх</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 px-6 bg-gray-50 dark:bg-black/20 overflow-x-auto">
          {["basic", "details", "bio", "schedule", "blocked", "account"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-white/5"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              {{ basic: "Үндсэн", details: "Дэлгэрэнгүй", bio: "Намтар & Бусад", schedule: "Цагийн Хуваарь", blocked: "Хаасан Өдрүүд", account: "Бүртгэл & Эрх" }[tab]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form id="monk-edit-form" onSubmit={handleSubmit} className="space-y-6">

            {/* BASIC INFO */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Нэр (MN)" value={formData.name?.mn} onChange={(v: string) => handleChange("name", v, "mn")} />
                <InputGroup label="Name (EN)" value={formData.name?.en} onChange={(v: string) => handleChange("name", v, "en")} />

                <InputGroup label="Цол (MN)" value={formData.title?.mn} onChange={(v: string) => handleChange("title", v, "mn")} />
                <InputGroup label="Title (EN)" value={formData.title?.en} onChange={(v: string) => handleChange("title", v, "en")} />

                <div className="col-span-full">
                  <InputGroup label="Зураг (URL)" value={formData.image} onChange={(v: string) => handleChange("image", v)} />
                  {formData.image && (
                    <div className="relative w-20 h-20 mt-2">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="rounded-xl object-cover border-2 border-amber-500"
                        sizes="80px"
                      />
                    </div>
                  )}
                </div>

                <div className="col-span-full flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <input
                    type="checkbox"
                    id="isSpecial"
                    checked={formData.isSpecial || false}
                    onChange={(e) => handleChange("isSpecial", e.target.checked)}
                    className="w-5 h-5 accent-amber-500"
                  />
                  <div>
                    <label htmlFor="isSpecial" className="font-bold text-sm text-amber-800 dark:text-amber-200 cursor-pointer select-none">Онцгой Лам (Special Status)</label>
                    <p className="text-xs opacity-60">Идэвхжүүлвэл үйлчилгээний үнэ 80k, орлого 80k болно.</p>
                  </div>
                </div>

                <div className="col-span-full flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <input
                    type="checkbox"
                    id="showOnHomepage"
                    checked={formData.showOnHomepage || false}
                    onChange={(e) => handleChange("showOnHomepage", e.target.checked)}
                    className="w-5 h-5 accent-blue-500"
                  />
                  <div>
                    <label htmlFor="showOnHomepage" className="font-bold text-sm text-blue-800 dark:text-blue-200 cursor-pointer select-none">Нүүр хуудсанд харуулах (Show on Homepage)</label>
                    <p className="text-xs opacity-60">Идэвхжүүлвэл нүүр хуудсан дээрх лам нарын хэсэгт харагдана.</p>
                  </div>
                </div>

                <div className="col-span-full">
                  <InputGroup label="Утас (Phone)" value={formData.phone} onChange={(v: string) => handleChange("phone", v)} />
                </div>

                <div className="col-span-full flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <input
                    type="checkbox"
                    id="isBadMonk"
                    checked={formData.isBadMonk || false}
                    onChange={(e) => handleChange("isBadMonk", e.target.checked)}
                    className="w-5 h-5 accent-red-500"
                  />
                  <div>
                    <label htmlFor="isBadMonk" className="font-bold text-sm text-red-800 dark:text-red-200 cursor-pointer select-none">Муу Лам (Bad Monk - Forced Schedule)</label>
                    <p className="text-xs opacity-60">Идэвхжүүлвэл сарын 20-нд автомат хязгаарлалт тооцоолно. 50% өдрүүд бүрэн хаагдах, үлдсэн өдрүүдэд 80% цагийг хаана.</p>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Туршлага (Жил)" type="number" value={formData.yearsOfExperience} onChange={(v: string) => handleChange("yearsOfExperience", parseInt(v) || 0)} />
                  <InputGroup label="Earnings (₮)" type="number" value={formData.earnings} onChange={(v: string) => handleChange("earnings", parseInt(v) || 0)} />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Мэргэшил (Specialties)</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties?.map((spec: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          className="bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                          value={spec}
                          onChange={(e) => handleSpecialtyChange(index, e.target.value)}
                        />
                        <button type="button" onClick={() => removeSpecialty(index)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addSpecialty} className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-4 py-2 rounded-lg hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                      <Plus size={16} /> Нэмэх
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Боловсрол (MN)" value={formData.education?.mn} onChange={(v: string) => handleChange("education", v, "mn")} textarea />
                  <InputGroup label="Education (EN)" value={formData.education?.en} onChange={(v: string) => handleChange("education", v, "en")} textarea />
                </div>
              </div>
            )}

            {/* BIO & OTHERS */}
            {activeTab === "bio" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Намтар (MN)" value={formData.bio?.mn} onChange={(v: string) => handleChange("bio", v, "mn")} textarea rows={6} />
                  <InputGroup label="Biography (EN)" value={formData.bio?.en} onChange={(v: string) => handleChange("bio", v, "en")} textarea rows={6} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Философи (MN)" value={formData.philosophy?.mn} onChange={(v: string) => handleChange("philosophy", v, "mn")} textarea />
                  <InputGroup label="Philosophy (EN)" value={formData.philosophy?.en} onChange={(v: string) => handleChange("philosophy", v, "en")} textarea />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Ишлэл (MN)" value={formData.quote?.mn} onChange={(v: string) => handleChange("quote", v, "mn")} />
                  <InputGroup label="Quote (EN)" value={formData.quote?.en} onChange={(v: string) => handleChange("quote", v, "en")} />
                </div>
              </div>
            )}

            {/* SCHEDULE */}
            {activeTab === "schedule" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase">Ажлын цагийн хуваарь</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">Даваа - Ням</span>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-200 dark:border-white/5 text-[10px] font-black uppercase opacity-50 text-center">
                    <div className="col-span-1">Төлөв</div>
                    <div className="col-span-3 text-left pl-2">Өдөр</div>
                    <div className="col-span-4">Эхлэх</div>
                    <div className="col-span-4">Дуусах</div>
                  </div>

                  {formData.schedule?.map((item: any, index: number) => {
                    const dayLabels: Record<string, string> = {
                      "Monday": "Даваа",
                      "Tuesday": "Мягмар",
                      "Wednesday": "Лхагва",
                      "Thursday": "Пүрэв",
                      "Friday": "Баасан",
                      "Saturday": "Бямба",
                      "Sunday": "Ням"
                    };

                    const generateSlots = (start: string, end: string, intervalMinutes: number = 60) => {
                      const slots = [];
                      let current = new Date(`2000-01-01T${start}`);
                      const endTime = new Date(`2000-01-01T${end}`);

                      while (current < endTime) {
                        const timeString = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                        slots.push(timeString);
                        current.setMinutes(current.getMinutes() + intervalMinutes);
                      }
                      return slots;
                    };

                    const handleSlotAdd = (time: string) => {
                      if (!time) return;
                      const currentSlots = item.slots || [];
                      if (!currentSlots.includes(time)) {
                        const newSlots = [...currentSlots, time].sort();
                        handleScheduleChange(index, 'slots', newSlots);
                      }
                    };

                    const handleSlotRemove = (slotToRemove: string) => {
                      const currentSlots = item.slots || [];
                      const newSlots = currentSlots.filter((s: string) => s !== slotToRemove);
                      handleScheduleChange(index, 'slots', newSlots);
                    };

                    const handleGenerate = () => {
                      const slots = generateSlots(item.start || "09:00", item.end || "17:00");
                      handleScheduleChange(index, 'slots', slots);
                    };

                    return (
                      <div key={item.day} className={`p-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${!item.active ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2 w-32 shrink-0">
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={(e) => handleScheduleChange(index, 'active', e.target.checked)}
                              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            />
                            <span className="text-sm font-bold">{dayLabels[item.day] || item.day}</span>
                          </div>

                          {/* Generator Controls */}
                          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold uppercase">Generate:</span>
                            <input
                              type="time"
                              value={item.start}
                              onChange={(e) => handleScheduleChange(index, 'start', e.target.value)}
                              disabled={!item.active}
                              className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs font-mono w-20"
                            />
                            <span className="text-xs">-</span>
                            <input
                              type="time"
                              value={item.end}
                              onChange={(e) => handleScheduleChange(index, 'end', e.target.value)}
                              disabled={!item.active}
                              className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs font-mono w-20"
                            />
                            <button
                              type="button"
                              onClick={handleGenerate}
                              disabled={!item.active}
                              className="p-1.5 bg-amber-500/10 text-amber-600 rounded hover:bg-amber-500 hover:text-white transition-colors"
                              title="Generate slots from range"
                            >
                              <RefreshCw size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Slots Display */}
                        {item.active && (
                          <div className="pl-8 pb-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(item.slots || []).map((slot: string) => (
                                <div key={slot} className="flex items-center gap-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-xs font-mono">
                                  <span>{slot}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSlotRemove(slot)}
                                    className="text-red-400 hover:text-red-600 ml-1"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                              {(!item.slots || item.slots.length === 0) && (
                                <span className="text-xs opacity-40 italic">No slots generated. Use the generator above or add manually.</span>
                              )}
                            </div>

                            {/* Manual Add */}
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                className="bg-transparent border-b border-gray-300 dark:border-white/20 text-xs py-1 w-20 focus:outline-none focus:border-amber-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSlotAdd(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                              <span className="text-[10px] opacity-40 uppercase">Press Enter to Add Single Slot</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BLOCKED SLOTS - EASY MODE */}
            {activeTab === "blocked" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase">Хаасан Цагууд (Exceptions)</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Manage specific dates where you are unavailable.</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200 dark:border-white/10">

                  {/* Date Selection & Presets */}
                  <div className="mb-6 space-y-3">
                    <label className="text-xs font-bold uppercase block opacity-60">Өдөр Сонгох (Select Date)</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={selectedblockDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedBlockDate(e.target.value)}
                        className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500 shadow-sm"
                      />
                      {/* Quick Presets */}
                      <button type="button" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 1);
                        setSelectedBlockDate(d.toISOString().split('T')[0]);
                      }} className="px-3 py-2 text-xs font-bold bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">
                        Tomorrow
                      </button>
                      <button type="button" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 7);
                        setSelectedBlockDate(d.toISOString().split('T')[0]);
                      }} className="px-3 py-2 text-xs font-bold bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">
                        Next Week
                      </button>
                    </div>
                  </div>

                  {(() => {
                    // 1. Find Schedule for this weekday
                    const dateObj = new Date(selectedblockDate);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const dayConfig = formData.schedule?.find((s: any) => s.day === dayName);

                    if (!dayConfig || !dayConfig.active) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-50 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                          <span className="text-2xl font-bold mb-1">💤</span>
                          <span className="text-sm font-bold">Day Off</span>
                          <span className="text-xs">Normally not working on {dayName}s.</span>
                        </div>
                      );
                    }

                    // 2. Get Potential Slots
                    let potentialSlots: string[] = [];
                    if (dayConfig.slots && dayConfig.slots.length > 0) {
                      potentialSlots = dayConfig.slots;
                    } else {
                      // Fallback generation (simple hourly)
                      let current = new Date(`2000-01-01T${dayConfig.start || "09:00"}`);
                      const endTime = new Date(`2000-01-01T${dayConfig.end || "17:00"}`);
                      while (current < endTime) {
                        potentialSlots.push(current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                        current.setMinutes(current.getMinutes() + 60);
                      }
                    }

                    const toggleBlock = (time: string) => {
                      const currentBlocked = formData.blockedSlots || [];
                      const exists = currentBlocked.find((b: any) => b.date === selectedblockDate && b.time === time);

                      let newBlocked;
                      if (exists) {
                        // Unblock
                        newBlocked = currentBlocked.filter((b: any) => !(b.date === selectedblockDate && b.time === time));
                      } else {
                        // Block
                        newBlocked = [...currentBlocked, { date: selectedblockDate, time }];
                      }
                      setFormData({ ...formData, blockedSlots: newBlocked });
                    };

                    const blockAll = () => {
                      const currentBlocked = formData.blockedSlots || [];
                      // Remove existing blocks for this date first to avoid dupes
                      const others = currentBlocked.filter((b: any) => b.date !== selectedblockDate);
                      // Add all slots as blocked
                      const newBlocks = potentialSlots.map(time => ({ date: selectedblockDate, time }));
                      setFormData({ ...formData, blockedSlots: [...others, ...newBlocks] });
                    };

                    const unblockAll = () => {
                      const currentBlocked = formData.blockedSlots || [];
                      const others = currentBlocked.filter((b: any) => b.date !== selectedblockDate);
                      setFormData({ ...formData, blockedSlots: others });
                    };

                    // Check status
                    const blockedCount = potentialSlots.filter(t => formData.blockedSlots?.some((b: any) => b.date === selectedblockDate && b.time === t)).length;
                    const isFullyBlocked = blockedCount === potentialSlots.length;
                    const isFullyOpen = blockedCount === 0;

                    return (
                      <div>
                        {/* Master Toggle */}
                        <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                              {isFullyBlocked ? "Day is Blocked (Off)" : "Day is Active"}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {isFullyBlocked
                                ? "No slots available for booking."
                                : `${potentialSlots.length - blockedCount} slots available.`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => isFullyBlocked ? unblockAll() : blockAll()}
                            className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${isFullyBlocked ? 'bg-red-500' : 'bg-gray-300 dark:bg-white/10'
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${isFullyBlocked ? 'left-7' : 'left-1'
                              }`} />
                          </button>
                        </div>

                        {/* Explicit "Choose times" instruction */}
                        {!isFullyBlocked && (
                          <div className="mb-2 text-[10px] font-bold uppercase opacity-50">
                            Tap specific times to block them:
                          </div>
                        )}

                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                          {potentialSlots.map(time => {
                            const isBlocked = formData.blockedSlots?.some((b: any) => b.date === selectedblockDate && b.time === time);
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => toggleBlock(time)}
                                className={`py-2 px-1 rounded-lg text-xs font-bold font-mono transition-all border ${isBlocked
                                  ? "bg-red-500 text-white border-red-600 shadow-sm"
                                  : "bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/5 hover:border-amber-500 hover:text-amber-500"
                                  }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>{time}</span>
                                  {isBlocked && <X size={10} strokeWidth={3} />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Upcoming Blocks Summary */}
                {(formData.blockedSlots || []).length > 0 && (
                  <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                    <h4 className="text-xs font-bold uppercase mb-4 opacity-50 flex items-center gap-2">
                      <Trash2 size={12} /> Upcoming Exceptions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Group by date */}
                      {Object.entries(
                        (formData.blockedSlots || []).reduce((acc: any, curr: any) => {
                          if (!acc[curr.date]) acc[curr.date] = [];
                          acc[curr.date].push(curr.time);
                          return acc;
                        }, {})
                      ).sort(([dateA], [dateB]) => String(dateA).localeCompare(String(dateB)))
                        .filter(([date]) => new Date(date as string) >= new Date(new Date().setHours(0, 0, 0, 0))) // Only future
                        .slice(0, 5) // Limit to 5 days
                        .map(([date, times]: any) => (
                          <div key={date} className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-lg p-2 text-xs">
                            <div className="font-bold mb-1 opacity-80">{date}</div>
                            <div className="flex flex-wrap gap-1">
                              {times.sort().map((t: string) => (
                                <span key={t} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACCOUNT INFO */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 block">Үүрэг (Role)</label>
                  <select
                    className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors text-gray-900 dark:text-gray-100"
                    value={formData.role || "seeker"}
                    onChange={(e) => handleChange("role", e.target.value)}
                  >
                    <option value="seeker" className="dark:bg-[#0C164F]">Seeker (Хэрэглэгч)</option>
                    <option value="monk" className="dark:bg-[#0C164F]">Monk (Лам)</option>
                    <option value="admin" className="dark:bg-[#0C164F]">Admin (Админ)</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60 hover:opacity-80 transition-opacity"
          >
            Болих
          </button>
          <button
            type="submit"
            form="monk-edit-form"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Хадгалах
          </button>
        </div>

      </div>
    </div >
  );
}

function InputGroup({ label, value, onChange, type = "text", textarea = false, rows = 3 }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 block">{label}</label>
      {textarea ? (
        <textarea
          className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
          rows={rows}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}