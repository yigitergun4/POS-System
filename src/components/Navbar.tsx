import { useEffect, useState } from "react";

export default function Navbar({ pageTitle }: { pageTitle: string }) {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    function updateTime() {
      const now: Date = new Date();
      const formatted: string = new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(now);
      setDateTime(formatted);
    }

    updateTime(); // on first load
    const timer = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);
  return (
    <nav className="w-full bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <span className="text-lg font-bold">{pageTitle} Sayfası </span>
      <span className="text-lg font-bold">{dateTime}</span>
    </nav>
  );
}
