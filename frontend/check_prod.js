async function checkHeaders(ref) {
    const url = `https://gelabertstay.es/propiedades/${ref}`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'WhatsApp/2.21.12.21 A' } });
        console.log(`Ref: ${ref} | Status: ${res.status} | x-meta-injected: ${res.headers.get('x-meta-injected')}`);
    } catch (e) { console.error(e); }
}

async function run() {
    await checkHeaders('GEL-111');
    await checkHeaders('GEL-112');
}
run();
