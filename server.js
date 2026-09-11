require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// Crée une session de paiement Stripe Checkout à partir du panier envoyé par le site.
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart, successUrl, cancelUrl } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Panier vide." });
    }

    const line_items = cart.map((item) => {
      if (!item.name || !(item.price > 0) || !(item.qty > 0)) {
        throw new Error("Article invalide dans le panier.");
      }
      return {
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // Stripe attend des centimes
        },
        quantity: item.qty,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["FR", "BE", "CH", "LU"] },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Serveur de paiement démarré sur le port ${port}`));
