import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-xl">
        <h1 className="text-5xl font-bold mb-4">
          Sales Pipeline CRM
        </h1>

        <p className="text-slate-600 mb-8">
          Videomed • PillSquad • Carepon • Doctor Sites
        </p>

        <Link
          href="/sales-dashboard"
          className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold"
        >
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
