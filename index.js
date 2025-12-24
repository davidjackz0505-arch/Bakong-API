const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { BakongKHQR, MerchantInfo, khqrData } = require("bakong-khqr");

const app = express();
app.use(cors());
app.use(express.json());

// Store payments by amount
let payments = {};

app.post("/generate-khqr", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let alreadyPaid =
      payments[amount] && payments[amount].status === "completed";

    // Generate KHQR only if not exists
    let khqrString;
    if (payments[amount] && payments[amount].khqrString) {
      khqrString = payments[amount].khqrString;
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

      const md5 = crypto.createHash("md5").update(khqrString).digest("hex");
      const isValid = BakongKHQR.verify(khqrString).isValid;

      payments[amount] = { khqrString, md5, isValid, status: "pending" };
    }

    // Generate QR image
    const qrImage = await QRCode.toDataURL(payments[amount].khqrString);

    res.json({ alreadyPaid, khqrString, qrImage });
  } catch (err) {
    console.error("KHQR ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Complete payment
app.post("/complete-payment", (req, res) => {
  const { amount } = req.body;
  if (!amount || !payments[amount])
    return res.status(400).json({ error: "Invalid amount" });

  payments[amount].status = "completed";
  res.json({ success: true });
});

app.listen(3000, () =>
  console.log("✅ Backend running at http://localhost:3000")
);
