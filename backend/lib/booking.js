// The receptionist's booking choices. Checked against the official Booksy widget for business 1023543 on 2026-11-09.
// The website front end (assistant/tribe-receptionist.js) keeps the same lists; change both together.

const SERVICES = ["Haircut", "Haircut & Beard", "Line up", "VIP", "Hair color"];
const BARBERS = ["Andres Ospina", "Keven", "Dumar Gomez", "Jean Carlos", "Kevin Tabares", "Santi Vélez", "Ricardo"];
const ANY = "Any barber";

// Booksy lists Haircut and Haircut & Beard once per barber; the other services are one shared item.
function barberServices(service) {
  return service === "Haircut" || service === "Haircut & Beard";
}

// Cleans a booking-state object coming from the browser or from the model. Unknown values are dropped.
function cleanBooking(raw) {
  const b = raw && typeof raw === "object" ? raw : {};
  const out = {};
  if (SERVICES.includes(b.service)) out.service = b.service;
  if (BARBERS.includes(b.barber) || b.barber === ANY) out.barber = b.barber;
  if (b.customer === "new" || b.customer === "returning") out.customer = b.customer;
  if (typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date)) out.date = b.date;
  return out;
}

module.exports = { SERVICES, BARBERS, ANY, barberServices, cleanBooking };
