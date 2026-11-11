
require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("👑 CHAND MD BOT IS ONLINE!");
});

// Verify WhatsApp webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Receive WhatsApp messages
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-hub-signature-256"];
    const appSecret = process.env.APP_SECRET;

    if (!signature || !appSecret) {
      return res.sendStatus(401);
    }

    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", appSecret)
        .update(req.body)
        .digest("hex");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return res.sendStatus(401);
    }

    let body;

    try {
      body = JSON.parse(req.body.toString());
    } catch {
      return res.sendStatus(400);
    }

    res.sendStatus(200);

    const messages =
      body.entry?.[0]?.changes?.[0]?.value?.messages || [];

    for (const message of messages) {
      if (message.type !== "text") continue;

      const from = message.from;
      const command = message.text.body
        .trim()
        .toLowerCase();

      let reply = "";

      if (command === "hi" || command === "hello") {
        reply = "👑 Welcome to CHAND MD BOT!";
      } else if (command === "!menu") {
        reply =
          "👑 CHAND MD BOT MENU\n\n" +
          "1. !ping\n" +
          "2. !owner\n" +
          "3. !about\n" +
          "4. !help";
      } else if (command === "!ping") {
        reply = "🏓 Pong!\nCHAND MD BOT is Online.";
      } else if (command === "!owner") {
        reply = "👑 Owner: CHAND";
      } else if (command === "!about") {
        reply = "CHAND MD BOT\nVersion: 1.0.0";
      } else if (command === "!help") {
        reply = "Send !menu to see all commands.";
      } else {
        reply = "Command not found. Send !menu";
      }

      try {
        await sendMessage(from, reply);
      } catch (error) {
        console.error("Message Error:", error.message);
      }
    }
  }
);

// Send WhatsApp message
async function sendMessage(to, message) {
  const version = process.env.GRAPH_API_VERSION || "v25.0";

  const url =
    `https://graph.facebook.com/${version}/` +
    `${process.env.PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        `Bearer ${process.env.ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  return result;
}

app.listen(PORT, () => {
  console.log("👑 CHAND MD BOT STARTED!");
});
