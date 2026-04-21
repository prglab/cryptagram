#!/usr/bin/env python3

import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

# Import shared codec logic from harness directory
sys.path.append(str(Path(__file__).resolve().parents[1] / "harness"))
from codec_util import BacchantCodec, AestheteCodec

def sjcl_decrypt(repo_root, password, iv, salt, ct):
    payload = json.dumps({"iv": iv, "salt": salt, "ct": ct})
    js = (
        "const sjcl=require('./extension/chrome/sjcl.js');"
        "const pwd=process.argv[1];"
        "const data=process.argv[2];"
        "try{const out=sjcl.decrypt(pwd,data);process.stdout.write(out);}catch(e){process.exit(3);}"
    )
    proc = subprocess.run(
        ["node", "-e", js, password, payload],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    return proc.stdout

def decrypt_legacy(ciphertext, password, codec, repo_root):
    if codec == "bacchant":
        if len(ciphertext) < 66:
            return None
        check = ciphertext[:32]
        iv = ciphertext[32:54]
        salt = ciphertext[54:65]
        ct = ciphertext[65:]
        full = iv + salt + ct
        md5 = hashlib.md5(full.encode("utf-8")).hexdigest()
        if md5 != check:
            return None
        return sjcl_decrypt(repo_root, password, iv, salt, ct)

    if codec == "aesthete":
        if len(ciphertext) < 98:
            return None
        check = ciphertext[:64]
        iv = ciphertext[64:86]
        salt = ciphertext[86:97]
        ct = ciphertext[97:]
        full = iv + salt + ct
        sha = hashlib.sha256(full.encode("utf-8")).hexdigest()
        if sha != check:
            return None
        return sjcl_decrypt(repo_root, password, iv, salt, ct)

    return None

def detect_codec(img):
    if BacchantCodec().decode(img)[0] is not None:
        return "bacchant"
    if AestheteCodec().decode(img)[0] is not None:
        return "aesthete"
    return None

def apply_mutations(img, case):
    mutate_pixel = case.get("mutate_pixel")
    if not mutate_pixel:
        return img

    rgb = img.convert("RGB")
    pixels = rgb.load()
    x = int(mutate_pixel["x"])
    y = int(mutate_pixel["y"])
    dr = int(mutate_pixel.get("dr", 0))
    dg = int(mutate_pixel.get("dg", 0))
    db = int(mutate_pixel.get("db", 0))

    r, g, b = pixels[x, y]
    pixels[x, y] = (
        max(0, min(255, r + dr)),
        max(0, min(255, g + dg)),
        max(0, min(255, b + db)),
    )
    return rgb

def run_case(repo_root, case):
    image_path = repo_root / case["image_path"]
    if not image_path.exists():
        return False, f"missing image: {case['image_path']}"

    with Image.open(image_path) as img:
        img = apply_mutations(img, case)
        codec_name = detect_codec(img)
        
        if codec_name is None:
            return False, "codec detection failed"
            
        expected_codec = case.get("expected_codec")
        if expected_codec and expected_codec != codec_name:
            return False, f"codec mismatch: expected {expected_codec}, got {codec_name}"

        codec = BacchantCodec() if codec_name == "bacchant" else AestheteCodec()
        payload, status = codec.decode(img)
        
        if payload is None:
            return False, f"{codec_name} payload decode failed: {status}"

        decrypted = decrypt_legacy(payload, case["password"], codec_name, repo_root)
        success = decrypted is not None

        if success:
            try:
                raw = base64.b64decode(decrypted, validate=True)
                if len(raw) < 4 or raw[0] != 0xFF or raw[1] != 0xD8:
                    return False, f"{codec_name} decrypt payload does not look like JPEG"
            except Exception:
                return False, f"{codec_name} decrypt returned non-base64 payload"

        expect_success = bool(case["expect_success"])
        if expect_success != success:
            return (
                False,
                f"{codec_name} success mismatch: expected {expect_success}, got {success}",
            )

        return True, f"{codec_name} {'success' if success else 'expected-failure'}"

def main():
    repo_root = Path(__file__).resolve().parents[2]
    cases_path = Path(__file__).resolve().parent / "cases.json"
    
    with open(cases_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    failures = []
    for case in cases:
        ok, msg = run_case(repo_root, case)
        line = f"{case['id']}: {msg}"
        if ok:
            print(f"PASS {line}")
        else:
            print(f"FAIL {line}")
            failures.append(line)

    if failures:
        print(f"\nDecode smoke failed with {len(failures)} failure(s).", file=sys.stderr)
        sys.exit(1)

    print(f"\nDecode smoke passed ({len(cases)} case(s)).")

if __name__ == "__main__":
    main()
