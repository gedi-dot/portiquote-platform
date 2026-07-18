"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  COUNTRIES, FREIGHT_MODES, INCOTERMS, CONTAINER_TYPES, IMDG_CLASSES, countryCode, flagEmoji,
} from "@/lib/format";

const inputCls =
  "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide";
const labelCls = "font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45";

export default function NewRfqPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [mode, setMode] = useState("ocean_fcl");
  const [originCountry, setOriginCountry] = useState("Kenya");
  const [originCity, setOriginCity] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destCity, setDestCity] = useState("");
  const [incoterm, setIncoterm] = useState("FOB");
  const [readyDate, setReadyDate] = useState("");
  const [containerType, setContainerType] = useState("40HC");
  const [containerCount, setContainerCount] = useState("1");
  const [weightKg, setWeightKg] = useState("");
  const [volumeCbm, setVolumeCbm] = useState("");
  const [cargo, setCargo] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [hazardous, setHazardous] = useState(false);
  const [imdgClass, setImdgClass] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.replace("/login");
      else setUserId(user.id);
    })();
  }, [router]);

  const isContainerMode = mode === "ocean_fcl";

  async function submit() {
    if (!userId) return;
    if (!destCountry) {
      setError("Destination country is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const modeText = FREIGHT_MODES.find((m) => m.value === mode)?.label ?? mode;
    const cargoBit = isContainerMode
      ? `${containerCount || 1}×${containerType}`
      : modeText;
    const title = `${originCity || originCountry} → ${destCity || destCountry} · ${cargoBit}`;
    const reference = `RFQ-${new Date().getFullYear()}-${Date.now()
      .toString(36)
      .slice(-5)
      .toUpperCase()}`;

    const { data, error: err } = await supabase
      .from("rfqs")
      .insert({
        shipper_id: userId,
        reference,
        title,
        mode,
        origin_country: originCountry,
        origin_city: originCity.trim() || null,
        destination_country: destCountry,
        destination_city: destCity.trim() || null,
        incoterm,
        cargo_description: cargo.trim() || null,
        hs_code: hsCode.trim() || null,
        container_type: isContainerMode ? containerType : null,
        container_count: isContainerMode ? Number(containerCount) || 1 : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        volume_cbm: volumeCbm ? Number(volumeCbm) : null,
        is_hazardous: hazardous,
        imdg_class: hazardous ? imdgClass || null : null,
        ready_date: readyDate || null,
        status: "open",
      })
      .select("id")
      .single();

    if (err || !data) {
      setSaving(false);
      setError(err?.message ?? "Could not post the RFQ.");
      return;
    }
    // Fire-and-forget: email Premium forwarders on this lane.
    fetch("/api/notify/rfq-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfqId: data.id }),
      keepalive: true,
    }).catch(() => {});

    router.push(`/rfq/${data.id}`);
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
                Free for shippers
              </span>
              <h1 className="font-display font-bold text-2xl mt-1">Post a shipment</h1>
              <p className="text-paper/75 text-sm mt-1.5">
                Tell forwarders what you need moved. Premium forwarders on your lane will send
                priced quotes.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <span className={labelCls}>Mode</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FREIGHT_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`text-xs rounded-lg px-3 py-1.5 border transition ${
                      mode === m.value
                        ? "bg-sea text-paper border-sea font-semibold"
                        : "text-ink/70 border-ink/15 hover:bg-mist"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Origin country *</span>
                <select value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} className={inputCls}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{flagEmoji(c)} {c} ({countryCode(c)})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Origin city / port</span>
                <input value={originCity} onChange={(e) => setOriginCity(e.target.value)} className={inputCls} placeholder="Mombasa" />
              </label>
              <label className="block">
                <span className={labelCls}>Destination country *</span>
                <select value={destCountry} onChange={(e) => setDestCountry(e.target.value)} className={inputCls}>
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{flagEmoji(c)} {c} ({countryCode(c)})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Destination city / port</span>
                <input value={destCity} onChange={(e) => setDestCity(e.target.value)} className={inputCls} placeholder="Rotterdam" />
              </label>
              <label className="block">
                <span className={labelCls}>Incoterm</span>
                <select value={incoterm} onChange={(e) => setIncoterm(e.target.value)} className={inputCls}>
                  {INCOTERMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Cargo ready date</span>
                <input type="date" value={readyDate} onChange={(e) => setReadyDate(e.target.value)} className={inputCls} />
              </label>
            </div>

            {isContainerMode && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Container type</span>
                  <select value={containerType} onChange={(e) => setContainerType(e.target.value)} className={inputCls}>
                    {CONTAINER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Count</span>
                  <input type="number" min={1} value={containerCount} onChange={(e) => setContainerCount(e.target.value)} className={inputCls} />
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Gross weight (kg)</span>
                <input type="number" min={0} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputCls} placeholder="18400" />
              </label>
              <label className="block">
                <span className={labelCls}>Volume (CBM)</span>
                <input type="number" min={0} step="0.1" value={volumeCbm} onChange={(e) => setVolumeCbm(e.target.value)} className={inputCls} placeholder="55" />
              </label>
            </div>

            <label className="block">
              <span className={labelCls}>Cargo description</span>
              <textarea value={cargo} onChange={(e) => setCargo(e.target.value)} rows={2} className={inputCls} placeholder="Kiln-dried hardwood furniture, palletised" />
            </label>

            <div className="grid sm:grid-cols-2 gap-3 items-end">
              <label className="block">
                <span className={labelCls}>HS code (optional)</span>
                <input value={hsCode} onChange={(e) => setHsCode(e.target.value)} className={inputCls} placeholder="9403.60" />
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => setHazardous(!hazardous)}
                  className="flex items-center gap-2"
                >
                  <span className={`w-9 h-5 rounded-full relative transition ${hazardous ? "bg-coral" : "bg-ink/15"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hazardous ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                  <span className="text-sm text-ink/70">Dangerous goods (IMDG)</span>
                </button>
                {hazardous && (
                  <select value={imdgClass} onChange={(e) => setImdgClass(e.target.value)} className={inputCls}>
                    <option value="">IMDG class…</option>
                    {IMDG_CLASSES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-coral">{error}</p>}

            <button
              onClick={submit}
              disabled={saving || !destCountry}
              className="w-full bg-saffron hover:brightness-95 transition text-ink font-semibold text-sm rounded-lg py-3 disabled:opacity-50"
            >
              {saving ? "Posting…" : "Post RFQ — forwarders will compete"}
            </button>

            <p className="text-xs text-ink/55 leading-relaxed">
              Premium forwarders covering this route will see your shipment and
              can send you a quote here, with their contact details. Your own
              contact details are not shared. See our{" "}
              <a href="/privacy" className="text-sea underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
