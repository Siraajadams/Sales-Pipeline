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
] as const;

const openStages = [
  "Lead",
  "Contact Made",
  "Proposal Made",
  "Negotiation",
];

const types = [
  { value: "prospect", label: "Prospect" },
  { value: "new_client", label: "New Client" },
  { value: "existing_client", label: "Existing Client" },
  { value: "doctor_site", label: "Doctor Site" },
  { value: "vacant_site", label: "Vacant Site" },
  { value: "pillsquad", label: "PillSquad" },
];

function isOpenItem(item: SalesItem) {
  return openStages.includes(item.stage || "Lead");
}

function getStatusForStage(stage: string) {
  if (stage === "Won") return "Won";
  if (stage === "Lost") return "Lost";
  return "Active";
}

function formatCurrency(value: number) {
  return `R ${Math.round(value || 0).toLocaleString("en-ZA")}`;
}

export default function SalesDashboardPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    void loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    await Promise.all([loadData(), loadActivities()]);
    setLoading(false);
  }

  async function loadData() {
    const { data, error } = await supabase
      .from("sales_dashboard")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((data || []) as SalesItem[]);
  }

  async function loadActivities() {
    const { data, error } = await supabase
      .from("sales_activities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivities((data || []) as Activity[]);
  }

  async function saveItem() {
    setMessage("");

    const cleanName = form.name.trim();

    if (!cleanName) {
      setMessage("Please enter a client or prospect name.");
      return;
    }

    const stage = form.stage || "Lead";

    const { error } = await supabase.from("sales_dashboard").insert({
      ...form,
      name: cleanName,
      stage,
      status: getStatusForStage(stage),
      value: Number(form.value || 0),
      monthly_turnover: Number(form.monthly_turnover || 0),
      probability: Math.min(100, Math.max(0, Number(form.probability || 0))),
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

    await loadData();
  }

  async function saveActivity() {
    setMessage("");

    if (!activityForm.subject.trim()) {
      setMessage("Please enter an activity subject.");
      return;
    }

    const { error } = await supabase.from("sales_activities").insert({
      ...activityForm,
      subject: activityForm.subject.trim(),
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

    await loadActivities();
  }

  async function updateLeadStage(id: string, newStage: string) {
    setMessage("");
    setSavingId(id);

    const previousItems = items;

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: newStage,
              status: getStatusForStage(newStage),
            }
          : item
      )
    );

    const { error } = await supabase
      .from("sales_dashboard")
      .update({
        stage: newStage,
        status: getStatusForStage(newStage),
      })
      .eq("id", id);

    if (error) {
      setItems(previousItems);
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage(
      newStage === "Lost"
        ? "Prospect moved to Lost. Pipeline totals have decreased."
        : newStage === "Won"
        ? "Deal moved to Won. It has been removed from the open pipeline."
        : "Deal moved back into the active pipeline. Totals have been updated."
    );

    setSavingId(null);
    await loadData();
  }

  function startEditingName(item: SalesItem) {
    setEditingId(item.id);
    setEditingName(item.name || "");
  }

  function cancelEditingName() {
    setEditingId(null);
    setEditingName("");
  }

  async function updateProspectName(id: string) {
    const cleanName = editingName.trim();

    if (!cleanName) {
      setMessage("The prospect or client name cannot be empty.");
      return;
    }

    setSavingId(id);

    const { error } = await supabase
      .from("sales_dashboard")
      .update({ name: cleanName })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, name: cleanName } : item
      )
    );

    setEditingId(null);
    setEditingName("");
    setSavingId(null);
    setMessage("Prospect name updated successfully.");
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sales record?"
    );

    if (!confirmed) return;

    setMessage("");
    setSavingId(id);

    const { error } = await supabase
      .from("sales_dashboard")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setSavingId(null);
    setMessage("Record deleted successfully.");
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name?.toLowerCase().includes(normalizedSearch) ||
        item.service?.toLowerCase().includes(normalizedSearch) ||
        item.region?.toLowerCase().includes(normalizedSearch) ||
        item.contact_person?.toLowerCase().includes(normalizedSearch) ||
        item.assigned_to?.toLowerCase().includes(normalizedSearch);

      const matchesType = filterType === "all" || item.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const dashboard = useMemo(() => {
    const activeItems = items.filter(isOpenItem);
    const wonItems = items.filter((item) => item.stage === "Won");
    const lostItems = items.filter((item) => item.stage === "Lost");

    const pipelineValue = activeItems.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );

    const monthlyTurnover = activeItems.reduce(
      (sum, item) => sum + Number(item.monthly_turnover || 0),
      0
    );

    const weightedForecast = activeItems.reduce(
      (sum, item) =>
        sum +
        Number(item.value || 0) *
          (Math.min(100, Math.max(0, Number(item.probability || 0))) / 100),
      0
    );

    return {
      activeItems,
      wonItems,
      lostItems,
      pipelineValue,
      monthlyTurnover,
      weightedForecast,
      prospects: activeItems.filter((item) => item.type === "prospect"),
      newClients: activeItems.filter((item) => item.type === "new_client"),
      existingClients: activeItems.filter(
        (item) => item.type === "existing_client"
      ),
      doctorSites: activeItems.filter((item) => item.type === "doctor_site"),
      vacantSites: activeItems.filter((item) => item.type === "vacant_site"),
      pillsquad: activeItems.filter((item) => item.type === "pillsquad"),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col p-5 fixed left-0 top-0 bottom-0">
        <h1 className="text-2xl font-bold mb-8">Sales Pipeline</h1>

        <div className="space-y-2">
          {[
            { label: "Dashboard", href: "#dashboard" },
            { label: "Deals", href: "#deals" },
            { label: "Clients", href: "#clients" },
            { label: "Activities", href: "#activities" },
            { label: "Sites", href: "#sites" },
            { label: "Reports", href: "#reports" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block px-4 py-3 rounded-xl hover:bg-slate-800 transition"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="mt-auto text-xs text-slate-400">
          Videomed · PillSquad · Carepon
        </div>
      </aside>

      <section className="flex-1 p-6 md:ml-64">
        <div
          id="dashboard"
          className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Commercial Dashboard
            </h2>
            <p className="text-slate-600">
              Pipeline, proposals, client value, doctor sites and PillSquad
              progress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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

        {loading ? (
          <div className="mb-6 rounded-xl bg-white p-5 shadow">
            Loading dashboard...
          </div>
        ) : (
          <div id="reports" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Kpi
              title="Pipeline Value"
              value={formatCurrency(dashboard.pipelineValue)}
            />
            <Kpi
              title="Weighted Forecast"
              value={formatCurrency(dashboard.weightedForecast)}
            />
            <Kpi
              title="Monthly Turnover"
              value={formatCurrency(dashboard.monthlyTurnover)}
            />
            <Kpi title="Prospects" value={dashboard.prospects.length} />
            <Kpi title="New Clients" value={dashboard.newClients.length} />
            <Kpi
              title="Existing Clients"
              value={dashboard.existingClients.length}
            />
            <Kpi title="Doctor Sites" value={dashboard.doctorSites.length} />
            <Kpi title="Vacant Sites" value={dashboard.vacantSites.length} />
            <Kpi
              title="PillSquad Records"
              value={dashboard.pillsquad.length}
            />
            <Kpi title="Open Deals" value={dashboard.activeItems.length} />
            <Kpi title="Won Deals" value={dashboard.wonItems.length} />
            <Kpi title="Lost Deals" value={dashboard.lostItems.length} />
            <Kpi title="Activities" value={activities.length} />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section
            id="deals"
            className="xl:col-span-2 bg-white rounded-2xl shadow p-5 scroll-mt-6"
          >
            <h3 className="text-xl font-bold mb-4">Pipeline Board</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {stages.map((stage) => {
                const stageItems = filteredItems.filter(
                  (item) => (item.stage || "Lead") === stage
                );

                const stageValue = stageItems.reduce(
                  (sum, item) => sum + Number(item.value || 0),
                  0
                );

                return (
                  <div key={stage} className="bg-slate-100 rounded-2xl p-3">
                    <p className="font-bold text-slate-800">{stage}</p>
                    <p className="text-xs text-slate-500 mb-3">
                      {formatCurrency(stageValue)} · {stageItems.length}{" "}
                      {stageItems.length === 1 ? "deal" : "deals"}
                    </p>

                    <div className="space-y-3">
                      {stageItems.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                          No records
                        </div>
                      )}

                      {stageItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-3 border shadow-sm"
                        >
                          {editingId === item.id ? (
                            <div className="space-y-2">
                              <input
                                className="w-full border rounded-lg p-2 text-sm"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                autoFocus
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={savingId === item.id}
                                  onClick={() => updateProspectName(item.id)}
                                  className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-xs disabled:opacity-50"
                                >
                                  Save name
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditingName}
                                  className="flex-1 bg-slate-200 text-slate-700 rounded-lg py-2 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold break-words">
                                {item.name}
                              </p>

                              <button
                                type="button"
                                onClick={() => startEditingName(item)}
                                className="shrink-0 text-xs text-orange-600 hover:text-orange-700"
                              >
                                Edit
                              </button>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 mt-1">
                            {item.service}
                          </p>

                          <p className="text-sm font-bold mt-2">
                            {formatCurrency(Number(item.value || 0))}
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

                          <select
                            className="w-full mt-3 border rounded-lg p-2 text-xs"
                            value={item.stage || "Lead"}
                            disabled={savingId === item.id}
                            onChange={(e) =>
                              updateLeadStage(item.id, e.target.value)
                            }
                          >
                            {stages.map((stageOption) => (
                              <option key={stageOption} value={stageOption}>
                                Move to {stageOption}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              disabled={
                                savingId === item.id || item.stage === "Won"
                              }
                              onClick={() => updateLeadStage(item.id, "Won")}
                              className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs disabled:opacity-40"
                            >
                              Won
                            </button>

                            <button
                              type="button"
                              disabled={
                                savingId === item.id || item.stage === "Lost"
                              }
                              onClick={() => updateLeadStage(item.id, "Lost")}
                              className="flex-1 bg-red-600 text-white rounded-lg py-2 text-xs disabled:opacity-40"
                            >
                              Lost
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            id="clients"
            className="bg-white rounded-2xl shadow p-5 scroll-mt-6"
          >
            <h3 className="text-xl font-bold mb-4">Add Sales Record</h3>

            <div className="space-y-3">
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Client / Prospect Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                className="input"
                placeholder="Contact Person"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Service e.g. Videomed, PillSquad"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              />

              <select
                className="input"
                value={form.stage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stage: e.target.value,
                    status: getStatusForStage(e.target.value),
                  })
                }
              >
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Proposal Value"
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />

              <input
                className="input"
                placeholder="Monthly Turnover"
                type="number"
                min="0"
                value={form.monthly_turnover}
                onChange={(e) =>
                  setForm({ ...form, monthly_turnover: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Probability %"
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) =>
                  setForm({ ...form, probability: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Lead Source"
                value={form.lead_source}
                onChange={(e) =>
                  setForm({ ...form, lead_source: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Assigned To"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm({ ...form, assigned_to: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Site Name"
                value={form.site_name}
                onChange={(e) =>
                  setForm({ ...form, site_name: e.target.value })
                }
              />

              <input
                className="input"
                placeholder="Region"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />

              <label className="text-sm text-slate-600">
                Expected Close Date
              </label>

              <input
                className="input"
                type="date"
                value={form.expected_close_date}
                onChange={(e) =>
                  setForm({ ...form, expected_close_date: e.target.value })
                }
              />

              <label className="text-sm text-slate-600">
                Last Contact Date
              </label>

              <input
                className="input"
                type="date"
                value={form.last_contact_date}
                onChange={(e) =>
                  setForm({ ...form, last_contact_date: e.target.value })
                }
              />

              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <input
                className="input"
                placeholder="Next Action"
                value={form.next_action}
                onChange={(e) =>
                  setForm({ ...form, next_action: e.target.value })
                }
              />

              <textarea
                className="input"
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <button
                type="button"
                onClick={saveItem}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Save Record
              </button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <section
            id="activities"
            className="bg-white rounded-2xl shadow p-5 scroll-mt-6"
          >
            <h3 className="text-xl font-bold mb-4">Add Activity</h3>

            <div className="space-y-3">
              <select
                className="input"
                value={activityForm.sales_id}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    sales_id: e.target.value,
                  })
                }
              >
                <option value="">No linked record</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                value={activityForm.activity_type}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    activity_type: e.target.value,
                  })
                }
              >
                <option>Call</option>
                <option>Meeting</option>
                <option>Email</option>
                <option>Task</option>
                <option>Deadline</option>
              </select>

              <input
                className="input"
                placeholder="Subject"
                value={activityForm.subject}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    subject: e.target.value,
                  })
                }
              />

              <label className="text-sm text-slate-600">Due Date</label>

              <input
                className="input"
                type="date"
                value={activityForm.due_date}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    due_date: e.target.value,
                  })
                }
              />

              <select
                className="input"
                value={activityForm.priority}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    priority: e.target.value,
                  })
                }
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <textarea
                className="input"
                placeholder="Activity Notes"
                value={activityForm.notes}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    notes: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={saveActivity}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold"
              >
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
                  {activities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        No activities recorded.
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-3">{activity.activity_type}</td>
                        <td className="p-3 font-semibold">
                          {activity.subject}
                        </td>
                        <td className="p-3">{activity.due_date || "—"}</td>
                        <td className="p-3">{activity.priority}</td>
                        <td className="p-3">{activity.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section
          id="sites"
          className="bg-white rounded-2xl shadow p-5 scroll-mt-6"
        >
          <h3 className="text-xl font-bold mb-4">All Records / Sites</h3>

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
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-6 text-center text-slate-500"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="p-3">{item.type}</td>

                      <td className="p-3 font-semibold min-w-56">
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <input
                              className="border rounded-lg px-2 py-1 min-w-36"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                            />

                            <button
                              type="button"
                              onClick={() => updateProspectName(item.id)}
                              className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditingName}
                              className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <button
                              type="button"
                              onClick={() => startEditingName(item)}
                              className="text-orange-600 text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">{item.service}</td>
                      <td className="p-3">
                        {formatCurrency(Number(item.value || 0))}
                      </td>
                      <td className="p-3">
                        {formatCurrency(Number(item.monthly_turnover || 0))}
                      </td>

                      <td className="p-3 min-w-40">
                        <select
                          className="border rounded-lg px-2 py-1"
                          value={item.stage || "Lead"}
                          disabled={savingId === item.id}
                          onChange={(e) =>
                            updateLeadStage(item.id, e.target.value)
                          }
                        >
                          {stages.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">{item.probability || 0}%</td>
                      <td className="p-3">{item.next_action || "—"}</td>
                      <td className="p-3">{item.assigned_to || "—"}</td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2 min-w-52">
                          <button
                            type="button"
                            disabled={
                              savingId === item.id || item.stage === "Won"
                            }
                            onClick={() => updateLeadStage(item.id, "Won")}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-40"
                          >
                            Won
                          </button>

                          <button
                            type="button"
                            disabled={
                              savingId === item.id || item.stage === "Lost"
                            }
                            onClick={() => updateLeadStage(item.id, "Lost")}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-40"
                          >
                            Lost
                          </button>

                          <button
                            type="button"
                            disabled={savingId === item.id}
                            onClick={() => deleteRecord(item.id)}
                            className="bg-slate-700 text-white px-3 py-1 rounded-lg text-xs disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

function Kpi({
  title,
  value,
}: {
  title: string | number;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow border-l-4 border-orange-500">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
    </div>
  );
}
