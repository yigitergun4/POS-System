import PaymentButton from "./SalesPagePaymentButton";
import TotalCard from "./SalesPageTotalCard";

interface SalesPageTotalSideProps {
  total: number;
  onCashPayment?: () => Promise<void>;
  onCardPayment?: () => Promise<void>;
  onClearCart?: () => void;
  onFamilyPayment?: () => void;
  onSplitPayment?: () => void;
}

export default function SalesPageTotalSide({
  total,
  onCashPayment,
  onCardPayment,
  onClearCart,
  onFamilyPayment,
  onSplitPayment,
}: SalesPageTotalSideProps) {
  return (
    <div className="w-1/4 bg-gray-50 border-l border-gray-200 flex flex-col p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Ödeme Özeti</h2>
      <TotalCard total={total} />
      <div className="space-y-3 mt-4">
        <PaymentButton
          label="💵 Nakit Ödeme"
          color="green"
          onClick={onCashPayment}
          disabled={total === 0}
        />
        <PaymentButton
          label="💳 Kart ile Ödeme"
          color="blue"
          onClick={onCardPayment}
          disabled={total === 0}
        />
        <PaymentButton
          label="Aile Hesabı"
          color="gray"
          onClick={onFamilyPayment}
          disabled={total === 0}
        />
        <PaymentButton
          label="✂️ Bölüşümlü Ödeme"
          color="amber"
          onClick={onSplitPayment}
          disabled={total === 0}
        />
      </div>
      <div className="mt-auto space-y-3">
        <PaymentButton
          label="Sepeti Temizle"
          color="red"
          onClick={onClearCart}
        />
        <p className="text-center text-sm text-gray-500">
          Satışı tamamlamak için ödeme yöntemini seçiniz
        </p>
      </div>
    </div>
  );
}

