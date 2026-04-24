"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BookOpen, Loader2, Image as ImageIcon, X, Pen } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate } from "../lib/dateUtils";

interface ContentManagerProps {
    blogs: any[];
}

export default function ContentManager({ blogs }: ContentManagerProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        titleMn: "", titleEn: "",
        contentMn: "", contentEn: "",
        date: new Date().toISOString().split("T")[0],
        imageUrl: ""
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return alert("Image too large (Max 5MB)");

        setUploadingImage(true);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        data.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: data });
            const json = await res.json();
            if (json.secure_url) setFormData(prev => ({ ...prev, imageUrl: json.secure_url }));
        } catch (err) { alert("Image upload failed"); console.error(err); }
        finally { setUploadingImage(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this blog post?")) return;
        setLoading(true);
        try {
            await fetch("/api/admin/content", {
                method: "DELETE",
                body: JSON.stringify({ id, type: "blog" })
            });
            router.refresh();
        } catch (e) { alert("Delete failed"); }
        finally { setLoading(false); }
    };

    const handleEdit = (item: any) => {
        setEditId(item.id);
        setFormData({
            titleMn: item.title?.mn || "",
            titleEn: item.title?.en || "",
            contentMn: item.content?.mn || "",
            contentEn: item.content?.en || "",
            date: item.date || new Date().toISOString().split("T")[0],
            imageUrl: item.cover || ""
        });
        setIsCreating(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = editId ? "PUT" : "POST";
            const body = editId
                ? { ...formData, id: editId, type: "blog" }
                : { ...formData, type: "blog" };

            const res = await fetch("/api/admin/content", {
                method: method,
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Failed");

            setIsCreating(false);
            setEditId(null);
            setFormData({ titleMn: "", titleEn: "", contentMn: "", contentEn: "", date: new Date().toISOString().split("T")[0], imageUrl: "" });
            router.refresh();
        } catch (e) { alert("Save failed"); }
        finally { setLoading(false); }
    };

    const closeForm = () => {
        setIsCreating(false);
        setEditId(null);
        setFormData({ titleMn: "", titleEn: "", contentMn: "", contentEn: "", date: new Date().toISOString().split("T")[0], imageUrl: "" });
    }

    return (
        <div className="space-y-6">

            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-stone-800">My Blog Posts</h2>
                        <p className="text-stone-500 text-sm">Manage your daily wisdom and updates.</p>
                    </div>
                </div>
                <button type="button" onClick={() => { setEditId(null); setIsCreating(true); }} className="flex items-center gap-2 bg-[#D97706] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B45309] transition-colors shadow-lg shadow-amber-500/20">
                    <Plus /> New Post
                </button>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                                <h3 className="text-xl font-bold text-stone-800 font-serif">{editId ? "Edit Blog Post" : "Compose New Blog"}</h3>
                                <button
                                  type="button"
                                  onClick={closeForm}
                                  aria-label="Close"
                                  className="text-stone-400 hover:text-stone-600 p-2"
                                >
                                  <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-8">
                                <form id="createContentForm" onSubmit={handleSubmit} className="space-y-6">

                                    {/* --- COVER IMAGE --- */}
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Cover Image</label>
                                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed border-stone-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors ${uploadingImage && 'opacity-50'}`}>
                                            {uploadingImage ? <Loader2 className="animate-spin text-2xl text-[#D97706]" /> :
                                                formData.imageUrl ? (
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={formData.imageUrl}
                                                            alt="Cover Preview"
                                                            fill
                                                            className="object-cover rounded-2xl"
                                                            sizes="(max-width: 768px) 100vw, 800px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-stone-400">
                                                        <ImageIcon className="text-3xl mx-auto mb-2" />
                                                        <span className="font-bold">Click to Upload Image</span>
                                                    </div>)}
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Title (MN)" value={formData.titleMn} onChange={v => setFormData({ ...formData, titleMn: v })} placeholder="Монгол гарчиг..." />
                                        <Input label="Title (EN)" value={formData.titleEn} onChange={v => setFormData({ ...formData, titleEn: v })} placeholder="English Title..." />
                                        <Input type="date" label="Publish Date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                                    </div>

                                    <div className="space-y-6">
                                        <TextArea label="Content (MN)" value={formData.contentMn} onChange={v => setFormData({ ...formData, contentMn: v })} rows={6} placeholder="Монгол агуулга..." />
                                        <TextArea label="Content (EN)" value={formData.contentEn} onChange={v => setFormData({ ...formData, contentEn: v })} rows={6} placeholder="English content..." />
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50/50">
                                <button type="button" onClick={closeForm} className="px-6 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors">Cancel</button>
                                <button form="createContentForm" type="submit" disabled={loading || uploadingImage} className="px-8 py-3 bg-[#D97706] text-white font-bold rounded-xl hover:bg-[#B45309] disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20">
                                    {loading ? "Saving..." : editId ? "Update Post" : "Publish Post"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- Data List --- */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-6">Cover</th>
                            <th className="p-6">Post Details</th>
                            <th className="p-6">Date</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {blogs.map((item: any) => (
                            <tr key={item._id || item.id} className="hover:bg-stone-50/50 transition-colors group">
                                <td className="p-6 w-32">
                                    <div className="w-20 h-14 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden relative">
                                        {(item.cover || item.thumbnail) ? (
                                            <Image
                                                src={item.cover || item.thumbnail}
                                                alt={item.title?.mn || "Blog Thumbnail"}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-stone-300"><ImageIcon /></div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <h4 className="font-bold text-stone-800 text-lg mb-1">{item.title?.mn || item.title?.en}</h4>
                                    <p className="text-sm text-stone-500 line-clamp-1">{item.content?.mn || item.content?.en || item.description?.mn}</p>
                                </td>
                                <td className="p-6 text-sm font-bold text-stone-500">
                                    {formatDate(item.date, "en")}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(item)} className="p-3 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Edit Post"><Pen /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all" title="Delete Post"><Trash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {blogs.length === 0 && (
                    <div className="p-12 text-center text-stone-400 flex flex-col items-center">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No blog posts yet.</p>
                        <p className="text-sm mt-1">Start sharing your wisdom called 'Blogs'!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helpers
const Input = ({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (<div><label className="block text-xs font-bold text-stone-500 uppercase mb-2">{label}</label><input type={type} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-all placeholder:text-stone-300" /></div>);
const TextArea = ({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) => (<div><label className="block text-xs font-bold text-stone-500 uppercase mb-2">{label}</label><textarea value={value} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)} rows={rows || 4} placeholder={placeholder} className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D97706] outline-none transition-all placeholder:text-stone-300" /></div>);
