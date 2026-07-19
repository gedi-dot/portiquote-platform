"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, FREIGHT_MODES, EMPLOYEE_RANGES } from "@/lib/format";

type ServiceRow = { id: number; slug: string; name: string };
type LaneRow = { origin: string; destination: string; mode: string };

const inputCls =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide";
const labelCls = "font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45";

export default function EditForwarderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [forwarderId, setForwarderId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);

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
  const [isPublished, setIsPublished] = useState(true);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [lanes, setLanes] = useState<LaneRow[]>([]);

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

      const { data: fwd } = await supabase
        .from("forwarder_companies")
        .select(
          `id, owner_id, company_name, tagline, description, hq_country, hq_city,
           year_established, employee_count, website, email, phone, whatsapp, is_published`
        )
        .eq("slug", slug)
        .maybeSingle();

      // Only the owner may edit; everyone else goes back to the public profile.
      if (!fwd || fwd.owner_id !== user.id) {
        router.replace(`/forwarders/${slug}`);
        return;
      }

      setForwarderId(fwd.id);
      setCompanyName(fwd.company_name ?? "");
      setTagline(fwd.tagline ?? "");
      setDescription(fwd.description ?? "");
      setHqCountry(fwd.hq_country ?? "Kenya");
      setHqCity(fwd.hq_city ?? "");
      setYearEstablished(fwd.year_established ? String(fwd.year_established) : "");
      setEmployeeCount(fwd.employee_count ?? "");
      setWebsite(fwd.website ?? "");
      setEmail(fwd.email ?? "");
      setPhone(fwd.phone ?? "");
      setWhatsapp(fwd.whatsapp ?? "");
      setIsPublished(Boolean(fwd.is_published));

      const [{ data: svcAll }, { data: svcMine }, { data: laneRows }] =
        await Promise.all([
          supabase.from("services").select("id, slug, name").order("name"),
          supabase
            .from("forwarder_services")
            .select("service_id")
            .eq("forwarder_id", fwd.id),
          supabase
            .from("forwarder_lanes")
            .select("origin_country, destination_country, modes")
            .eq("forwarder_id", fwd.id),
        ]);

      setServices((svcAll ?? []) as ServiceRow[]);
      setSelectedServices((svcMine ?? []).map((r) => r.service_id as number));
      const mapped: LaneRow[] = (laneRows ?? []).map((l) => ({
        origin: l.origin_country as string,
        destination: l.destination_country as string,
        mode: Array.isArray(l.modes) && l.modes.length > 0 ? String(l.modes[0]) : "",
      }));
      setLanes(mapped.length > 0 ? mapped : [{ origin: "Kenya", destination: "", mode: "" }]);
      setLoaded(true);
    })();
  }, [router, slug]);

  function toggleService(id: number) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function setLane(i: number, patch: Partial<LaneRow>) {
    setLanes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function save() {
    if (!forwarderId) return;
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: upErr } = await supabase
      .from("forwarder_companies")
      .update({
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
        is_published: isPublished,
      })
      .eq("id", forwarderId);

    if (upErr) {
      setSaving(false);
      setError(upErr.message);
      return;
    }

    // Replace services and lanes wholesale — simple and predictable.
    await supabase.from("forwarder_services").delete().eq("forwarder_id", forwarderId);
    if (selectedServices.length > 0) {
      await supabase.from("forwarder_services").insert(
        selectedServices.map((service_id) => ({ forwarder_id: forwarderId, service_id }))
      );
    }
    await supabase.from("forwarder_lanes").delete().eq("forwarder_id", forwarderId);
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

    router.push(`/forwarders/${slug}`);
    router.refresh();
  }

  if (!loaded) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p className="text-sm text-ink/50">Loading your listing…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/forwarders/${slug}`}
          className="font-mono text-[11px] text-ink/50 hover:text-ink"
        >
          ← Back to your profile
        </Link>

        <div className="mt-4 bg-paper border border-ink/10 rounded-2xl overflow-hidden">
          <div className="bg-sea text-paper px-6 py-5 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 120% at 10% 0%, #0B4A54 0%, #062A2E 100%)",
              }}
            />
            <div className="relative">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
                For forwarders
              </span>
              <h1 className="font-display font-bold text-2xl mt-1">Edit your listing</h1>
              <p className="text-paper/75 text-sm mt-1.5">
                Changes go live in the directory as soon as you save.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className={labelCls}>Company name *</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Tagline</span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
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
                <input value={hqCity} onChange={(e) => setHqCity(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Year established</span>
                <input type="number" min={1900} max={2026} value={yearEstablished} onChange={(e) => setYearEstablished(e.target.value)} className={inputCls} />
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
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
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Business email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>WhatsApp</span>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} />
              </label>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-[#0B4A54]"
              />
              <span className="text-sm text-ink/70">
                Listed in the public directory
              </span>
            </label>

            {error && <p className="text-sm text-coral">{error}</p>}

            <button
              onClick={save}
              disabled={saving || !companyName.trim()}
              className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
