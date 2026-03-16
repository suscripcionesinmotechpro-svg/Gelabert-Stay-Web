const SUPABASE_URL = "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_KEY_HERE";
const identifier = "GEL-111";

async function test() {
    console.log(`Testing for identifier: ${identifier}`);
    
    // Simulating inject-meta.ts logic
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(identifier);

    // If it's a reference like GEL-XXX, make it uppercase
    const searchId = (!isUuid && identifier.toLowerCase().startsWith('gel-'))
      ? identifier.toUpperCase()
      : identifier;

    console.log(`searchId: ${searchId}`);

    const orConditions = isUuid 
      ? `reference.eq.${searchId},slug.eq.${searchId},id.eq.${searchId}`
      : `reference.eq.${searchId},slug.eq.${searchId}`;

    const queryUrl = `${SUPABASE_URL}/rest/v1/properties?or=(${orConditions})&select=*`;
    console.log(`Query URL: ${queryUrl}`);

    const response = await fetch(queryUrl, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
        process.exit(1);
    }

    const properties = await response.json();
    console.log(`Found ${properties.length} properties`);
    
    if (properties.length > 0) {
        const prop = properties[0];
        console.log(`Title: ${prop.title}`);
        console.log(`Main Image: ${prop.main_image}`);
        
        // Check for special characters in title
        const cleanTitle = (prop.title || "").replace(/"/g, '&quot;');
        console.log(`Clean Title: ${cleanTitle}`);
    }
}

test();
