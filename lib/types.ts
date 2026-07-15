export type MembershipTier = "free" | "premium";

export type ServiceRef = { services: { slug: string; name: string } | null };

export type LaneRef = {
  origin_country: string;
  destination_country: string;
  modes: string[] | null;
};

export type ForwarderListing = {
  id: string;
  company_name: string;
  slug: string;
  tagline: string | null;
  hq_country: string;
  hq_city: string | null;
  membership_tier: MembershipTier;
  is_verified: boolean;
  is_claimed: boolean;
  rating_avg: number;
  rating_count: number;
  logo_url: string | null;
  forwarder_services: ServiceRef[];
  forwarder_lanes: LaneRef[];
};

export type ServiceOption = { slug: string; name: string; category: string | null };
