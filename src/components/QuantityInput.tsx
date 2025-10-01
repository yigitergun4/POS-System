import { useState } from "react";
import TouchKeyboard from "./TouchKeyboard";

export default function QuantityInput({
  qty,
  setQty,
}: {
  qty: number;
  setQty: (qty: number) => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const clickHandler = (): void => {
    setQty(0);
    setOpen(true);
  };
  return (
    <div>
      <div
        className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-lg font-bold bg-white shadow cursor-pointer"
        onClick={clickHandler}
      >
        {qty.toString()}
      </div>
      {open && (
        <TouchKeyboard
          value={qty}
          onChange={setQty}
          onDone={() => setOpen(false)}
          onClose={() => setOpen(false)}
          onlyNumbers
        />
      )}
    </div>
  );
}
