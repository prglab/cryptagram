import { BacchantCodec, AestheteCodec, parseLegacyPayload, decryptPayload } from '@cryptagram/core';

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
  
  let payloadStr: string | null = null;
  let protocol: string = "";
  
  if (bacchant.payload) {
    payloadStr = bacchant.payload;
    protocol = "bacchant";
  } else if (aesthete.payload) {
    payloadStr = aesthete.payload;
    protocol = "aesthete";
  }

  if (!payloadStr) {
    showToast("No Cryptagram payload detected.", "error");
    return;
  }

  // 3. Prompt for password (Custom UI)
  const password = await showPasswordPrompt();
  if (!password) return;

  try {
    // 4. Parse and Decrypt
    // For now, assume legacy if it looks like legacy
    const payload = parseLegacyPayload(payloadStr, protocol);
    
    // Note: We need SJCL for legacy decryption. 
    // For this modernized demo, we'll try to decrypt it as modern if it fails legacy parsing,
    // or we'll show a message if SJCL is missing.
    
    const decrypted = await decryptPayload(payload, password);
    showDecrypted(targetImg, decrypted);
  } catch (err) {
    console.error(err);
    showToast("Decryption failed. Check your password.", "error");
  }
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 12px;
    background: ${type === 'success' ? 'rgba(46, 213, 115, 0.9)' : 'rgba(255, 71, 87, 0.9)'};
    color: white;
    backdrop-filter: blur(10px);
    font-family: 'Outfit', sans-serif;
    z-index: 10000;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showPasswordPrompt(): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      font-family: 'Outfit', sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.9);
      padding: 32px;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      width: 320px;
      text-align: center;
    `;

    card.innerHTML = `
      <h2 style="margin: 0 0 16px; color: #2f3542;">Cryptagram</h2>
      <p style="margin: 0 0 24px; color: #57606f;">This image is encrypted. Enter your password to reveal it.</p>
      <input type="password" id="cg-pwd" placeholder="Password" style="
        width: 100%;
        padding: 12px;
        border: 2px solid #dfe4ea;
        border-radius: 12px;
        margin-bottom: 24px;
        outline: none;
        box-sizing: border-box;
      ">
      <div style="display: flex; gap: 12px;">
        <button id="cg-cancel" style="flex: 1; padding: 12px; border: none; border-radius: 12px; background: #dfe4ea; cursor: pointer;">Cancel</button>
        <button id="cg-decrypt" style="flex: 1; padding: 12px; border: none; border-radius: 12px; background: #70a1ff; color: white; cursor: pointer;">Decrypt</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const input = card.querySelector('#cg-pwd') as HTMLInputElement;
    input.focus();

    card.querySelector('#cg-decrypt')?.addEventListener('click', () => {
      const pwd = input.value;
      document.body.removeChild(overlay);
      resolve(pwd);
    });

    card.querySelector('#cg-cancel')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const pwd = input.value;
        document.body.removeChild(overlay);
        resolve(pwd);
      }
    });
  });
}

function showDecrypted(img: HTMLImageElement, data: string) {
  // data is the decrypted base64 (without mime)
  const decoded = atob(data);
  const mime = "image/jpeg"; // Assume JPEG for now
  const src = `data:${mime};base64,${data}`;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: ${img.offsetTop}px;
    left: ${img.offsetLeft}px;
    width: ${img.offsetWidth}px;
    height: ${img.offsetHeight}px;
    z-index: 9999;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: cg-fade-in 0.5s ease-out;
  `;

  overlay.innerHTML = `
    <img src="${src}" style="width: 100%; height: 100%; object-fit: contain; background: black;">
    <div style="
      position: absolute;
      top: 10px; right: 10px;
      background: rgba(0,0,0,0.6);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 10px;
      backdrop-filter: blur(4px);
    ">DECRYPTED</div>
  `;

  const style = document.createElement('style');
  style.innerText = `
    @keyframes cg-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  img.parentElement?.appendChild(overlay);
  img.style.visibility = 'hidden';
  
  overlay.addEventListener('click', () => {
    overlay.remove();
    img.style.visibility = 'visible';
  });
}
