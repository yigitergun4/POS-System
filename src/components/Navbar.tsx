import { useEffect, useState } from "react";

export default function Navbar({ pageTitle }: { pageTitle: string }) {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    function updateTime() {
      const now: Date = new Date();

      const dayName: string = new Intl.DateTimeFormat("tr-TR", {
        weekday: "long",
      }).format(now);

      const datePart: string = new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);

      const timePart: string = new Intl.DateTimeFormat("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);

      const formatted: string = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${datePart} • ${timePart}`;
      setDateTime(formatted);
    }

    updateTime();
    const timer: NodeJS.Timeout = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="w-full bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <span className="text-xl font-bold">{pageTitle} Sayfası</span>
      <span className="text-sm md:text-lg font-semibold">{dateTime}</span>
    </nav>
  );
}
