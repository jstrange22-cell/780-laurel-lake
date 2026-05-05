/**
 * SINGLE SOURCE OF TRUTH for the listing.
 *
 * Fill in every field marked TODO. The site renders gracefully if a value is
 * empty/zero — the corresponding section either hides itself or shows a tasteful
 * placeholder. Don't add fake data; leave it empty and the site will adapt.
 *
 * Address coordinates and neighborhood facts have been pre-filled with verified
 * data from public sources. You can tweak if needed.
 */

export interface PropertyData {
  status: "Active" | "Pending" | "Sold" | "Coming Soon" | "Off Market";
  price: number; // USD, no formatting; 0 = hidden
  pricePerSqft?: number; // optional auto-computed override
  beds: number;
  baths: { full: number; half: number };
  sqft: { heated: number; total?: number };
  lotAcres: number;
  yearBuilt: number;
  mlsNumber: string;
  propertyType: string; // e.g. "Single-Family Residential"
  /** Marketing remarks. Paste verbatim from MLS. 250+ words ideal for SEO. */
  description: string;
  /** Optional short hook displayed under the address. < 90 chars. */
  tagline: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    subdivision: string;
    /** Decimal degrees. Pre-filled with the centroid of Laurel Lake community. */
    lat: number;
    lng: number;
  };
  features: {
    interior: string[];
    exterior: string[];
    appliances: string[];
    flooring: string[];
    heating: string[];
    cooling: string[];
    parking: string[];
    fireplace: string;
    view: string[];
    waterfront: string;
  };
  hoaDues: { amount: number; period: "monthly" | "yearly" | "" };
  annualTax: number;
  schoolDistrict: string;
  virtualTourUrl: string;
  agent: {
    name: string;
    title: string;
    brokerage: string;
    /** Public path to headshot, e.g. "/agent/headshot.jpg". Place file in public/agent/. */
    photo: string;
    phone: string;
    email: string;
    licenseNumber: string;
    bio: string;
  };
  /** Brokerage / firm details — required for RESPA, TREC, and Fair Housing compliance. */
  brokerage: {
    name: string;
    parent: string;
    address: { line1: string; line2: string; city: string; state: string; zip: string };
    phone: string;
    email: string;
    website: string;
    /** Tennessee Real Estate Commission firm license #. */
    firmLicense: string;
    principalBroker: string;
    principalBrokerLicense: string;
  };
  /** Where the contact form POSTs JSON. Empty = console.log only (dev). */
  contactWebhookUrl: string;
  /** Brand line shown in footer. */
  brokerageLine: string;
  /** Equal Housing Opportunity / disclaimers shown in footer. */
  disclaimers: string;
}

export const property: PropertyData = {
  // === LISTING STATUS & PRICE ===
  status: "Active",
  price: 0, // TODO list price (USD, no commas), e.g. 1295000
  beds: 0, // TODO
  baths: { full: 0, half: 0 }, // TODO
  sqft: { heated: 0 }, // TODO heated sqft. Optionally add total.
  lotAcres: 0, // TODO e.g. 1.25
  yearBuilt: 0, // TODO e.g. 2018
  mlsNumber: "", // TODO

  propertyType: "Single-Family Residential",

  // === DESCRIPTION ===
  // TODO paste MLS marketing remarks verbatim. Keep paragraph breaks.
  description: "",
  // TODO optional short hook. e.g. "Lakeside refuge on a private 60-acre lake"
  tagline: "Lakeside living in a private, gated Tellico community",

  // === ADDRESS ===
  address: {
    line1: "780 Laurel Lake Circle",
    city: "Madisonville",
    state: "TN",
    zip: "37354",
    county: "Monroe County",
    subdivision: "Laurel Lake",
    // Approximate centroid of the Laurel Lake / Big Creek Rd subdivision
    // outside Madisonville. Adjust to exact lot if you have surveyed coords.
    lat: 35.467,
    lng: -84.305,
  },

  // === FEATURES ===
  features: {
    interior: [], // TODO
    exterior: [], // TODO
    appliances: [], // TODO
    flooring: [], // TODO
    heating: [], // TODO
    cooling: [], // TODO
    parking: [], // TODO
    fireplace: "", // TODO e.g. "Stone, gas-log, in great room"
    view: [], // TODO e.g. ["Lake", "Wooded"]
    waterfront: "", // TODO e.g. "Community lake access" or "Direct waterfront with private dock"
  },

  // === FINANCIAL ===
  hoaDues: { amount: 0, period: "" }, // TODO
  annualTax: 0, // TODO

  // === SCHOOLS ===
  schoolDistrict: "", // TODO e.g. "Monroe County Schools"

  // === VIRTUAL TOUR ===
  virtualTourUrl: "", // TODO Matterport / iGuide / YouTube URL

  // === LISTING AGENT ===
  agent: {
    name: "", // TODO
    title: "", // TODO e.g. "Listing Agent" or "Broker"
    brokerage: "Young Marketing Group · Realty Executives",
    photo: "", // TODO place headshot in public/agent/headshot.jpg, then set "/agent/headshot.jpg"
    phone: "", // TODO e.g. "+1 (865) 555-0123"
    email: "", // TODO
    licenseNumber: "", // TODO TN license #
    bio: "", // TODO 1-2 sentence agent bio
  },

  // === BROKERAGE / FIRM ===
  // Verified from public sources. Firm license # to be filled in by the office.
  brokerage: {
    name: "Young Marketing Group",
    parent: "Realty Executives Associates",
    address: {
      line1: "410 Montbrook Lane",
      line2: "Suite 103",
      city: "Knoxville",
      state: "TN",
      zip: "37919",
    },
    phone: "(865) 281-1321",
    email: "carl@youngmarketinggroup.com",
    website: "https://www.youngmarketinggroup.com",
    firmLicense: "264877",
    principalBroker: "Dan Green",
    principalBrokerLicense: "012764",
  },

  // === FORM ENDPOINT ===
  contactWebhookUrl: "", // TODO POST URL for inquiries (Zapier/n8n/Formspree). Empty = console.log

  // === BRAND LINES ===
  brokerageLine: "Presented by Young Marketing Group · Realty Executives",
  disclaimers:
    "All information herein is deemed reliable but not guaranteed by Young Marketing Group, Realty Executives Associates, or any of their respective members. Buyer and buyer's agent to independently verify all property details, measurements, schools, taxes, HOA, and zoning. Listing data sourced from the Multiple Listing Service. Each office is independently owned and operated. Equal Housing Opportunity.",
};

/** Convenience computed values */
export const computed = {
  fullAddress: () =>
    `${property.address.line1}, ${property.address.city}, ${property.address.state} ${property.address.zip}`,
  totalBaths: () => property.baths.full + property.baths.half * 0.5,
  formattedPrice: () =>
    property.price > 0
      ? `$${property.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : "Price upon request",
  formattedSqft: () =>
    property.sqft.heated > 0 ? `${property.sqft.heated.toLocaleString("en-US")}` : "—",
  bathSummary: () => {
    const f = property.baths.full;
    const h = property.baths.half;
    if (!f && !h) return "—";
    if (h === 0) return `${f}`;
    return `${f}.${h}`;
  },
  pricePerSqft: () => {
    if (property.price > 0 && property.sqft.heated > 0) {
      return Math.round(property.price / property.sqft.heated);
    }
    return 0;
  },
};
