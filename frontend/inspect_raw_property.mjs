// Call production Idealista to fetch properties and dump the first one in full
const BASE_URL = "https://partners.idealista.com";
const CLIENT_ID = "gelaberthomes";
const CLIENT_SECRET = "78uVbVZAJ077XZYwKTrV2b4tHoCHITsD";
const FEED_KEY = "ilc9cd3e42a7951c00db203bd70276774f880278531";

const b64 = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

try {
  const tok = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${b64}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tok.json();
  
  const res = await fetch(`${BASE_URL}/v1/properties?page=1&size=5`, {
    headers: {
      "feedKey": FEED_KEY,
      "Authorization": `Bearer ${access_token}`,
    }
  });
  
  const data = await res.json();
  const properties = data.properties || data.items || data || [];
  console.log("Total properties on page 1:", properties.length);
  if (properties.length > 0) {
    console.log("\nRAW FIRST PROPERTY FROM PRODUCTION API:");
    console.log(JSON.stringify(properties[0], null, 2));
  } else {
    console.log("No properties found.");
  }
} catch (e) {
  console.log("Error:", e.message);
}
