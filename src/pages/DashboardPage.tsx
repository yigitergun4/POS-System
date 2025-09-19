import Navbar from "../components/Navbar";

export default function DashboardPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar pageTitle="Raporlar" />
			<div className="p-6">
				<h1 className="text-2xl font-semibold mb-2">Raporlar ve Analizler</h1>
				<p>Welcome to DashboardPage.</p>
			</div>
		</div>
	)
} 