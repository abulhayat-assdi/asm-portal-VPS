"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";

export interface CardItem {
    id: string;
    iconKey?: string;
    title: string;
    description: string;
}

export const ICON_OPTIONS = [
    { key: "students", label: "Students (Graduation Cap)" },
    { key: "jobSeekers", label: "Job Seekers (Briefcase)" },
    { key: "entrepreneurs", label: "Entrepreneurs (Star)" },
    { key: "ethicalLearners", label: "Ethical Learners (Clock)" },
    { key: "target", label: "Target (Bullseye)" },
    { key: "chart", label: "Chart (Bar Chart)" },
    { key: "heart", label: "Heart" },
    { key: "shield", label: "Shield" },
    { key: "lightbulb", label: "Lightbulb" },
    { key: "users", label: "Users (Group)" },
    { key: "rocket", label: "Rocket" },
    { key: "award", label: "Award (Trophy)" },
    { key: "check", label: "Check (Verified)" },
    { key: "globe", label: "Globe" },
];

interface Props {
    cards: CardItem[];
    onChange: (cards: CardItem[]) => void;
    showIconPicker?: boolean;
}

const EMPTY_CARD: Omit<CardItem, "id"> = { iconKey: "students", title: "", description: "" };

export default function CardListEditor({ cards, onChange, showIconPicker = false }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [newCard, setNewCard] = useState<Omit<CardItem, "id">>(EMPTY_CARD);

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const arr = [...cards];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        onChange(arr);
    };

    const moveDown = (idx: number) => {
        if (idx === cards.length - 1) return;
        const arr = [...cards];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        onChange(arr);
    };

    const deleteCard = (id: string) => {
        if (!confirm("এই কার্ড ডিলিট করবেন?")) return;
        onChange(cards.filter(c => c.id !== id));
        if (editingId === id) setEditingId(null);
    };

    const updateCard = (id: string, field: keyof CardItem, value: string) => {
        onChange(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const addCard = () => {
        if (!newCard.title.trim()) return;
        const card: CardItem = { ...newCard, id: crypto.randomUUID() };
        onChange([...cards, card]);
        setNewCard(EMPTY_CARD);
        setAddingNew(false);
    };

    const cancelAdd = () => {
        setAddingNew(false);
        setNewCard(EMPTY_CARD);
    };

    return (
        <div className="space-y-2">
            {cards.map((card, idx) => (
                <div key={card.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                    {/* Row header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs text-gray-400 font-mono w-5 text-center flex-shrink-0">#{idx + 1}</span>
                            <span className="font-semibold text-gray-800 truncate text-sm">{card.title || "(Untitled)"}</span>
                            {showIconPicker && card.iconKey && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{card.iconKey}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                                onClick={() => moveUp(idx)}
                                disabled={idx === 0}
                                title="Move up"
                                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button
                                onClick={() => moveDown(idx)}
                                disabled={idx === cards.length - 1}
                                title="Move down"
                                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button
                                onClick={() => setEditingId(editingId === card.id ? null : card.id)}
                                title="Edit"
                                className={`p-1.5 rounded transition-colors ${editingId === card.id ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                                onClick={() => deleteCard(card.id)}
                                title="Delete"
                                className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Inline edit form */}
                    {editingId === card.id && (
                        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                            {showIconPicker && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Icon</label>
                                    <select
                                        value={card.iconKey || "students"}
                                        onChange={(e) => updateCard(card.id, "iconKey", e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                                    >
                                        {ICON_OPTIONS.map(opt => (
                                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <Input
                                label="Title"
                                value={card.title}
                                onChange={(e) => updateCard(card.id, "title", e.target.value)}
                            />
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows={3}
                                    value={card.description}
                                    onChange={(e) => updateCard(card.id, "description", e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700 text-sm resize-none"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="px-4 py-2 bg-[#059669] text-white rounded-lg text-sm font-semibold hover:bg-[#047857] transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Add new card form */}
            {addingNew ? (
                <div className="border-2 border-dashed border-[#059669]/40 rounded-xl px-4 py-4 bg-emerald-50/20 space-y-3">
                    <p className="text-sm font-semibold text-[#059669]">নতুন কার্ড যোগ করুন</p>
                    {showIconPicker && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Icon</label>
                            <select
                                value={newCard.iconKey || "students"}
                                onChange={(e) => setNewCard({ ...newCard, iconKey: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700"
                            >
                                {ICON_OPTIONS.map(opt => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Input
                        label="Title"
                        value={newCard.title}
                        placeholder="Card title"
                        onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            value={newCard.description}
                            placeholder="Card description"
                            onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] text-gray-700 text-sm resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={cancelAdd}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={addCard}
                            disabled={!newCard.title.trim()}
                            className="px-4 py-2 bg-[#059669] text-white rounded-lg text-sm font-semibold hover:bg-[#047857] disabled:opacity-40 transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            Add Card
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setAddingNew(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-[#059669] hover:text-[#059669] hover:bg-emerald-50/20 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    নতুন কার্ড যোগ করুন
                </button>
            )}
        </div>
    );
}
