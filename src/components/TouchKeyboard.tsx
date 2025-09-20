import { useState } from "react";

type TouchKeyboardProps = {
  value: number;
  onChange: (next: number) => void;
  onDone: () => void;
  onClose: () => void;
  onlyNumbers?: boolean;
};

const LETTER_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const SYMBOL_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["@", "#", "₺", "$", "%", "&", "*", "-", "+"],
  ["(", ")", "!", "?", "/", ":", ";", "'", '"'],
];

export default function TouchKeyboard({
  value,
  onChange,
  onDone,
  onClose,
  onlyNumbers = false,
}: TouchKeyboardProps) {
  const [caps, setCaps] = useState<boolean>(false);
  const [symbols, setSymbols] = useState<boolean>(false);

  function press(char: string) {
    onChange(Number(value + (caps && !symbols ? char.toUpperCase() : char)));
  }
  function backspace() {
    onChange(Number(value.toString().slice(0, -1)));
  }
  function space() {
    onChange(Number(value + " "));
  }
  function clear() {
    onChange(0);
  }
  const onCloseNumberKeyboard = () => {
    onChange(1);
    onClose();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl h-3/7">
      <div className="max-w-3xl mx-auto p-2 select-none relative">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCloseNumberKeyboard}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 border-2 border-red-500 shadow-md active:scale-95 transition-transform absolute top-0 right-[-50px] mt-2"
          >
            X
          </button>
        </div>
        {onlyNumbers ? (
          <div className="grid grid-cols-3 gap-2">
            {[..."123456789"].map((num) => (
              <Key key={num} label={num} onClick={() => press(num)} />
            ))}
            <Key label="⌫" onClick={backspace} />
            <Key label="0" onClick={() => press("0")} />
            <Key label="Tamam" primary onClick={onDone} />
          </div>
        ) : symbols ? (
          SYMBOL_ROWS.map((row, idx) => (
            <div key={idx} className="mb-2 flex justify-center gap-1">
              {row.map((k) => (
                <Key key={k} label={k} onClick={() => press(k)} />
              ))}
              {idx === 2 && <Key label="⌫" wide onClick={backspace} />}
            </div>
          ))
        ) : (
          LETTER_ROWS.map((row, idx) => (
            <div key={idx} className="mb-2 flex justify-center gap-1">
              {idx === 2 && (
                <Key
                  label={caps ? "⇧ Büyük" : "⇧ Küçük"}
                  wide
                  onClick={() => setCaps((v) => !v)}
                  caps={caps}
                />
              )}
              {row.map((k) => (
                <Key
                  key={k}
                  label={caps ? k.toUpperCase() : k}
                  onClick={() => press(k)}
                />
              ))}
              {idx === 2 && <Key label="⌫" wide onClick={backspace} />}
            </div>
          ))
        )}
        {!onlyNumbers && (
          <div className="flex gap-1">
            <Key
              label="Temizle"
              onClick={clear}
              className="bg-red-500 text-white border-red-500 hover:bg-red-600"
            />
            <Key
              label={symbols ? "ABC" : "123"}
              onClick={() => setSymbols((v) => !v)}
            />
            <Key label="Boşluk" extraWide onClick={space} />
            <Key label="Tamam" wide primary onClick={onDone} />
          </div>
        )}
      </div>
    </div>
  );
}

function Key({
  label,
  onClick,
  wide,
  extraWide,
  primary,
  caps,
  className = "",
}: {
  label: string;
  onClick: () => void;
  wide?: boolean;
  extraWide?: boolean;
  primary?: boolean;
  caps?: boolean;
  className?: string;
}) {
  const base: string =
    "px-3 py-3 rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform border-2";
  const colors: string = primary
    ? "bg-green-600 text-white border-green-600"
    : caps && label.toLowerCase() === "büyük"
    ? "bg-blue-500 text-white border-blue-500"
    : "bg-gray-200 text-gray-800 border-gray-300";
  const width: string = extraWide ? "flex-[3]" : wide ? "flex-[1.5]" : "flex-1";

  return (
    <button
      type="button"
      className={`${base} ${colors} ${width} min-h-[64px] ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
