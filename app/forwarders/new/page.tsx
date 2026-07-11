"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, FREIGHT_MODES, EMPLOYEE_RANGES } from "@/lib/format";

type ServiceRow = { id: number; slug: string; name: string };
type LaneRow = { origin: string; destination: string; mode: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const inputCls =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide";
const labelCls = "font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45";

export default function NewForwarderPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [hqCountry, setHqCountry] = useState("Kenya");
  const [hqCity, setHqCity] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [lanes, setLanes] = useState<LaneRow[]>([
    { origin: "Kenya", destination: "", mode: "" },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from("services")
        .select("id, slug, name")
        .order("name");
      setServices((data ?? []) as ServiceRow[]);
    })();
  }, [router]);

  function toggleService(id: number) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function setLane(i: number, patch: Partial<LaneRow>) {
    setLanes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (!userId) return;
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const base = {
      owner_id: userId,
      company_name: companyName.trim(),
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      hq_country: hqCountry,
      hq_city: hqCity.trim() || null,
      year_established: yearEstablished ? Number(yearEstablished) : null,
      employee_count: employeeCount || null,
      website: website.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      is_published: true,
    };

    // Insert; on a slug collision, retry once with a random suffix.
    let slug = slugify(companyName) || `forwarder-${Date.now().toString(36)}`;
    let inserted = await supabase
      .from("forwarder_companies")
      .insert({ ...base, slug })
      .select("id, slug")
      .single();

    if (inserted.error && inserted.error.code === "23505") {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      inserted = await supabase
        .from("forwarder_companies")
        .insert({ ...base, slug })
        .select("id, slug")
        .single();
    }
    if (inserted.error || !inserted.data) {
      setSaving(false);
      setError(inserted.error?.message ?? "Could not create the listing.");
      return;
    }
    const forwarderId = inserted.data.id as string;

    if (selectedServices.length > 0) {
      await supabase.from("forwarder_services").insert(
        selectedServices.map((service_id) => ({
          forwarder_id: forwarderId,
          service_id,
        }))
      );
    }

    const laneRows = lanes
      .filter((l) => l.origin && l.destination)
      .map((l) => ({
        forwarder_id: forwarderId,
        origin_country: l.origin,
        destination_country: l.destination,
        modes: l.mode ? [l.mode] : [],
      }));
    if (laneRows.length > 0) {
      await supabase.from("forwarder_lanes").insert(laneRows);
    }

    // Mark this account as a forwarder (non-blocking if it fails).
    await supabase.from("profiles").update({ role: "forwarder" }).eq("id", userId);

    router.push(`/forwarders/${inserted.data.slug}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-mono text-[11px] text-ink/50 hover:text-ink">
          ← Back to directory
        </Link>

        <div className="mt-4 bg-paper border border-ink/10 rounded-2xl overflow-hidden">
          <div className="bg-sea text-paper px-6 py-5 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(120% 120% at 10% 0%, #0B4A54 0%, #062A2E 100%)" }}
            />
            <div className="relative">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
                For forwarders
              </span>
              <h1 className="font-display font-bold text-2xl mt-1">List your company</h1>
              <p className="text-paper/75 text-sm mt-1.5">
                A free listing puts you in the directory. Premium adds RFQ leads on your lanes.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className={labelCls}>Company name *</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="Kesland Freight International" />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Tagline</span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} placeholder="East Africa ocean & project cargo specialists" />
              </label>
              <label className="block">
                <span className={labelCls}>HQ country *</span>
                <select value={hqCountry} onChange={(e) => setHqCountry(e.target.value)} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>HQ city</span>
                <input value={hqCity} onChange={(e) => setHqCity(e.target.value)} className={inputCls} placeholder="Mombasa" />
              </label>
              <label className="block">
                <span className={labelCls}>Year established</span>
                <input type="number" min={1900} max={2026} value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} className={inputCls} placeholder="2014" />
              </label>
              <label className="block">
                <span className={labelCls}>Team size</span>
                <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  {EMPLOYEE_RANGES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className={labelCls}>About the company</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="What you move, which gateways you operate from, what you're known for…" />
            </label>

            <div>
              <span className={labelCls}>Services</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((s) => {
                  const on = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`text-xs rounded-lg px-3 py-1.5 border transition ${
                        on
                          ? "bg-sea text-paper border-sea font-semibold"
                          : "text-ink/70 border-ink/15 hover:bg-mist"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
                {services.length === 0 && (
                  <p className="text-sm text-ink/50">Loading services…</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className={labelCls}>Trade lanes</span>
                <button
                  type="button"
                  onClick={() => setLanes((p) => [...p, { origin: "Kenya", destination: "", mode: "" }])}
                  className="text-xs font-medium text-sea hover:underline"
                >
                  + Add lane
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {lanes.map((lane, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <select value={lane.origin} onChange={(e) => setLane(i, { origin: e.target.value })} className="rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-sm outline-none focus:border-tide">
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select value={lane.destination} onChange={(e) => setLane(i, { destination: e.target.value })} className="rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-sm outline-none focus:border-tide">
                      <option value="">Destination…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select value={lane.mode} onChange={(e) => setLane(i, { mode: e.target.value })} className="rounded-lg border border-ink/15 bg-white px-2.5 py-2 text-sm outline-none focus:border-tide">
                      <option value="">Mode…</option>
                      {FREIGHT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setLanes((p) => p.filter((_, idx) => idx !== i))}
                      disabled={lanes.length === 1}
                      className="text-ink/40 hover:text-coral disabled:opacity-30 text-lg leading-none px-1"
                      aria-label="Remove lane"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Website</span>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://…" />
              </label>
              <label className="block">
                <span className={labelCls}>Business email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="ops@company.com" />
              </label>
              <label className="block">
                <span className={labelCls}>Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+254 7…" />
              </label>
              <label className="block">
                <span className={labelCls}>WhatsApp</span>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} placeholder="+254 7…" />
              </label>
            </div>

            {error && <p className="text-sm text-coral">{error}</p>}

            <button
              onClick={submit}
              disabled={saving || !companyName.trim()}
              className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish listing — free"}
            </button>
            <p className="text-xs text-ink/45 text-center">
              Your listing goes live in the directory immediately. Upgrade to Premium anytime to receive RFQ leads.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
