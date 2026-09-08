import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { MercadoPagoConfig, Preference } from "mercadopago";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

const client = new MercadoPagoConfig({
  accessToken:
    "APP_USR-3275042003084000-090810-49684bdff45ff45af9d97883bdef4988-3674981056",
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "client", "index.html"));
});

app.post("/create_preference", async (req, res) => {
  try {
    const preference = new Preference(client);

    const items = [
      {
        title: req.body.description || "Compra de ecommerce",
        unit_price: Number(req.body.price),
        quantity: Number(req.body.quantity),
        currency_id: "ARS",
      },
    ];

    const response = await preference.create({
      body: {
        items: items,
        back_urls: {
          success: "http://localhost:8080/",
          failure: "http://localhost:8080/",
          pending: "http://localhost:8080/feedback",
        },
      },
    });

    console.log("Preferencia creada con éxito. ID:", response.id);

    res.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error al crear la preferencia:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/feedback", (req, res) => {
  res.json({
    Payment: req.query.payment_id,
    Status: req.query.status,
    MerchantOrder: req.query.merchant_order_id,
  });
});

app.listen(port, () => {
  console.log(`The server is now running on Port ${port}`);
});
