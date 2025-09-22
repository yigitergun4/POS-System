type CartItemControlsProps = {
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export default function CartItemControls({
  qty,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-md font-bold transition"
      >
        ➖
      </button>
      <span className="min-w-[24px] text-center font-semibold text-gray-800">
        {qty}
      </span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-md font-bold transition"
      >
        ➕
      </button>
      <button
        onClick={onRemove}
        className="ml-10 p-2 h-8 flex items-center justify-center text-sm rounded-md font-bold bg-red-500 text-white shadow transition"
      >
        Ürünü Sil
      </button>
    </div>
  );
}
