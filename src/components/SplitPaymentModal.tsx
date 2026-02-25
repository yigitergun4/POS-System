import { useState, useEffect } from "react";
import type { SplitPaymentModalProps } from "../types/components";

export default function SplitPaymentModal({
    total,
    onConfirm,
    onClose,
}: SplitPaymentModalProps) {
    const [cashAmount, setCashAmount] = useState<string>("");
    const [cardAmount, setCardAmount] = useState<number>(total);

    useEffect(() => {
        const cash: number = parseFloat(cashAmount) || 0;
        setCardAmount(Math.max(total - cash, 0));
    }, [cashAmount, total]);

    const cashNum: number = parseFloat(cashAmount) || 0;
    const isValid: boolean = cashNum > 0 && cashNum < total;

    const handleConfirm: () => void = () => {
        if (!isValid) return;
        onConfirm(cashNum, cardAmount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        ✂️ Bölüşümlü Ödeme
                    </h2>
                    <p className="text-amber-100 text-sm mt-1">
                        Toplam tutarı nakit ve kart olarak bölün
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Total Display */}
                    <div className="text-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Toplam Tutar</p>
                        <p className="text-3xl font-bold text-gray-900">
                            ₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Cash Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            💵 Nakit Tutar
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                ₺
                            </span>
                            <input
                                type="number"
                                value={cashAmount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setCashAmount(e.target.value)
                                }
                                placeholder="0.00"
                                min={0}
                                max={total}
                                step="0.01"
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Card Amount (auto-calculated) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            💳 Kart Tutar
                        </label>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-700">
                                ₺
                                {cardAmount.toLocaleString("tr-TR", {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                            <span className="text-xs text-blue-500 font-medium">
                                Otomatik hesaplandı
                            </span>
                        </div>
                    </div>

                    {/* Visual Split Bar */}
                    {cashNum > 0 && (
                        <div className="space-y-2">
                            <div className="flex rounded-full overflow-hidden h-4 bg-gray-200">
                                <div
                                    className="bg-green-500 transition-all duration-300"
                                    style={{ width: `${(cashNum / total) * 100}%` }}
                                />
                                <div
                                    className="bg-blue-500 transition-all duration-300"
                                    style={{ width: `${(cardAmount / total) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                    💵 %{((cashNum / total) * 100).toFixed(0)} Nakit
                                </span>
                                <span>
                                    💳 %{((cardAmount / total) * 100).toFixed(0)} Kart
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Validation Message */}
                    {cashAmount !== "" && !isValid && (
                        <p className="text-sm text-red-500 font-medium text-center">
                            Nakit tutar 0'dan büyük ve toplam tutardan küçük olmalıdır
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={`flex-1 py-3 font-semibold rounded-xl active:scale-95 transition-all ${isValid
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        ✅ Onayla
                    </button>
                </div>
            </div>
        </div>
    );
}
