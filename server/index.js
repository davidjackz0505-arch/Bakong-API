const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const QRCode = require("qrcode");
const fetch = require("node-fetch");
const path = require("path"); // UPDATED: Added path module
const { BakongKHQR, MerchantInfo, khqrData } = require("bakong-khqr");

const app = express();
const port = process.env.PORT || 3000; // UPDATED: Dynamic port for Render

app.use(cors());
app.use(express.json());

// UPDATED: Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// UPDATED: Route to serve index.html for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const BAKONG_API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiMzEwYzRlZTdjNmRlNDcyNyJ9LCJpYXQiOjE3NjYzODgyNTAsImV4cCI6MTc3NDE2NDI1MH0.667BDNwN7lzJUzGM6kJQNYA_T6ceK0kXPNlw0PMQIbE";

let payments = {};

app.post("/generate-khqr", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    let alreadyPaid = false;

    // Check with Bakong API if already paid
    if (payments[amount] && payments[amount].status === "completed") {
      alreadyPaid = true;
    } else {
      try {
        const response = await fetch(
          `https://sandbox.bakongapi.com.kh/check_payment/${amount}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${BAKONG_API_TOKEN}` },
          }
        );
        const result = await response.json();
        if (result.status === "paid") {
          alreadyPaid = true;
          payments[amount] = { status: "completed" };
        }
      } catch (e) {
        console.error("Bakong API check error:", e.message);
      }
    }

    let khqrString, md5, isValid;
    if (payments[amount] && payments[amount].khqrString) {
      khqrString = payments[amount].khqrString;
      md5 = payments[amount].md5;
      isValid = payments[amount].isValid;
    } else {
      const merchantInfo = new MerchantInfo(
        "david_lorn@wing",
        "Lorn David",
        "Phnom Penh",
        123456,
        "0966134020",
        {
          currency: khqrData.currency.khr,
          amount: amount,
          billNumber: "INV-" + Date.now(),
          expirationTimestamp: Date.now() + 2 * 60 * 1000,
        }
      );

      const khqr = new BakongKHQR();
      const response = khqr.generateMerchant(merchantInfo);
      khqrString = response.data.qr;

      md5 = crypto.createHash("md5").update(khqrString).digest("hex");
      isValid = BakongKHQR.verify(khqrString).isValid;

      payments[amount] = { khqrString, md5, isValid, status: "pending" };
    }

    const qrImage = await QRCode.toDataURL(khqrString);

    res.json({ alreadyPaid, khqrString, md5, isValid, qrImage });
  } catch (err) {
    console.error("KHQR ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/complete-payment", (req, res) => {
  const { amount } = req.body;
  if (!amount || !payments[amount])
    return res.status(400).json({ error: "Invalid amount" });

  payments[amount].status = "completed";
  res.json({ success: true });
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
