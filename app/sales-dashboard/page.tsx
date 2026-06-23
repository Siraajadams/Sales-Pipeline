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
  next_action?: string;
  expected_close_date?: string;
  probability?: number;
  lead_source?: string;
  assigned_to?: string;
  last_contact_date?: string;
  activity_type?: string;
  priority?: string;
  created_at?: string;
};

type Activity = {
  id: string;
  sales_id?: string;
  activity_type: string;
  subject: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
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
  const [activities, setActivities] = useState<Activity[]>([]);
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
    next_action: "",
    expected_close_date: "",
    probability: "0",
    lead_source: "",
    assigned_to: "",
    last_contact_date: "",
    activity_type: "Call",
    priority: "Medium",
  });

  const [activityForm, setActivityForm] = useState({
    sales_id: "",
    activity_type: "Call",
    subject: "",
    due_date: "",
    priority: "Medium",
    status: "Open",
    notes: "",
  });

  useEffect(() => {
    loadData();
    loadActivities();
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

  async function loadActivities() {
    const { data, error } = await supabase
      .from("sales_activities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setActivities(data || []);
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
      probability: Number(form.probability || 0),
      expected_close_date: form.expected_close_date || null,
      last_contact_date: form.last_contact_date || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Record saved successfully.");

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
      next_action: "",
      expected_close_date: "",
      probability: "0",
      lead_source: "",
      assigned_to: "",
      last_contact_date: "",
      activity_type: "Call",
      priority: "Medium",
    });

    loadData();
  }

  async function saveActivity() {
    setMessage("");

    if (!activityForm.subject) {
      setMessage("Please enter an activity subject.");
      return;
    }

    const { error } = await supabase.from("sales_activities").insert({
      ...activityForm,
      sales_id: activityForm.sales_id || null,
      due_date: activityForm.due_date || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Activity saved successfully.");

    setActivityForm({
      sales_id: "",
      activity_type: "Call",
      subject: "",
      due_date: "",
      priority: "Medium",
      status: "Open",
      notes: "",
    });

    loadActivities();
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const s = search.toLowerCase();

      const matchesSearch =
        item.name?.toLowerCase().includes(s) ||
        item.service?.toLowerCase().includes(s) ||
        item.region?.toLowerCase().includes(s) ||
        item.contact_person?.toLowerCase().includes(s) ||
        item.assigned_to?.toLowerCase().includes(s);

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

  const weightedForecast = items.reduce((sum, i) => {
    return sum + Number(i.value || 0) * (Number(i.probability || 0) / 100);
  }, 0);

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col p-5">
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

        <div className="mt-auto text-xs text-slate-400">
          Videomed · PillSquad · Carepon
        </div>
      </aside>

      <section className="flex-1 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Commercial Dashboard
            </h2>
            <p className="text-slate-600">
              Pipeline, proposals, client value, doctor sites and PillSquad
              progress.
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
          <Kpi title="Weighted Forecast" value={`R ${Math.round(weightedForecast).toLocaleString()}`} />
          <Kpi title="Monthly Turnover" value={`R ${monthlyTurnover.toLocaleString()}`} />
          <Kpi title="Prospects" value={prospects.length} />
          <Kpi title="New Clients" value={newClients.length} />
          <Kpi title="Existing Clients" value={existingClients.length} />
          <Kpi title="Doctor Sites" value={doctorSites.length} />
          <Kpi title="Vacant Sites" value={vacantSites.length} />
          <Kpi title="PillSquad Records" value={pillsquad.length} />
          <Kpi title="Activities" value={activities.length} />
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
                    <p className="font-bold text-slate-800">{stage}</p>
                    <p className="text-xs text-slate-500 mb-3">
                      R {stageValue.toLocaleString()} · {stageItems.length} deal
                    </p>

                    <div className="space-y-3">
                      {stageItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-3 border shadow-sm"
                        >
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.service}</p>
                          <p className="text-sm font-bold mt-2">
                            R {Number(item.value || 0).toLocaleString()}
                          </p>
                          <p className="text-xs mt-1">
                            Probability: {item.probability || 0}%
                          </p>
                          <p className="text-xs text-slate-500">
                            Next: {item.next_action || "No next action"}
                          </p>
                          <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {item.priority || "Medium"}
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
            <h3 className="text-xl font-bold mb-4">Add Sales Record</h3>

            <div className="space-y-3">
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <input className="input" placeholder="Client / Prospect Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder="Contact Person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              <input className="input" placeholder="Service e.g. Videomed, PillSquad" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />

              <select className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                {stages.map((s) => <option key={s}>{s}</option>)}
              </select>

              <input className="input" placeholder="Proposal Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              <input className="input" placeholder="Monthly Turnover" type="number" value={form.monthly_turnover} onChange={(e) => setForm({ ...form, monthly_turnover: e.target.value })} />
              <input className="input" placeholder="Probability %" type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />

              <input className="input" placeholder="Lead Source" value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })} />
              <input className="input" placeholder="Assigned To" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
              <input className="input" placeholder="Site Name" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
              <input className="input" placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />

              <label className="text-sm text-slate-600">Expected Close Date</label>
              <input className="input" type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />

              <label className="text-sm text-slate-600">Last Contact Date</label>
              <input className="input" type="date" value={form.last_contact_date} onChange={(e) => setForm({ ...form, last_contact_date: e.target.value })} />

              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <input className="input" placeholder="Next Action" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />

              <textarea className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              <button onClick={saveItem} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold">
                Save Record
              </button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-xl font-bold mb-4">Add Activity</h3>

            <div className="space-y-3">
              <select className="input" value={activityForm.sales_id} onChange={(e) => setActivityForm({ ...activityForm, sales_id: e.target.value })}>
                <option value="">No linked record</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>

              <select className="input" value={activityForm.activity_type} onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}>
                <option>Call</option>
                <option>Meeting</option>
                <option>Email</option>
                <option>Task</option>
                <option>Deadline</option>
              </select>

              <input className="input" placeholder="Subject" value={activityForm.subject} onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })} />

              <label className="text-sm text-slate-600">Due Date</label>
              <input className="input" type="date" value={activityForm.due_date} onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })} />

              <select className="input" value={activityForm.priority} onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value })}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <textarea className="input" placeholder="Activity Notes" value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })} />

              <button onClick={saveActivity} className="w-full bg-slate-950 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold">
                Save Activity
              </button>
            </div>
          </section>

          <section className="xl:col-span-2 bg-white rounded-2xl shadow p-5">
            <h3 className="text-xl font-bold mb-4">Activities</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-left">Due Date</th>
                    <th className="p-3 text-left">Priority</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">{activity.activity_type}</td>
                      <td className="p-3 font-semibold">{activity.subject}</td>
                      <td className="p-3">{activity.due_date}</td>
                      <td className="p-3">{activity.priority}</td>
                      <td className="p-3">{activity.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <th className="p-3 text-left">Probability</th>
                  <th className="p-3 text-left">Next Action</th>
                  <th className="p-3 text-left">Assigned</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">{item.type}</td>
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3">{item.service}</td>
                    <td className="p-3">R {Number(item.value || 0).toLocaleString()}</td>
                    <td className="p-3">R {Number(item.monthly_turnover || 0).toLocaleString()}</td>
                    <td className="p-3">{item.stage}</td>
                    <td className="p-3">{item.probability || 0}%</td>
                    <td className="p-3">{item.next_action}</td>
                    <td className="p-3">{item.assigned_to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <style jsx>{`
          .input {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            padding: 0.75rem;
            outline: none;
          }

          .input:focus {
            border-color: #f97316;
            box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
          }
        `}</style>
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
