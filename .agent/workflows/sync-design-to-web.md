---
description: Sincronizar cambios de untitled.pen al código web React en tiempo real
---

# Workflow: Sincronizar Diseño → Web (Gelabert Stay)

## Mapa de páginas pen → archivos TSX

| Página en untitled.pen | Archivo a modificar |
|---|---|
| Page 1 — Home | `frontend/src/pages/Home.tsx` |
| Page 2 — Propiedades | `frontend/src/pages/Propiedades.tsx` |
| Page 3 — Ficha de Propiedad | `frontend/src/pages/FichaPropiedad.tsx` |
| Page 4 — Servicios | `frontend/src/pages/Servicios.tsx` |
| Page 5 — Propietarios | `frontend/src/pages/Propietarios.tsx` |
| Page 6 — Contacto | `frontend/src/pages/Contacto.tsx` |
| Page 7 — Admin Login | `frontend/src/pages/admin/AdminLogin.tsx` |
| Page 8 — Admin Dashboard | `frontend/src/pages/admin/AdminDashboard.tsx` |
| COMP: Property Card | `frontend/src/components/PropertyCard.tsx` |
| COMP: Filter Bar | `frontend/src/components/FilterBar.tsx` |
| COMP: Admin Table Row | `frontend/src/components/AdminTableRow.tsx` |
| Navbar / Footer (global) | `frontend/src/components/Layout.tsx` |

## Pasos para sincronizar un cambio de diseño al web

### 1. Haz el cambio en `untitled.pen` (Pencil)
Edita el texto, color, o estructura del nodo que desees cambiar.

### 2. Dile a Antigravity qué cambiaste
Ejemplo de prompt:
```
"Cambié el headline del hero en la Page 1 del pen. Actualiza Home.tsx para reflejarlo."
"Modifiqué el texto del botón CTA en Servicios. Aplícalo a Servicios.tsx."
"Añadí un nuevo testimonio en la Page 1. Sincronízalo con Home.tsx."
```

### 3. Antigravity lee el nodo con Pencil MCP y actualiza el TSX
El agente usará `mcp_pencil_batch_get` para leer el nodo modificado y luego editará el archivo `.tsx` correspondiente.

### 4. Vite HMR actualiza el navegador automáticamente
Si el servidor de desarrollo está corriendo (`npm run dev`), el navegador se recargará al instante sin pérdida de estado.

## Cómo arrancar el servidor de desarrollo

```powershell
cd "c:\Users\lenovo\Desktop\Gelabert Stay\WEB\frontend"
npm run dev
```

El servidor queda en `http://localhost:5173`. 
Con HMR activo, cada cambio en los `.tsx` se refleja en menos de 1 segundo en el navegador.

## IDs clave del pen (para referencia rápida)

| Elemento | Node ID | Página |
|---|---|---|
| Hero headline | `XpDvm` | Page 1 Home |
| Hero subtitle | `mqbUJ` | Page 1 Home |
| Título "Nuestros Servicios" | `Il2if` | Page 1 Home |
| Título "Propiedades Destacadas" | `ubrym` | Page 1 Home |
| Título "Por qué elegirnos" | `TXX8P` | Page 1 Home |
| Título sección Propietarios | `SNQ4c` | Page 1 Home |
| Titulo Servicios (Page 4) | `c5uZz` | Page 4 Servicios |
| Contacto header | `1Zfaf` | Page 6 Contacto |
| Propiedades header | `tFpLK` | Page 2 Propiedades |
