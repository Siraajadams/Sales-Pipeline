"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SalesItem = {
  id: string;
  type: string;
  name: string;
  contact_person: string;
  service: string;
  value: number;
  monthly_turnover: number;
  status: string;
  stage: string;
  site_name: string;
  region: string;
  notes: string;
};

export default function SalesDashboardPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    type: "prospect",
    name: "",
    contact_person: "",
    service: "",
    value: "",
    monthly_turnover: "",
    status: "Active",
    stage: "",
    site_name: "",
    region: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("sales_dashboard")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems(data || []);
  }

  async function saveItem() {
    setMessage("");

    if (!form.name) {
      setMessage("Please enter a name.");
      return;
    }

    const { error } = await supabase.from("sales_dashboard").insert({
      ...form,
      value: Number(form.value || 0),
      monthly_turnover: Number(form.monthly_turnover || 0),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm({
      type: "prospect",
      name: "",
      contact_person: "",
      service: "",
      value: "",
      monthly_turnover: "",
      status: "Active",
      stage: "",
      site_name: "",
      region: "",
      notes: "",
    });

    setMessage("Saved successfully.");
    loadData();
  }

  const prospects = items.filter((i) => i.type === "prospect");
  const newClients = items.filter((i) => i.type === "new_client");
  const existingClients = items.filter((i) => i.type === "existing_client");
  const doctorSites = items.filter((i) => i.type === "doctor_site");
  const vacantSites = items.filter((i) => i.type === "vacant_site");
  const pillsquad = items.filter((i) => i.type === "pillsquad");

  const proposalValue = items.reduce((sum, i) => sum + Number(i.value || 0), 0);
  const monthlyTurnover = items.reduce(
    (sum, i) => sum + Number(i.monthly_turnover || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Sales Dashboard
        </h1>

        <p className="text-slate-600 mb-6">
          Track prospects, clients, proposal value, monthly turnover, doctor
          sites, vacant sites and PillSquad progress.
        </p>

        {message && (
          <div className="mb-4 rounded-xl bg-white p-4 border">
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card title="Prospects" value={prospects.length} />
          <Card title="New Clients" value={newClients.length} />
          <Card title="Existing Clients" value={existingClients.length} />
          <Card title="Proposal Value" value={`R ${proposalValue.toLocaleString()}`} />
          <Card title="Monthly Turnover" value={`R ${monthlyTurnover.toLocaleString()}`} />
          <Card title="Current Doctor Sites" value={doctorSites.length} />
          <Card title="Vacant Sites" value={vacantSites.length} />
          <Card title="PillSquad Records" value={pillsquad.length} />
        </section>

        <section className="bg-white rounded-2xl p-6 shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Sales Record</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="border rounded-xl p-3"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="prospect">Prospect</option>
              <option value="new_client">New Client</option>
              <option value="existing_client">Existing Client</option>
              <option value="doctor_site">Current Doctor Site</option>
              <option value="vacant_site">Vacant Site</option>
              <option value="pillsquad">PillSquad Progress</option>
            </select>

            <input
              className="border rounded-xl p-3"
              placeholder="Client / Prospect Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Contact Person"
              value={form.contact_person}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Service e.g. Videomed, PillSquad, Carepon"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Proposal Value"
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Current Monthly Turnover"
              type="number"
              value={form.monthly_turnover}
              onChange={(e) =>
                setForm({ ...form, monthly_turnover: e.target.value })
              }
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Stage e.g. Lead, Proposal, Won"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Site Name"
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            />

            <input
              className="border rounded-xl p-3"
              placeholder="Region"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />

            <select
              className="border rounded-xl p-3"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Active</option>
              <option>Pending</option>
              <option>Won</option>
              <option>Lost</option>
              <option>Vacant</option>
              <option>In Progress</option>
            </select>

            <textarea
              className="border rounded-xl p-3 md:col-span-2"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <button
            onClick={saveItem}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Save Record
          </button>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Sales Records</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Proposal Value</th>
                  <th className="p-3 text-left">Monthly Turnover</th>
                  <th className="p-3 text-left">Stage</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Region</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.service}</td>
                    <td className="p-3">R {Number(item.value || 0).toLocaleString()}</td>
                    <td className="p-3">R {Number(item.monthly_turnover || 0).toLocaleString()}</td>
                    <td className="p-3">{item.stage}</td>
                    <td className="p-3">{item.status}</td>
                    <td className="p-3">{item.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
    </div>
  );
}
