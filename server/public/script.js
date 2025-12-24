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
    // UPDATED: Removed localhost, using relative path
    const res = await fetch("/generate-khqr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();
    currentKHQR = data.khqrString;

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

    // Show MD5 and verification
    document.getElementById("md5").innerText = data.md5;
    document.getElementById("verify").innerText = data.isValid
      ? "Valid ✅"
      : "Invalid ❌";

    // Show modal alert
    if (data.alreadyPaid) {
      showModal("Payment has already been completed ✅");
    } else if (data.isValid) {
      showModal("KHQR verification success ✅");
    }
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

  // UPDATED: Removed localhost, using relative path
  await fetch("/complete-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: currentAmount }),
  });

  // Show success modal before redirect
  showModal("Payment marked as completed ✅ Redirecting to ACLEDA App...");

  setTimeout(() => {
    const bankLink = `${baseUrl}&payment_data=${encodeURIComponent(
      currentKHQR
    )}`;
    window.location.href = bankLink;
  }, 2000); // 2 seconds delay for modal
}

function showModal(msg) {
  const modal = document.getElementById("modal");
  document.getElementById("modalText").innerText = msg;
  modal.style.display = "block";
  setTimeout(() => (modal.style.display = "none"), 3000); // auto-hide after 3 sec
}
