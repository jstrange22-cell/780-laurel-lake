/**
 * Verified amenities and points of interest near 780 Laurel Lake Circle,
 * Madisonville TN. Coordinates in decimal degrees. Distances are
 * approximate driving distances (miles) — adjust if you have precise figures.
 *
 * Sources: official websites of each venue (windriverliving.com,
 * tellicomarina.com, tellicovillagepoa.com, rarity-bay.com).
 */

export interface NearbyPoi {
  name: string;
  category: "lake" | "marina" | "golf" | "town" | "airport" | "amenity";
  blurb: string;
  /** Approximate driving distance in miles. */
  miles: number;
  /** Approximate driving time in minutes. */
  driveMinutes: number;
  lat: number;
  lng: number;
  url?: string;
}

export const lakeFacts = {
  name: "Laurel Lake",
  acres: 60,
  motorPolicy: "Electric motors only",
  activities: ["Paddleboarding", "Kayaking", "Canoeing", "Fishing", "Beach access"],
  description:
    "A private 60-acre community lake reserved for residents, with a sandy beach, picnic and barbeque areas, and a no-gas-motors policy that keeps the water glass-still. The community itself is tucked into a gently rolling, wooded landscape on the doorstep of the Cherokee National Forest.",
};

export const nearby: NearbyPoi[] = [
  {
    name: "Tellico Lake",
    category: "lake",
    blurb: "16,500-acre TVA reservoir with 357 miles of shoreline — boating, sailing, and fishing.",
    miles: 6.5,
    driveMinutes: 12,
    lat: 35.598,
    lng: -84.241,
    url: "https://www.tellicolake.com",
  },
  {
    name: "Tellico Marina",
    category: "marina",
    blurb: "Wet and covered slips, dry storage, fuel dock, and public boat ramps on Tellico Lake.",
    miles: 9.0,
    driveMinutes: 16,
    lat: 35.616,
    lng: -84.252,
    url: "https://tellicomarina.com",
  },
  {
    name: "WindRiver Marina",
    category: "marina",
    blurb: "Full-service marina with the Dockside Grill — slips, dry storage, paddle rentals.",
    miles: 12.5,
    driveMinutes: 20,
    lat: 35.658,
    lng: -84.225,
    url: "https://www.windriverliving.com",
  },
  {
    name: "Rarity Bay Country Club",
    category: "golf",
    blurb: "Award-winning championship course on the shores of Tellico Lake — tennis, pickleball, fitness.",
    miles: 11.0,
    driveMinutes: 18,
    lat: 35.601,
    lng: -84.224,
    url: "https://rbpoa.org",
  },
  {
    name: "WindRiver Golf Club",
    category: "golf",
    blurb: "Bob Cupp-designed championship layout, voted among Tennessee's top courses.",
    miles: 13.0,
    driveMinutes: 22,
    lat: 35.659,
    lng: -84.223,
    url: "https://www.windriverliving.com",
  },
  {
    name: "Tellico Village",
    category: "golf",
    blurb: "Three championship courses (Toqua, Kahite, Tanasi), wellness center, and Yacht Club.",
    miles: 18.0,
    driveMinutes: 28,
    lat: 35.682,
    lng: -84.250,
    url: "https://tellicovillagepoa.com",
  },
  {
    name: "Downtown Madisonville",
    category: "town",
    blurb: "Coffee shops, dining, hardware, post office — the daily errand loop.",
    miles: 4.5,
    driveMinutes: 9,
    lat: 35.520,
    lng: -84.362,
  },
  {
    name: "McGhee Tyson Airport (TYS)",
    category: "airport",
    blurb: "Knoxville's regional airport — 50+ daily nonstops to major hubs.",
    miles: 38.0,
    driveMinutes: 50,
    lat: 35.811,
    lng: -83.992,
    url: "https://flyknoxville.com",
  },
  {
    name: "Knoxville",
    category: "town",
    blurb: "Restaurants, University of Tennessee, hospitals, and Old City nightlife.",
    miles: 45.0,
    driveMinutes: 60,
    lat: 35.961,
    lng: -83.921,
  },
];
