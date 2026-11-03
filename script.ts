import "dotenv/config";

const META_TOKEN = process.env.META_TOKEN;

if (!META_TOKEN) {
  console.error("Error: No se encontró la variable META_TOKEN en el archivo .env");
  process.exit(1);
}

const PHONE_NUMBER_ID = "1404706586060934";
const API_VERSION = "v25.0";
const URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

const payload = {
  messaging_product: "whatsapp",
  to: "541130926776",
  type: "template",
  template: {
    name: "jaspers_market_order_confirmation_v1",
    language: {
      code: "en_US",
    },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "John Doe" },
          { type: "text", text: "123456" },
          { type: "text", text: "Nov 2, 2026" },
        ],
      },
    ],
  },
};

async function sendMessage() {
  console.log("Enviando mensaje a WhatsApp...");

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error HTTP ${response.status}:`, JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("Mensaje enviado exitosamente:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error de conexión:", error);
    process.exit(1);
  }
}

sendMessage();
