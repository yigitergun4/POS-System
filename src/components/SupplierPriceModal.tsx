import { useState, useMemo } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-toastify";
import type { SupplierPriceModalProps } from "../types/components";

type TargetField = "price" | "cost" | "both";
type AdjustMethod = "percent_up" | "percent_down" | "fixed_up" | "fixed_down";

export default function SupplierPriceModal({
    products,
    suppliers,
    onClose,
    onDone,
}: SupplierPriceModalProps) {
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");
    const [targetField, setTargetField] = useState<TargetField>("price");
    const [method, setMethod] = useState<AdjustMethod>("percent_up");
    const [amount, setAmount] = useState<string>("");
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [isApplying, setIsApplying] = useState<boolean>(false);

    // Filter products by selected supplier
    const filtered = useMemo(() => {
        if (!selectedSupplier) return [];
        return products.filter((p) => p.supplier === selectedSupplier);
    }, [products, selectedSupplier]);

    // Calculate new price
    const calcNew = (old: number): number => {
        const val: number = parseFloat(amount) || 0;
        if (method === "percent_up") return +(old * (1 + val / 100)).toFixed(2);
        if (method === "percent_down")
            return +Math.max(old * (1 - val / 100), 0).toFixed(2);
        if (method === "fixed_up") return +(old + val).toFixed(2);
        if (method === "fixed_down") return +Math.max(old - val, 0).toFixed(2);
        return old;
    };

    // Preview data
    const preview = useMemo(() => {
        return filtered.map((p) => ({
            name: p.name,
            barcode: p.barcode,
            oldPrice: p.price,
            newPrice:
                targetField === "price" || targetField === "both"
                    ? calcNew(p.price)
                    : p.price,
            oldCost: p.cost ?? 0,
            newCost:
                targetField === "cost" || targetField === "both"
                    ? calcNew(p.cost ?? 0)
                    : p.cost ?? 0,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, targetField, method, amount]);

    const amountNum: number = parseFloat(amount) || 0;
    const isValid: boolean = amountNum > 0 && filtered.length > 0;

    const handleApply: () => Promise<void> = async () => {
        if (!isValid) return;
        setIsApplying(true);
        try {
            for (const p of filtered) {
                const updates: Record<string, number> = {};
                if (targetField === "price" || targetField === "both") {
                    updates.price = calcNew(p.price);
                }
                if (targetField === "cost" || targetField === "both") {
                    updates.cost = calcNew(p.cost ?? 0);
                }
                await updateDoc(doc(db, "products", p.barcode), updates);
            }
            toast.success(`${filtered.length} ürün başarıyla güncellendi ✅`);
            onDone();
        } catch {
            toast.error("Güncelleme sırasında hata oluştu!");
        } finally {
            setIsApplying(false);
            setShowConfirm(false);
        }
    };

    const methodLabels: Record<AdjustMethod, string> = {
        percent_up: "📈 % Zam",
        percent_down: "📉 % İndirim",
        fixed_up: "➕ ₺ Artış",
        fixed_down: "➖ ₺ İndirim",
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📊 Toptancı Bazlı Fiyat Güncelleme
                    </h2>
                    <p className="text-indigo-200 text-sm mt-1">
                        Toptancı seçerek toplu zam veya indirim uygulayın
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Supplier Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🏪 Toptancı Seçin
                        </label>
                        <select
                            value={selectedSupplier}
                            onChange={(e) => {
                                setSelectedSupplier(e.target.value);
                                setShowPreview(false);
                                setShowConfirm(false);
                            }}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="">Toptancı seçin...</option>
                            {suppliers.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        {selectedSupplier && (
                            <div className="mt-2 px-3 py-1.5 bg-indigo-50 rounded-lg text-sm text-indigo-700 font-medium">
                                {filtered.length} ürün etkilenecek
                            </div>
                        )}
                    </div>

                    {/* Target Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            💰 Hangi fiyat güncellensin?
                        </label>
                        <div className="flex gap-2">
                            {(["price", "cost", "both"] as TargetField[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setTargetField(f)}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${targetField === f
                                        ? "bg-emerald-600 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {f === "price"
                                        ? "Satış Fiyatı"
                                        : f === "cost"
                                            ? "Alış Fiyatı"
                                            : "Her İkisi"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Method + Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📐 Yöntem
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(methodLabels) as AdjustMethod[]).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMethod(m)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${method === m
                                            ? "bg-orange-500 text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {methodLabels[m]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🔢 Miktar {method.startsWith("percent") ? "(%)" : "(₺)"}
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={method.startsWith("percent") ? "10" : "5.00"}
                                min={0}
                                step={method.startsWith("percent") ? "1" : "0.01"}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Preview Toggle */}
                    {isValid && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            {showPreview ? "▼ Önizlemeyi Gizle" : "▶ Önizlemeyi Göster"} (
                            {filtered.length} ürün)
                        </button>
                    )}

                    {/* Preview Table */}
                    {showPreview && isValid && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                            Ürün
                                        </th>
                                        {(targetField === "price" || targetField === "both") && (
                                            <>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                                    Satış (Eski)
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-green-600">
                                                    Satış (Yeni)
                                                </th>
                                            </>
                                        )}
                                        {(targetField === "cost" || targetField === "both") && (
                                            <>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                                    Alış (Eski)
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-green-600">
                                                    Alış (Yeni)
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {preview.map((p) => (
                                        <tr key={p.barcode} className="hover:bg-gray-50">
                                            <td className="px-4 py-1.5 text-gray-800 truncate max-w-[150px]">
                                                {p.name}
                                            </td>
                                            {(targetField === "price" || targetField === "both") && (
                                                <>
                                                    <td className="px-3 py-1.5 text-right text-gray-500">
                                                        ₺{p.oldPrice.toLocaleString("tr-TR")}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-semibold text-green-600">
                                                        ₺{p.newPrice.toLocaleString("tr-TR")}
                                                    </td>
                                                </>
                                            )}
                                            {(targetField === "cost" || targetField === "both") && (
                                                <>
                                                    <td className="px-3 py-1.5 text-right text-gray-500">
                                                        ₺{p.oldCost.toLocaleString("tr-TR")}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-semibold text-green-600">
                                                        ₺{p.newCost.toLocaleString("tr-TR")}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Confirm Card */}
                {showConfirm && (
                    <div className="px-6 py-4 bg-amber-50 border-t border-amber-200 shrink-0">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 mb-1">Emin misiniz?</p>
                                <p className="text-sm text-gray-700">
                                    <strong>{selectedSupplier}</strong> toptancısına ait{" "}
                                    <strong>{filtered.length}</strong> ürünün{" "}
                                    {targetField === "price"
                                        ? "satış fiyatı"
                                        : targetField === "cost"
                                            ? "alış fiyatı"
                                            : "satış ve alış fiyatı"}{" "}
                                    {method === "percent_up"
                                        ? `%${amount} artırılacak`
                                        : method === "percent_down"
                                            ? `%${amount} azaltılacak`
                                            : method === "fixed_up"
                                                ? `₺${amount} artırılacak`
                                                : `₺${amount} azaltılacak`}
                                    . Bu işlem geri alınamaz.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isApplying}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={handleApply}
                                        disabled={isApplying}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all"
                                    >
                                        {isApplying ? "⏳ Uygulanıyor..." : "✅ Evet, Uygula"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isApplying}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={() => {
                            setShowConfirm(true);
                            setShowPreview(true);
                        }}
                        disabled={!isValid || isApplying || showConfirm}
                        className={`flex-1 py-3 font-semibold rounded-xl active:scale-95 transition-all ${isValid && !isApplying && !showConfirm
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {`✅ ${filtered.length} Ürüne Uygula`}
                    </button>
                </div>
            </div>
        </div>
    );
}
