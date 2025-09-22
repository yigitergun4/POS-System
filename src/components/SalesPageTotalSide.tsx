import PaymentButton from "./SalesPagePaymentButton";
import TotalCard from "./SalesPageTotalCard";

interface SalesPageTotalSideProps {
  total: number;
  onCashPayment?: () => void;
  onCardPayment?: () => void;
  onClearCart?: () => void; // ✅ sepeti silme fonksiyonu
}

export default function SalesPageTotalSide({
  total,
  onCashPayment,
  onCardPayment,
  onClearCart,
}: SalesPageTotalSideProps) {
  return (
    <div className="w-1/4 bg-gray-50 border-l border-gray-200 flex justify-end flex-col p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Ödeme Özeti</h2>
      <TotalCard total={total} />
      <div className="space-y-3">
        <PaymentButton
          label="💵 Nakit Ödeme"
          color="green"
          onClick={onCashPayment}
        />
        <PaymentButton
          label="💳 Kart ile Ödeme"
          color="blue"
          onClick={onCardPayment}
        />
      </div>
      <div className="mt-6">
        <button
          onClick={onClearCart}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-transform"
        >
          Sepeti Temizle
        </button>
      </div>
      <div className="mt-auto flex justify-end items-center text-center text-sm text-gray-500">
        Satışı tamamlamak için ödeme yöntemini seçiniz
      </div>
    </div>
  );
}
