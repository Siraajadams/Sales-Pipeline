"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
  created_at?: string;
};

const stages = [
  "Lead",
  "Contact Made",
  "Proposal Made",
  "Negotiation",
  "Won",
  "Lost",
];

const types = [
  { value: "prospect", label: "Prospect" },
  { value: "new_client", label: "New Client" },
  { value: "existing_client", label: "Existing Client" },
  { value: "doctor_site", label: "Doctor Site" },
  { value: "vacant_site", label: "Vacant Site" },
  { value: "pillsquad", label: "PillSquad" },
];

export default function SalesDashboardPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({
    type: "prospect",
    name: "",
    contact_person: "",
    service: "",
    value: "",
    monthly_turnover: "",
    status: "Active",
    stage: "Lead",
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
      setMessage("Please enter a client or prospect name.");
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
      stage: "Lead",
      site_name: "",
      region: "",
      notes: "",
    });

    setMessage("Record saved successfully.");
    loadData();
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.service?.toLowerCase().includes(search.toLowerCase()) ||
        item.region?.toLowerCase().includes(search.toLowerCase()) ||
        item.contact_person?.toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType === "all" || item.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const proposalValue = items.reduce((sum, i) => sum + Number(i.value || 0), 0);
  const monthlyTurnover = items.reduce(
    (sum, i) => sum + Number(i.monthly_turnover || 0),
    0
  );

  const prospects = items.filter((i) => i.type === "prospect");
  const newClients = items.filter((i) => i.type === "new_client");
  const existingClients = items.filter((i) => i.type === "existing_client");
  const doctorSites = items.filter((i) => i.type === "doctor_site");
  const vacantSites = items.filter((i) => i.type === "vacant_site");
  const pillsquad = items.filter((i) => i.type === "pillsquad");

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-950 text-white hidden md:flex flex-col p-5">
        <h1 className="text-2xl font-bold mb-8">Sales Pipeline</h1>

        {["Dashboard", "Deals", "Clients", "Activities", "Sites", "Reports"].map(
          (item) => (
            <div
              key={item}
              className="px-4 py-3 rounded-xl mb-2 hover:bg-slate-800 cursor-pointer"
            >
              {item}
            </div>
          )
        )}
      </aside>

      <section className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Commercial Dashboard
            </h2>
            <p className="text-slate-600">
              Prospects, proposals, doctor sites, turnover and PillSquad progress.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              className="border rounded-xl px-4 py-3 w-full md:w-72"
              placeholder="Search pipeline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border rounded-xl px-4 py-3"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Kpi title="Pipeline Value" value={`R ${proposalValue.toLocaleString()}`} />
          <Kpi title="Monthly Turnover" value={`R ${monthlyTurnover.toLocaleString()}`} />
          <Kpi title="Prospects" value={prospects.length} />
          <Kpi title="Active Clients" value={existingClients.length + newClients.length} />
          <Kpi title="Doctor Sites" value={doctorSites.length} />
          <Kpi title="Vacant Sites" value={vacantSites.length} />
          <Kpi title="PillSquad Progress" value={pillsquad.length} />
          <Kpi title="New Clients" value={newClients.length} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section className="xl:col-span-2 bg-white rounded-2xl shadow p-5">
            <h3 className="text-xl font-bold mb-4">Pipeline Board</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {stages.map((stage) => {
                const stageItems = filteredItems.filter(
                  (i) => (i.stage || "Lead") === stage
                );

                const stageValue = stageItems.reduce(
                  (sum, i) => sum + Number(i.value || 0),
                  0
                );

                return (
                  <div key={stage} className="bg-slate-100 rounded-2xl p-3">
                    <div className="mb-3">
                      <p className="font-bold text-slate-800">{stage}</p>
                      <p className="text-xs text-slate-500">
                        R {stageValue.toLocaleString()} · {stageItems.length} deal
                      </p>
                    </div>

                    <div className="space-y-3">
                      {stageItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-3 border shadow-sm"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">{item.service}</p>
                          <p className="text-sm font-bold mt-2">
                            R {Number(item.value || 0).toLocaleString()}
                          </p>
                          <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {item.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-xl font-bold mb-4">Add New Record</h3>

            <div className="space-y-3">
              <select
                className="border rounded-xl p-3 w-full"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Client / Prospect Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Contact Person"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
              />

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Service e.g. Videomed, PillSquad"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              />

              <select
                className="border rounded-xl p-3 w-full"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Proposal Value"
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Monthly Turnover"
                type="number"
                value={form.monthly_turnover}
                onChange={(e) =>
                  setForm({ ...form, monthly_turnover: e.target.value })
                }
              />

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Site Name"
                value={form.site_name}
                onChange={(e) =>
                  setForm({ ...form, site_name: e.target.value })
                }
              />

              <input
                className="border rounded-xl p-3 w-full"
                placeholder="Region"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />

              <textarea
                className="border rounded-xl p-3 w-full"
                placeholder="Notes / next action"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <button
                onClick={saveItem}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Save Record
              </button>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl shadow p-5">
          <h3 className="text-xl font-bold mb-4">All Records</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Value</th>
                  <th className="p-3 text-left">Monthly</th>
                  <th className="p-3 text-left">Stage</th>
                  <th className="p-3 text-left">Region</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">{item.type}</td>
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3">{item.service}</td>
                    <td className="p-3">
                      R {Number(item.value || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      R {Number(item.monthly_turnover || 0).toLocaleString()}
                    </td>
                    <td className="p-3">{item.stage}</td>
                    <td className="p-3">{item.region}</td>
                    <td className="p-3">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow border-l-4 border-orange-500">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
    </div>
  );
}
