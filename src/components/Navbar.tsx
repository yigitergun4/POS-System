import { useEffect, useState } from "react";

export default function Navbar({ pageTitle }: { pageTitle: string }) {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(now);
      setDateTime(formatted);
    }

    updateTime(); // ilk yüklemede çalıştır
    const timer = setInterval(updateTime, 60000); // her 1 dk’da güncelle
    return () => clearInterval(timer);
  }, []);
  return (
    <nav className="w-full bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <span className="text-lg font-bold">{pageTitle} Sayfası </span>
      <span className="text-sm font-medium">{dateTime}</span>
    </nav>
  );
}
