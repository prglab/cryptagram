const sjcl = require('../../extension/chrome/sjcl.js');
const fs = require('fs');

function generateVector(plaintext, password) {
  const salt = sjcl.random.randomWords(2, 0); // fixed for deterministic if we want, but let's just generate once
  const iv = sjcl.random.randomWords(2, 0);
  
  // SJCL defaults for Cryptagram
  const params = {
    adata: '',
    iter: 1000,
    ks: 128,
    ts: 64,
    v: 1,
    cipher: 'aes',
    mode: 'ccm',
    salt: sjcl.codec.base64.fromBits(salt),
    iv: sjcl.codec.base64.fromBits(iv)
  };

  const ctJson = sjcl.encrypt(password, plaintext, params);
  const ctObj = JSON.parse(ctJson);
  
  const full = ctObj.iv + ctObj.salt + ctObj.ct;
  const crypto = require('crypto');
  const md5 = crypto.createHash('md5').update(full).digest('hex');
  
  return {
    plaintext: plaintext,
    password: password,
    salt: ctObj.salt,
    iv: ctObj.iv,
    ct: ctObj.ct,
    full_payload: md5 + full
  };
}

const vectors = [
  generateVector('Hello, Cryptagram!', 'password123'),
  generateVector('This is a golden vector.', 'cryptagram'),
  generateVector('A longer payload to test block boundary behavior and ensure the encoder handles it correctly.', 'secret')
];

fs.writeFileSync('tests/harness/crypto_vectors.json', JSON.stringify(vectors, null, 2));
console.log('Generated tests/harness/crypto_vectors.json');
