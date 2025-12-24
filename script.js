const baseUrl = "https://acledabank.com.kh/acleda?key=khqr";
let currentKHQR = "";
let currentAmount = "";

async function generateKHQR() {
  const amount = document.getElementById("amount").value;
  if (!amount || amount <= 0) {
    alert("Enter a valid amount!");
    return;
  }
  currentAmount = amount;

  try {
    const res = await fetch("https://bakong-api.onrender.com/generate-khqr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    currentKHQR = data.khqrString;

    // Show modal if already paid
    if (data.alreadyPaid) {
      showModal("Payment for this amount is already completed ✅");
    }

    // Draw QR code
    const canvas = document.getElementById("qrCanvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = data.qrImage;
  } catch (err) {
    console.error(err);
    alert("Failed to generate KHQR");
  }
}

async function pay() {
  if (!currentKHQR || !currentAmount) {
    alert("Please generate KHQR first!");
    return;
  }

  // Mark payment completed in backend (simulate)
  await fetch("https://bakong-api.onrender.com/complete-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: currentAmount }),
  });

  // Redirect to ACLEDA with KHQR string
  const bankLink = `${baseUrl}&payment_data=${encodeURIComponent(currentKHQR)}`;
  window.location.href = bankLink;
}

function showModal(msg) {
  document.getElementById("modalText").innerText = msg;
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
