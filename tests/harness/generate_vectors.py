#!/usr/bin/env python3

import json
from pathlib import Path
from codec_util import BacchantCodec

def main():
    harness_dir = Path(__file__).parent
    crypto_vectors_path = harness_dir / "crypto_vectors.json"
    
    if not crypto_vectors_path.exists():
        print(f"Error: {crypto_vectors_path} not found. Run generate_crypto_vectors.cjs first.")
        return

    with open(crypto_vectors_path, "r") as f:
        crypto_vectors = json.load(f)

    codec = BacchantCodec()
    golden_vectors = []

    for i, vec in enumerate(crypto_vectors):
        payload = vec["full_payload"]
        img, symbols = codec.encode(payload)
        
        # We don't save the full image in the JSON, but we can save its dimensions and a hash
        import hashlib
        img_bytes = img.tobytes()
        img_hash = hashlib.sha256(img_bytes).hexdigest()
        
        golden_vectors.append({
            "id": f"bacchant_v1_{i}",
            "password": vec["password"],
            "plaintext": vec["plaintext"],
            "salt": vec["salt"],
            "iv": vec["iv"],
            "ct": vec["ct"],
            "full_payload": payload,
            "codec": "bacchant",
            "width": img.width,
            "height": img.height,
            "encoded_symbols": symbols,
            "image_sha256": img_hash
        })
        
        # Save the actual image as a fixture for testing
        fixture_path = harness_dir / f"golden_vector_{i}.png"
        img.save(fixture_path)
        print(f"Saved fixture: {fixture_path}")

    output_path = harness_dir / "golden_vectors.json"
    with open(output_path, "w") as f:
        json.dump(golden_vectors, f, indent=2)
    
    print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
