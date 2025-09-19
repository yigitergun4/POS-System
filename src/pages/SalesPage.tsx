import Navbar from "../components/Navbar";

export default function SalesPage() {

  return (
    <div className="min-h-screen bg-gray-50">
	<Navbar pageTitle="Satış" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Hoş geldiniz 👋</h1>
        <p>Burada satış ekranı olacak.</p>
      </div>
    </div>
  );
}
