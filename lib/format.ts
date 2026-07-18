// Country name -> ISO-2 code for compact lane display (KE->NL) and /countries/[code].
const CODES: Record<string, string> = {
  // ---- Africa (all 54) ----
  Algeria: "DZ", Angola: "AO", Benin: "BJ", Botswana: "BW", "Burkina Faso": "BF",
  Burundi: "BI", "Cabo Verde": "CV", Cameroon: "CM", "Central African Republic": "CF",
  Chad: "TD", Comoros: "KM", "Congo (Republic)": "CG", "DR Congo": "CD",
  Djibouti: "DJ", Egypt: "EG", "Equatorial Guinea": "GQ", Eritrea: "ER",
  Eswatini: "SZ", Ethiopia: "ET", Gabon: "GA", Gambia: "GM", Ghana: "GH",
  Guinea: "GN", "Guinea-Bissau": "GW", "Ivory Coast": "CI", Kenya: "KE",
  Lesotho: "LS", Liberia: "LR", Libya: "LY", Madagascar: "MG", Malawi: "MW",
  Mali: "ML", Mauritania: "MR", Mauritius: "MU", Morocco: "MA", Mozambique: "MZ",
  Namibia: "NA", Niger: "NE", Nigeria: "NG", Rwanda: "RW",
  "São Tomé & Príncipe": "ST", Senegal: "SN", Seychelles: "SC",
  "Sierra Leone": "SL", Somalia: "SO", "South Africa": "ZA", "South Sudan": "SS",
  Sudan: "SD", Tanzania: "TZ", Togo: "TG", Tunisia: "TN", Uganda: "UG",
  Zambia: "ZM", Zimbabwe: "ZW",
  // ---- Europe ----
  Albania: "AL", Andorra: "AD", Austria: "AT", Belarus: "BY", Belgium: "BE",
  "Bosnia & Herzegovina": "BA", Bulgaria: "BG", Croatia: "HR", Cyprus: "CY",
  Czechia: "CZ", Denmark: "DK", Estonia: "EE", Finland: "FI", France: "FR",
  Germany: "DE", Greece: "GR", Hungary: "HU", Iceland: "IS", Ireland: "IE",
  Italy: "IT", Latvia: "LV", Liechtenstein: "LI", Lithuania: "LT",
  Luxembourg: "LU", Malta: "MT", Moldova: "MD", Monaco: "MC", Montenegro: "ME",
  Netherlands: "NL", "North Macedonia": "MK", Norway: "NO", Poland: "PL",
  Portugal: "PT", Romania: "RO", Russia: "RU", "San Marino": "SM", Serbia: "RS",
  Slovakia: "SK", Slovenia: "SI", Spain: "ES", Sweden: "SE", Switzerland: "CH",
  Ukraine: "UA", "United Kingdom": "GB",
  // ---- Asia & Middle East ----
  Afghanistan: "AF", Armenia: "AM", Azerbaijan: "AZ", Bahrain: "BH",
  Bangladesh: "BD", Bhutan: "BT", Brunei: "BN", Cambodia: "KH", China: "CN",
  Georgia: "GE", "Hong Kong": "HK", India: "IN", Indonesia: "ID", Iran: "IR",
  Iraq: "IQ", Israel: "IL", Japan: "JP", Jordan: "JO", Kazakhstan: "KZ",
  Kuwait: "KW", Kyrgyzstan: "KG", Laos: "LA", Lebanon: "LB", Malaysia: "MY",
  Maldives: "MV", Mongolia: "MN", Myanmar: "MM", Nepal: "NP", Oman: "OM",
  Pakistan: "PK", Philippines: "PH", Qatar: "QA", "Saudi Arabia": "SA",
  Singapore: "SG", "South Korea": "KR", "Sri Lanka": "LK", Syria: "SY",
  Taiwan: "TW", Tajikistan: "TJ", Thailand: "TH", "Timor-Leste": "TL",
  Turkey: "TR", Turkmenistan: "TM", "U.A.E.": "AE", Uzbekistan: "UZ",
  Vietnam: "VN", Yemen: "YE",
  // ---- Americas & Oceania ----
  "United States": "US", Canada: "CA", Mexico: "MX", Brazil: "BR",
  Australia: "AU", "New Zealand": "NZ",
};

export function countryCode(name: string): string {
  return CODES[name] ?? name.slice(0, 2).toUpperCase();
}

export function countryFromCode(code: string): string | null {
  const upper = code.toUpperCase();
  for (const [name, c] of Object.entries(CODES)) if (c === upper) return name;
  return null;
}

const KEYS = Object.keys(CODES);
const iEU = KEYS.indexOf("Albania");
const iAS = KEYS.indexOf("Afghanistan");
const iAM = KEYS.indexOf("United States");
const AFRICA = KEYS.slice(0, iEU);
const EUROPE = KEYS.slice(iEU, iAS);
const ASIA = KEYS.slice(iAS, iAM);
const AMERICAS_OCEANIA = KEYS.slice(iAM);

export const REGIONS: { name: string; countries: string[] }[] = [
  { name: "Africa", countries: AFRICA },
  { name: "Europe", countries: EUROPE },
  { name: "Asia & Middle East", countries: ASIA },
  { name: "Americas & Oceania", countries: AMERICAS_OCEANIA },
];

// Africa first, then the rest of the world — origins and destinations alike.
export const COUNTRIES = [...AFRICA, ...EUROPE, ...ASIA, ...AMERICAS_OCEANIA].sort((a, b) =>
  a.localeCompare(b)
);
export const ORIGIN_COUNTRIES = COUNTRIES;
export const DESTINATION_COUNTRIES = COUNTRIES;

export const FREIGHT_MODES: { value: string; label: string }[] = [
  { value: "ocean_fcl",  label: "Ocean FCL" },
  { value: "ocean_lcl",  label: "Ocean LCL" },
  { value: "air",        label: "Air" },
  { value: "road",       label: "Road" },
  { value: "rail",       label: "Rail" },
  { value: "roro",       label: "RoRo" },
  { value: "multimodal", label: "Multimodal" },
];

export function modeLabel(value: string): string {
  return FREIGHT_MODES.find((m) => m.value === value)?.label ?? value;
}

export const INCOTERMS = [
  "EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP",
];

export const CONTAINER_TYPES = ["20GP", "40GP", "40HC", "40RF", "45HC"];

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "200+"];

export const IMDG_CLASSES = [
  { value: "1", label: "1 — Explosives" },
  { value: "2", label: "2 — Gases" },
  { value: "3", label: "3 — Flammable liquids" },
  { value: "4", label: "4 — Flammable solids" },
  { value: "5", label: "5 — Oxidizing substances" },
  { value: "6", label: "6 — Toxic substances" },
  { value: "7", label: "7 — Radioactive material" },
  { value: "8", label: "8 — Corrosives" },
  { value: "9", label: "9 — Miscellaneous" },
];

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
