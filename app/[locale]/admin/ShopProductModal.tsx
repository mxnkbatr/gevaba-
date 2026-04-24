"use client";

import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { X, Loader2, ImageIcon, Trash2 } from "lucide-react";

type ShopCategory =
  | "sutra"
  | "incense"
  | "statue"
  | "mala"
  | "ritual"
  | "blessing"
  | "other";

type Mode = "create" | "edit";

type LocalizedString = { mn: string; en: string };

export type ShopProductForm = {
  _id?: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  category: ShopCategory;
  stock: number; // -1 unlimited
  type: "physical" | "digital";
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
};

export default function ShopProductModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  mode: Mode;
  initialData?: ShopProductForm;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<ShopProductForm>({
    _id: initialData?._id,
    name: initialData?.name ?? { mn: "", en: "" },
    description: initialData?.description ?? { mn: "", en: "" },
    price: Number(initialData?.price ?? 0),
    category: (initialData?.category ?? "other") as ShopCategory,
    stock: Number(initialData?.stock ?? 0),
    type: initialData?.type ?? "physical",
    isFeatured: Boolean(initialData?.isFeatured ?? false),
    isActive: Boolean(initialData?.isActive ?? true),
    images: Array.isArray(initialData?.images) ? initialData!.images : [],
  });

  React.useEffect(() => {
    if (!isOpen) return;
    setForm({
      _id: initialData?._id,
      name: initialData?.name ?? { mn: "", en: "" },
      description: initialData?.description ?? { mn: "", en: "" },
      price: Number(initialData?.price ?? 0),
      category: (initialData?.category ?? "other") as ShopCategory,
      stock: Number(initialData?.stock ?? 0),
      type: initialData?.type ?? "physical",
      isFeatured: Boolean(initialData?.isFeatured ?? false),
      isActive: Boolean(initialData?.isActive ?? true),
      images: Array.isArray(initialData?.images) ? initialData!.images : [],
    });
  }, [isOpen, initialData]);

  const categories: Array<{ id: ShopCategory; label: string }> = useMemo(
    () => [
      { id: "sutra", label: "Ном судар" },
      { id: "incense", label: "Хүж" },
      { id: "statue", label: "Бурхан" },
      { id: "mala", label: "Эрих" },
      { id: "ritual", label: "Тахилын зүйл" },
      { id: "blessing", label: "Адислал" },
      { id: "other", label: "Бусад" },
    ],
    [],
  );

  if (!isOpen) return null;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadImage = async (file: File) => {
    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing in .env file");
      return null;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const json = await res.json();
    return json.secure_url as string;
  };

  const handleImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        if (url) setForm((p) => ({ ...p, images: [...(p.images ?? []), url] }));
      }
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err?.message || "Upload failed"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (url: string) => {
    setForm((p) => ({ ...p, images: (p.images ?? []).filter((x) => x !== url) }));
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/shop/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            price: form.price,
            category: form.category,
            type: form.type,
            stock: form.stock,
            isFeatured: form.isFeatured,
            isActive: form.isActive,
            images: form.images,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Create failed");
      } else {
        const id = form._id;
        if (!id) throw new Error("Missing product id");
        const res = await fetch(`/api/shop/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            price: form.price,
            category: form.category,
            type: form.type,
            stock: form.stock,
            isFeatured: form.isFeatured,
            isActive: form.isActive,
            images: form.images,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Update failed");
      }
      await onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const Switch = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wider opacity-70">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
          checked ? "bg-amber-500" : "bg-black/10"
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black font-serif text-amber-600">
              {mode === "edit" ? "Бүтээгдэхүүн засах" : "Бүтээгдэхүүн нэмэх"}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {mode === "edit" ? "Мэдээллийг шинэчлэх" : "Шинэ бүтээгдэхүүн бүртгэх"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Нэр (MN)" value={form.name.mn} onChange={(v) => setForm((p) => ({ ...p, name: { ...p.name, mn: v } }))} required />
              <Input label="Name (EN)" value={form.name.en} onChange={(v) => setForm((p) => ({ ...p, name: { ...p.name, en: v } }))} required />

              <Textarea label="Тайлбар (MN)" value={form.description.mn} onChange={(v) => setForm((p) => ({ ...p, description: { ...p.description, mn: v } }))} />
              <Textarea label="Description (EN)" value={form.description.en} onChange={(v) => setForm((p) => ({ ...p, description: { ...p.description, en: v } }))} />

              <div>
                <label className="text-xs font-bold uppercase opacity-70 block mb-1">Үнэ (MNT)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value ?? 0) }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-70 block mb-1">Ангилал</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ShopCategory }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase opacity-70 block mb-1">Нөөц (stock)</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value ?? 0) }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
                />
                <p className="text-[11px] opacity-50 mt-1">
                  -1 = Хязгааргүй
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase opacity-70">Төрөл</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: "physical" }))}
                    className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                      form.type === "physical"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    physical
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: "digital" }))}
                    className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                      form.type === "digital"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    digital
                  </button>
                </div>
              </div>

              <Switch
                label="Онцлох"
                checked={form.isFeatured}
                onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))}
              />
              <Switch
                label="Идэвхтэй"
                checked={form.isActive}
                onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
            </div>

            {/* Images */}
            <div>
              <label className="text-xs font-bold uppercase opacity-70 block mb-2">Зургууд</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(form.images ?? []).map((url) => (
                  <div key={url} className="relative w-full aspect-square rounded-2xl overflow-hidden border border-amber-500/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center hover:border-amber-500 transition-colors group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImages}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="animate-spin text-amber-500" />
                  ) : (
                    <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        Upload
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Хадгалах
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase opacity-70 block">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase opacity-70 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-colors min-h-[110px]"
      />
    </div>
  );
}

