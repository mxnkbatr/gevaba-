"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { X, Save, Loader2, ImageIcon, Trash2 } from "lucide-react";

// Define the shape of your form data for better type safety
interface LocalizedString {
  mn: string;
  en: string;
}

interface ServiceFormData {
  name: LocalizedString;
  title: LocalizedString;
  type: string;
  price: number;
  duration: string;
  desc: LocalizedString;
  subtitle: LocalizedString;
  image: string;
  quote: LocalizedString;
}

interface ServiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave now gets data + optional ID (if editing)
  onSave: (data: ServiceFormData, id?: string) => Promise<void>;
  initialData?: ServiceFormData & { id?: string };
}

export default function ServiceCreateModal({ isOpen, onClose, onSave, initialData }: ServiceCreateModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: { mn: "", en: "" },
    title: { mn: "", en: "" },
    type: "teaching",
    price: 0,
    duration: "30 min",
    desc: { mn: "", en: "" },
    subtitle: { mn: "", en: "" },
    image: "",
    quote: { mn: "", en: "" }
  });

  // Populate form if editing
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || { mn: "", en: "" },
        title: initialData.title || { mn: "", en: "" },
        type: initialData.type || "teaching",
        price: initialData.price || 0,
        duration: initialData.duration || "30 min",
        desc: initialData.desc || { mn: "", en: "" },
        subtitle: initialData.subtitle || { mn: "", en: "" },
        image: initialData.image || "",
        quote: initialData.quote || { mn: "", en: "" }
      });
    } else {
      // Reset if creating new
      setFormData({
        name: { mn: "", en: "" },
        title: { mn: "", en: "" },
        type: "teaching",
        price: 0,
        duration: "30 min",
        desc: { mn: "", en: "" },
        subtitle: { mn: "", en: "" },
        image: "",
        quote: { mn: "", en: "" }
      });
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "content">("basic");

  if (!isOpen) return null;

  // Type-safe change handler
  const handleChange = (field: keyof ServiceFormData, value: any, nestedField?: keyof LocalizedString) => {
    if (nestedField) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field] as LocalizedString),
          [nestedField]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing in .env file");
      setUploadingImage(false);
      return;
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data
      });

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, initialData?.id);
      onClose();
      // Reset form happens via useEffect on isOpen change mostly, but safe to keep manual reset if needed
      if (!initialData) {
        setFormData({
          name: { mn: "", en: "" },
          title: { mn: "", en: "" },
          type: "teaching",
          price: 0,
          duration: "30 min",
          desc: { mn: "", en: "" },
          subtitle: { mn: "", en: "" },
          image: "",
          quote: { mn: "", en: "" }
        });
        setActiveTab("basic");
      }
    } catch (error) {
      console.error("Failed to save service", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Үндсэн" },
    { id: "details", label: "Нарийвчлал" },
    { id: "content", label: "Агуулга" }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black font-serif text-amber-600">
              {initialData ? "Үйлчилгээ засах" : "Үйлчилгээ нэмэх"}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {initialData ? "Мэдээллийг шинэчлэх" : "Шинэ үйлчилгээ бүртгэх"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`py-4 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id
                ? "border-amber-500 text-amber-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form id="service-create-form" onSubmit={handleSubmit} className="space-y-6">

            {/* BASIC INFO */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Нэр (MN)" value={formData.name.mn} onChange={(v) => handleChange("name", v, "mn")} required />
                <InputGroup label="Name (EN)" value={formData.name.en} onChange={(v) => handleChange("name", v, "en")} required />

                <InputGroup label="Гарчиг (MN)" value={formData.title.mn} onChange={(v) => handleChange("title", v, "mn")} />
                <InputGroup label="Title (EN)" value={formData.title.en} onChange={(v) => handleChange("title", v, "en")} />

                <div className="col-span-full">
                  <label className="text-xs font-bold uppercase opacity-70 block mb-1">Зураг (Image)</label>
                  {formData.image ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-amber-500 group">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        aria-label="Remove image"
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-amber-500 transition-colors group">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadingImage} />
                      {uploadingImage ? <Loader2 className="animate-spin text-amber-500" /> : (
                        <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs font-bold">Зураг оруулах (Click to upload)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DETAILS */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-70 block">Төрөл</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                  >
                    <option value="teaching">Teaching (Сургаал)</option>
                    <option value="divination">Divination (Мэрэг)</option>
                    <option value="ritual">Ritual (Засал)</option>
                  </select>
                </div>

                <InputGroup
                  label="Үнэ (₮)"
                  type="number"
                  value={formData.price}
                  onChange={(v) => handleChange("price", parseFloat(v) || 0)}
                  required
                />
                <InputGroup label="Хугацаа (Duration)" value={formData.duration} onChange={(v) => handleChange("duration", v)} />
              </div>
            )}

            {/* CONTENT */}
            {activeTab === "content" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Тайлбар (MN)" value={formData.desc.mn} onChange={(v) => handleChange("desc", v, "mn")} textarea rows={4} />
                  <InputGroup label="Description (EN)" value={formData.desc.en} onChange={(v) => handleChange("desc", v, "en")} textarea rows={4} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Дэд гарчиг (MN)" value={formData.subtitle.mn} onChange={(v) => handleChange("subtitle", v, "mn")} />
                  <InputGroup label="Subtitle (EN)" value={formData.subtitle.en} onChange={(v) => handleChange("subtitle", v, "en")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Ишлэл (MN)" value={formData.quote.mn} onChange={(v) => handleChange("quote", v, "mn")} textarea />
                  <InputGroup label="Quote (EN)" value={formData.quote.en} onChange={(v) => handleChange("quote", v, "en")} textarea />
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-gray-200 text-gray-600 hover:opacity-80 transition-opacity"
          >
            Болих
          </button>
          <button
            type="submit"
            form="service-create-form"
            disabled={loading || uploadingImage}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase bg-amber-500 text-white shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Хадгалах
          </button>
        </div>

      </div>
    </div>
  );
}

// Sub-component definition
interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
}

function InputGroup({ label, value, onChange, type = "text", textarea = false, rows = 3, required = false }: InputGroupProps) {
  const baseClasses = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors";

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase opacity-70 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          className={baseClasses}
          rows={rows}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          type={type}
          className={baseClasses}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </div>
  );
}