// Carga prendas directo a Supabase usando la service_role key (evita el panel /admin.html).
// Uso:
//   1) Poné SUPABASE_SERVICE_KEY en .env.local (nunca en este archivo, nunca en git).
//   2) Escribí las prendas en scripts/products-to-add.json (ver products-to-add.example.json).
//   3) node scripts/load-products.mjs
//
// Sube las imágenes locales indicadas a Storage y después inserta las filas en `products`.

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal(){
  const envPath = path.join(root, ".env.local");
  if(!existsSync(envPath)) return;
  for(const line of readFileSync(envPath, "utf8").split("\n")){
    const trimmed = line.trim();
    if(!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if(eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if(!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

// Lee SUPABASE_URL desde config.js para no tener que repetirlo en .env.local
const configSrc = readFileSync(path.join(root, "config.js"), "utf8");
const SUPABASE_URL = configSrc.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if(!SUPABASE_URL){
  console.error("No encontré SUPABASE_URL en config.js.");
  process.exit(1);
}
if(!SERVICE_KEY){
  console.error("Falta SUPABASE_SERVICE_KEY en .env.local");
  process.exit(1);
}

const dataPath = path.join(root, "scripts", "products-to-add.json");
if(!existsSync(dataPath)){
  console.error("No existe scripts/products-to-add.json (mirá products-to-add.example.json).");
  process.exit(1);
}
const items = JSON.parse(readFileSync(dataPath, "utf8"));

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`
};

async function nextSortOrder(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=sort_order&order=sort_order.desc&limit=1`, { headers });
  const rows = await res.json();
  return (rows[0]?.sort_order || 0) + 1;
}

function guessContentType(file){
  const ext = path.extname(file).toLowerCase();
  if(ext === ".png") return "image/png";
  if(ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function uploadImage(localPath){
  const absolute = path.isAbsolute(localPath) ? localPath : path.join(root, localPath);
  const bytes = readFileSync(absolute);
  const objectPath = `products/${crypto.randomUUID()}-${path.basename(absolute)}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${objectPath}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": guessContentType(absolute) },
    body: bytes
  });
  if(!res.ok){
    throw new Error(`Error subiendo ${localPath}: ${res.status} ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${objectPath}`;
}

async function insertProduct(product, sortOrder){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ ...product, sort_order: sortOrder })
  });
  if(!res.ok){
    throw new Error(`Error insertando "${product.name}": ${res.status} ${await res.text()}`);
  }
  return res.json();
}

let sortOrder = await nextSortOrder();

for(const item of items){
  console.log(`Subiendo fotos de "${item.name}"...`);
  const images = [];
  for(const localImage of item.images || []){
    images.push(await uploadImage(localImage));
  }
  const product = {
    name: item.name,
    category: item.category,
    price: item.price,
    condition: item.condition || "10/10",
    details: item.details || "",
    sold: !!item.sold,
    images
  };
  await insertProduct(product, sortOrder++);
  console.log(`✓ Cargada: ${item.name}`);
}

console.log(`Listo. ${items.length} prenda(s) cargada(s).`);
