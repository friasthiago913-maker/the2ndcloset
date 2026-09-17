// Función serverless (Vercel). Trae la foto y el texto de un post público de Instagram
// y sube la foto directo a Supabase Storage, para precargar el formulario de /admin.html.
//
// Requiere la variable de entorno SUPABASE_SERVICE_KEY (Supabase → Project Settings → API →
// clave "service_role", es SECRETA) configurada en Vercel — nunca en este archivo ni en el frontend.
//
// Cómo funciona: lee la página pública del post (no usa ninguna API oficial ni tu cuenta de
// Instagram), tal como recomienda Meta desde que sacaron las fotos del oEmbed. Por eso puede
// fallar (post privado, bloqueo temporal, o carrusel del que sólo trae la primera foto) — si
// falla, se puede seguir cargando la prenda a mano como siempre.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function getSupabaseUrl() {
  const configPath = path.join(__dirname, "..", "config.js");
  const src = fs.readFileSync(configPath, "utf8");
  const match = src.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
  return match && match[1];
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeHtmlEntities(m[1]);
  }
  return null;
}

function extractCaption(description) {
  if (!description) return "";
  // Formato típico: '1.234 Me gusta, 56 comentarios - usuario (@usuario) en Instagram: "el texto"'
  const m = description.match(/Instagram:\s*"(.*)"\s*$/s);
  return m ? m[1] : description;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    res.status(500).json({ error: "Falta configurar SUPABASE_SERVICE_KEY en Vercel (ver SETUP.md)." });
    return;
  }

  let supabaseUrl;
  try {
    supabaseUrl = getSupabaseUrl();
  } catch (err) {
    res.status(500).json({ error: "No pude leer config.js: " + err.message });
    return;
  }
  if (!supabaseUrl) {
    res.status(500).json({ error: "No encontré SUPABASE_URL en config.js." });
    return;
  }

  const postUrl = req.body && req.body.url;
  if (!postUrl || !/instagram\.com\/(p|reel)\//.test(postUrl)) {
    res.status(400).json({ error: "Pegá un link de un post o reel (instagram.com/p/... o /reel/...)." });
    return;
  }

  try {
    const pageRes = await fetch(postUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "es-AR,es;q=0.9"
      }
    });
    if (!pageRes.ok) {
      throw new Error(`Instagram devolvió un error (${pageRes.status}). Puede ser un post privado o un bloqueo temporal.`);
    }

    const html = await pageRes.text();
    const imageUrl = extractMeta(html, "og:image");
    const description = extractMeta(html, "og:description");
    const caption = extractCaption(description);

    if (!imageUrl) {
      throw new Error("No encontré ninguna foto en ese post. Puede ser privado o Instagram bloqueó el pedido.");
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("No pude descargar la foto del post.");
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const objectPath = `products/${crypto.randomUUID()}-instagram.jpg`;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "image/jpeg"
      },
      body: buffer
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error("No pude subir la foto a Supabase: " + errText);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`;
    res.status(200).json({ images: [publicUrl], caption });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
