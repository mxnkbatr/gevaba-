"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface UserEditModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}

export default function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "account">("basic");

  useEffect(() => {
    if (user) {
      // Handle name structure (string or object)
      let name = { mn: "", en: "" };
      if (typeof user.name === 'string') {
        name = { mn: user.name, en: user.name };
      } else if (user.name) {
        name = { mn: user.name.mn || "", en: user.name.en || "" };
      }

      setFormData({
        ...user,
        name,
        phone: user.phone || "",
        email: user.email || "",
        karma: user.karma || 0,
        totalMerits: user.totalMerits || 0,
        role: user.role || "seeker",
      });
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(user._id, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save user", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0C164F] w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
          <div>
            <h2 className="text-2xl font-black font-serif text-amber-600 dark:text-amber-400">Хэрэглэгч засах</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Мэдээллийг шинэчлэх</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 px-6 bg-gray-50 dark:bg-black/20">
          {["basic", "account"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-white/5"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              {{ basic: "Үндсэн", account: "Бүртгэл & Эрх" }[tab]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form id="user-edit-form" onSubmit={handleSubmit} className="space-y-6">

            {/* BASIC INFO */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Нэр (MN)" value={formData.name?.mn} onChange={(v: string) => handleChange("name", v, "mn")} />
                <InputGroup label="Name (EN)" value={formData.name?.en} onChange={(v: string) => handleChange("name", v, "en")} />

                <div className="col-span-full">
                  <InputGroup label="Утас (Phone)" value={formData.phone} onChange={(v: string) => handleChange("phone", v)} />
                </div>

                <div className="col-span-full">
                  <InputGroup label="Имэйл (Email)" value={formData.email} onChange={(v: string) => handleChange("email", v)} type="email" />
                </div>
              </div>
            )}

            {/* ACCOUNT INFO */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Karma" value={formData.karma} onChange={(v: string) => handleChange("karma", parseInt(v) || 0)} type="number" />
                  <InputGroup label="Total Merits" value={formData.totalMerits} onChange={(v: string) => handleChange("totalMerits", parseInt(v) || 0)} type="number" />
                  <InputGroup label="Earnings (₮)" value={formData.earnings} onChange={(v: string) => handleChange("earnings", parseInt(v) || 0)} type="number" />
                </div>

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
            form="user-edit-form"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Хадгалах
          </button>
        </div>

      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 block">{label}</label>
      <input
        type={type}
        className="w-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}