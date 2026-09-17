Poner en marcha the 2nd closet
El sitio ya funciona tal cual (con los 10 productos actuales como catálogo fijo). Estos pasos activan las 3 piezas nuevas: catálogo editable desde /admin.html, publicación en internet, y cobro con Mercado Pago. Se pueden hacer en cualquier orden, pero este es el más simple.

1. Supabase (base de datos del catálogo) — gratis
Creá una cuenta en https://supabase.com y un proyecto nuevo.
Andá a SQL Editor, pegá el contenido de supabase/schema.sql y ejecutalo.
Si querés arrancar con las 10 prendas actuales ya cargadas, pegá también supabase/seed.sql y ejecutalo.
Andá a Authentication → Users → Add user y create un usuario (tu email + una contraseña) — con eso vas a entrar a /admin.html.
Andá a Project Settings → API y copiá:
Project URL
anon public key
Pegá esos dos valores en config.js (SUPABASE_URL y SUPABASE_ANON_KEY). Esta clave es pública a propósito, no hace falta esconderla.
Con eso, index.html va a leer el catálogo desde Supabase y admin.html va a dejarte loguearte y cargar/editar/borrar prendas con fotos, sin tocar código nunca más.

2. Vercel (hosting + Mercado Pago) — gratis
Creá una cuenta en https://vercel.com (podés entrar con GitHub).
Subí esta carpeta a un repositorio de GitHub, y en Vercel elegí Add New → Project e importá ese repo. (Si no usás GitHub, Vercel también permite arrastrar la carpeta con vercel CLI — avisame y te paso los comandos.)
Vercel detecta el sitio solo, no hace falta configurar nada para desplegarlo.
Una vez desplegado, tenés una URL tipo the-2nd-closet.vercel.app. Más adelante podés conectarle un dominio propio desde Project → Settings → Domains.
3. Mercado Pago (cobro online)
Creá una cuenta / entrá en https://www.mercadopago.com.ar/developers/panel
Creá una aplicación (Checkout Pro).
Copiá el Access Token (de prueba primero, de producción cuando quieras cobrar de verdad).
En Vercel: Project → Settings → Environment Variables, agregá:
MP_ACCESS_TOKEN = el token que copiaste
Volvé a desplegar (Vercel → Deployments → Redeploy).
Importante: el Access Token es una credencial de cobro — no me lo pegues a mí ni lo escribas en ningún archivo del proyecto. Va únicamente en las variables de entorno de Vercel, así queda oculto del código y del navegador.

Qué probar al final
Entrar a /admin.html, loguearte, y agregar una prenda de prueba con foto.
Ver que aparece en /index.html al toque.
Agregar algo al carrito y probar "Pagar con Mercado Pago" (con el Access Token de prueba Mercado Pago te deja simular una compra sin plata real).
