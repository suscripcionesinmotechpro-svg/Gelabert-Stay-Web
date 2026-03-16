const url = "https://aumqjpqngmhpbwytpets.supabase.co/storage/v1/object/public/property-images/gallery/1773687809189-a8j34y4e4v.jpg";

async function check() {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Content-Length: ${res.headers.get('content-length')}`);
    } catch (e) {
        console.error(e);
    }
}

check();
