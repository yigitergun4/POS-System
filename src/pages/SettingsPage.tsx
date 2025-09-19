import Navbar from "../components/Navbar";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Ayarlar" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Ayarlar</h1>
        <p>Ayarlar sayfasına hoş geldiniz.</p>
      </div>
    </div>
  );
}
