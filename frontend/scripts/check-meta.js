
const urls = [
    "https://gelaberthomes.es/propiedades/GEL-115",
    "https://gelaberthomes.es/propiedades/GEL-111",
    "https://gelaberthomes.es/propiedades/GEL-112",
    "https://gelaberthomes.es/en/propiedades/GEL-111"
];

async function checkUrl(url, ua = "WhatsApp/2.21.12.21 A") {
    console.log(`\n--- Checking ${url} with UA: ${ua} ---`);
    try {
        const res = await fetch(url + "?nocache=" + Date.now(), {
            headers: { "User-Agent": ua }
        });
        
        console.log(`Status: ${res.status}`);
        console.log(`x-meta-version: ${res.headers.get("x-meta-version")}`);
        
        const html = await res.text();
        const ogDesc = html.match(/property=["']og:description["'] content=["']([^"']+)["']/i);
        console.log(`OG Desc: ${ogDesc ? ogDesc[1] : 'MISSING'}`);
        
        const title = html.match(/<title>([^<]+)<\/title>/i);
        console.log(`Title: ${title ? title[1].trim() : 'MISSING'}`);
    } catch (e) {
        console.error(`Error:`, e);
    }
}

async function run() {
    const uaList = [
        "WhatsApp/2.21.12.21 A",
        "facebookexternalhit/1.1",
        "Twitterbot/1.1"
    ];
    for (const url of urls) {
        for (const ua of uaList) {
            await checkUrl(url, ua);
        }
    }
}

run();
