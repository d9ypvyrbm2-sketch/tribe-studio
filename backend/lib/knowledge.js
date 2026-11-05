// Tribe Assistant knowledge base.
// Every fact here is copied from the Tribe Studio website (preview/index.html, the newest version), which takes its data from Booksy.
// If a price, barber or hour changes, change it HERE and on the website. The assistant knows nothing else.

const BOOKSY_URL =
  "https://booksy.com/en-us/1023543_the-tribe-studio-1-maverick_barber-shop_22412_boston";

const SHOP = {
  name: "The Tribe Studio 1 Maverick",
  shortName: "The Tribe Studio",
  address: "55 Chelsea St, East Boston, MA 02128",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=55+Chelsea+St+East+Boston+MA+02128",
  airportDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&origin=Boston+Logan+International+Airport&destination=55+Chelsea+St+East+Boston+MA+02128&travelmode=driving",
  airportDistance: "2.2 miles from Boston Logan International Airport",
  instagram: "https://www.instagram.com/thetribestudiobarbershop/",
  instagramHandle: "@thetribestudiobarbershop",
  booksyUrl: BOOKSY_URL,
  phone: "(857) 334-9508",
  rating: "5.0 on Booksy from 456 reviews",
  languages: ["English", "Spanish"],
  hours: [
    { days: "Monday to Saturday", hours: "9 AM – 8 PM" },
    { days: "Sunday", hours: "10 AM – 4 PM" },
  ],
  hoursNote: "Hours confirmed by the shop (Nov 2026). Holiday hours may differ, so check Booksy before coming.",
};

const SERVICES = [
  { name: "Haircut", price: "$40", duration: "45 min with Keven; 1 h with Dumar, Jean Carlos, Santi or Kevin T.",
    includes: "Steam and a hair wash. Keven uses ozone steam.", barbers: "Keven, Dumar Gomez, Jean Carlos, Kevin Tabares, Santi Vélez" },
  { name: "Haircut with Andres", price: "$60", duration: "1 h",
    includes: "Facial steam and styling.", barbers: "Andres Ospina" },
  { name: "Haircut & Beard", price: "$50", duration: "1 h with Keven; 1 h 15 with Dumar, Jean Carlos, Santi or Kevin T.",
    includes: "Beard steam, a wash and a facial.", barbers: "Keven, Dumar Gomez, Jean Carlos, Kevin Tabares, Santi Vélez" },
  { name: "Haircut & Beard with Andres", price: "$70", duration: "1 h 20",
    includes: "Steamed beard, facial cleansing and styling.", barbers: "Andres Ospina" },
  { name: "VIP", price: "$70", duration: "1 h 30",
    includes: "The website does not list what VIP includes; Booksy shows the details.", barbers: "Not listed on the website; check Booksy" },
  { name: "Line up", price: "$25", duration: "30 min",
    includes: "Edge-up and outline.", barbers: "Not listed per barber on the website; check Booksy" },
  { name: "Hair color", price: "from $150", duration: "3 h",
    includes: "For men and women. Final price depends on the work; Booksy shows it.", barbers: "Not listed per barber on the website; check Booksy" },
];

const BARBERS = [
  { name: "Andres Ospina", prices: "Haircut $60 · Haircut & Beard $70" },
  { name: "Keven", prices: "Haircut $40 (45 min) · Haircut & Beard $50 (1 h)" },
  { name: "Dumar Gomez", prices: "Haircut $40 (1 h) · Haircut & Beard $50 (1 h 15)" },
  { name: "Jean Carlos", prices: "Haircut $40 (1 h) · Haircut & Beard $50 (1 h 15)" },
  { name: "Kevin Tabares", prices: "Haircut $40 (1 h) · Haircut & Beard $50 (1 h 15)" },
  { name: "Santi Vélez", prices: "Haircut $40 (1 h) · Haircut & Beard $50 (1 h 15)" },
];

function knowledgeText() {
  const svc = SERVICES.map(
    (s) => `- ${s.name}: ${s.price}. Time: ${s.duration}. Includes: ${s.includes} Barbers: ${s.barbers}.`
  ).join("\n");
  const bar = BARBERS.map((b) => `- ${b.name}: ${b.prices}`).join("\n");
  const hrs = SHOP.hours.map((h) => `- ${h.days}: ${h.hours}`).join("\n");
  return `SHOP
- Name: ${SHOP.name} (people call it ${SHOP.shortName})
- Address: ${SHOP.address}. ${SHOP.airportDistance}.
- Google Maps: ${SHOP.mapsUrl}
- Directions from Logan Airport: ${SHOP.airportDirectionsUrl}
- Instagram: ${SHOP.instagramHandle} (${SHOP.instagram})
- Booking: only on Booksy: ${SHOP.booksyUrl}
- Rating: ${SHOP.rating}
- Phone: ${SHOP.phone}
- Staff speak English and Spanish.
- The website lists NO email address for the shop.

OPENING HOURS (shop time zone: America/New_York)
${hrs}
- ${SHOP.hoursNote}

SERVICES AND PRICES (prices can change; Booksy always shows the current price)
${svc}

THE SIX BARBERS
${bar}
Hair color, line ups and VIP are not listed per barber on the website.

BOOKING ON BOOKSY
- Customers pick the service, the barber (or any barber) and the time on Booksy. It takes about a minute.
- Booksy shows live availability. This assistant cannot see availability and cannot create, change or cancel appointments.
- Changes and cancellations are done in the Booksy app or Booksy booking page, under the customer's own booking.`;
}

module.exports = { SHOP, SERVICES, BARBERS, BOOKSY_URL, knowledgeText };
