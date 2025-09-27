import { useEffect, useState } from "react";

export default function useBarcodeScanner(onScan: (code: string) => void) {
  const [buffer, setBuffer] = useState<string>("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function handleKey(e: KeyboardEvent) {
      clearTimeout(timer);

      if (e.key === "Enter") {
        if (buffer) {
          onScan(buffer);
          setBuffer("");
        }
        return;
      }
      if (/^[0-9a-zA-Z]$/.test(e.key)) {
        setBuffer((prev) => prev + e.key);
      }
      timer = setTimeout(() => setBuffer(""), 300);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [buffer, onScan]);
}
