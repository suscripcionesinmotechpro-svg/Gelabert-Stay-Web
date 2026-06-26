// Call the live idealista-import function to inspect the status values returned by Idealista
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

try {
  console.log("📡 Llamando a idealista-import (fetch)...");
  const res = await fetch("https://aumqjpqngmhpbwytpets.supabase.co/functions/v1/idealista-import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "fetch" }),
  });
  
  if (!res.ok) {
    console.error("Error en HTTP:", res.status, await res.text());
    process.exit(1);
  }
  
  const data = await res.json();
  console.log("Total devueltas por Idealista:", data.idealista_count);
  
  if (data.matches && data.matches.length > 0) {
    console.log("\nLista de propiedades y sus estados:");
    data.matches.forEach((m, idx) => {
      console.log(`[${idx + 1}] Ref: ${m.idealista.code} | ID: ${m.idealista.idealista_id} | Status: "${m.idealista.status}" | Active: ${m.idealista.is_active} | Match: ${m.auto_matched ? "crm_id: " + m.crm.id : "No Match"}`);
    });
  } else {
    console.log("No se devolvió ninguna propiedad.");
  }
} catch (e) {
  console.error("Excepción:", e.message);
}
