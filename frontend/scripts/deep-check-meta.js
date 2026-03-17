
const urls = [
    "https://gelaberthomes.es/propiedades/GEL-111",
    "https://gelaberthomes.es/propiedades/GEL-112"
];

async function checkUrl(url) {
    console.log(`\n--- DEEP CHECK: ${url} ---`);
    try {
        const res = await fetch(url + "?nocache=" + Date.now(), {
            headers: {
                "User-Agent": "WhatsApp/2.21.12.21 A"
            }
        });
        
        console.log(`Status: ${res.status}`);
        console.log(`x-meta-version: ${res.headers.get("x-meta-version")}`);
        console.log(`x-meta-injected: ${res.headers.get("x-meta-injected")}`);
        
        const html = await res.text();
        
        // Match all meta tags
        const metaTags = html.match(/<meta [^>]+>/gi) || [];
        console.log(`\nFound ${metaTags.length} Total Meta Tags:`);
        
        const interesting = metaTags.filter(t => 
            t.includes("description") || 
            t.includes("og:") || 
            t.includes("twitter:") || 
            t.includes("title") ||
            t.includes("image")
        );
        
        interesting.forEach(t => console.log(`  ${t.trim()}`));

        // Check for any title tags
        const titles = html.match(/<title>[\s\S]*?<\/title>/gi) || [];
        console.log(`\nFound ${titles.length} Title Tags:`);
        titles.forEach(t => console.log(`  ${t.trim()}`));

        // Check head start
        const headStart = html.indexOf("<head>");
        const first1000 = html.substring(headStart, headStart + 2000);
        console.log("\nFirst 2000 chars of <head>:");
        console.log(first1000);

    } catch (e) {
        console.error(`Error checking ${url}:`, e);
    }
}

async function run() {
    for (const url of urls) {
        await checkUrl(url);
    }
}

run();
