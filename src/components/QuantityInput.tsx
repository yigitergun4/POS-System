// import TouchKeyboard from "./TouchKeyboard";

export default function QuantityInput({
  qty,
  setQty,
}: {
  qty: number;
  setQty: (qty: number) => void;
}) {
  const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value: string = e.target.value;
    if (value === "") {
      setQty(0);
    } else {
      setQty(Number(value));
    }
  };
  // const [open, setOpen] = useState<boolean>(false);
  const clickHandler: () => void = (): void => {
    setQty(0);
    // setOpen(true);
  };
  return (
    <div>
      <input
        type="text"
        value={qty}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 w-24 text-center"
        placeholder="1"
        onClick={clickHandler}
      />
      {/* <button
        className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-lg font-bold bg-white shadow cursor-pointer"
        onClick={clickHandler}
      >
        {qty.toString()}
      </button> */}
      {/* {open && (
        <TouchKeyboard
          value={qty}
          onChange={setQty}
          onDone={() => setOpen(false)}
          onClose={() => setOpen(false)}
          onlyNumbers
        />
      )} */}
    </div>
  );
}
