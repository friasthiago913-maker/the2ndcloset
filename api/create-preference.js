// Función serverless (Vercel). Crea una preferencia de pago de Mercado Pago.
// Requiere la variable de entorno MP_ACCESS_TOKEN (Access Token de producción o de prueba),
// configurada en el panel de Vercel — nunca en este archivo ni en el frontend.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: "Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)." });
    return;
  }

  const items = req.body && req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "El carrito está vacío." });
    return;
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        items: items.map(it => ({
          title: String(it.name).slice(0, 200),
          quantity: 1,
          unit_price: Number(it.price),
          currency_id: "ARS"
        })),
        back_urls: {
          success: `${origin}/?pago=exito`,
          failure: `${origin}/?pago=error`,
          pending: `${origin}/?pago=pendiente`
        },
        auto_return: "approved"
      })
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      res.status(mpRes.status).json({ error: data.message || "Error al crear la preferencia de pago." });
      return;
    }

    res.status(200).json({ init_point: data.init_point });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
