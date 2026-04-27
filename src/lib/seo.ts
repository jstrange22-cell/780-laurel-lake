import { property, computed } from "~/data/property";

/** Generate schema.org JSON-LD for the listing. */
export function buildJsonLd(canonicalUrl: string, heroImageUrl: string) {
  const a = property.address;
  const fullAddress = computed.fullAddress();

  const realEstateListing: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${a.line1}, ${a.city} ${a.state}`,
    url: canonicalUrl,
    description: property.description || property.tagline,
    image: heroImageUrl,
    datePosted: new Date().toISOString().slice(0, 10),
    address: {
      "@type": "PostalAddress",
      streetAddress: a.line1,
      addressLocality: a.city,
      addressRegion: a.state,
      postalCode: a.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: a.lat,
      longitude: a.lng,
    },
  };

  if (property.price > 0) {
    realEstateListing.offers = {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      availability:
        property.status === "Active"
          ? "https://schema.org/InStock"
          : property.status === "Pending"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/Discontinued",
    };
  }

  const sd: Record<string, unknown> = {
    "@type": "SingleFamilyResidence",
    name: fullAddress,
    address: realEstateListing.address,
    geo: realEstateListing.geo,
  };

  if (property.beds > 0) sd.numberOfRooms = property.beds;
  if (property.beds > 0) sd.numberOfBedrooms = property.beds;
  if (property.baths.full > 0 || property.baths.half > 0) {
    sd.numberOfBathroomsTotal = computed.totalBaths();
    sd.numberOfFullBathrooms = property.baths.full;
    sd.numberOfPartialBathrooms = property.baths.half;
  }
  if (property.sqft.heated > 0) {
    sd.floorSize = {
      "@type": "QuantitativeValue",
      value: property.sqft.heated,
      unitCode: "FTK",
    };
  }
  if (property.lotAcres > 0) {
    sd.lotSize = {
      "@type": "QuantitativeValue",
      value: property.lotAcres,
      unitCode: "ACR",
    };
  }
  if (property.yearBuilt > 0) sd.yearBuilt = property.yearBuilt;

  realEstateListing.itemOffered = sd;

  if (property.agent.name) {
    const agent: Record<string, unknown> = {
      "@type": "RealEstateAgent",
      name: property.agent.name,
    };
    if (property.agent.brokerage) agent.worksFor = { "@type": "Organization", name: property.agent.brokerage };
    if (property.agent.phone) agent.telephone = property.agent.phone;
    if (property.agent.email) agent.email = property.agent.email;
    if (property.agent.photo) agent.image = property.agent.photo;
    realEstateListing.broker = agent;
  }

  return realEstateListing;
}

export function pageTitle() {
  const a = property.address;
  const price = property.price > 0 ? ` · ${computed.formattedPrice()}` : "";
  return `${a.line1} · ${a.city} ${a.state}${price}`;
}

export function pageDescription() {
  if (property.description) {
    const trimmed = property.description.replace(/\s+/g, " ").trim();
    return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
  }
  return property.tagline;
}
