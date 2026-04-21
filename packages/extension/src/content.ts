import { BacchantCodec, AestheteCodec } from '@cryptagram/core';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DECODE_IMAGE") {
    handleDecode(message.src);
  }
});

async function handleDecode(src: string) {
  const images = document.querySelectorAll('img');
  const targetImg = Array.from(images).find(img => img.src === src);
  
  if (!targetImg) return;

  // 1. Get image data via canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetImg.naturalWidth;
  canvas.height = targetImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.drawImage(targetImg, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 2. Decode
  const bacchant = new BacchantCodec().decode(imageData);
  const aesthete = new AestheteCodec().decode(imageData);
  
  const payload = bacchant.payload || aesthete.payload;
  if (!payload) {
    alert("No Cryptagram payload detected in this image.");
    return;
  }

  // 3. Prompt for password
  const password = prompt("Enter Cryptagram password:");
  if (!password) return;

  // TODO: Implement decryption using @cryptagram/core crypto
  console.log("Found payload:", payload);
  alert("Found encrypted payload! Decryption coming soon.");
}
