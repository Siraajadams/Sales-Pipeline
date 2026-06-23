import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Sales Pipeline
        </h1>

        <p className="text-slate-600 mb-6">
          Welcome to the sales dashboard system.
        </p>

        <Link
          href="/sales-dashboard"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Open Sales Dashboard
        </Link>
      </div>
    </main>
  );
}
