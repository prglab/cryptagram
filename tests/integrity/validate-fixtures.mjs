#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, 'testdata', 'fixtures-manifest.csv');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseManifest(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('fixtures-manifest.csv has no data rows');
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `CSV shape mismatch on data row ${index + 2}: expected ${headers.length}, got ${values.length}`
      );
    }
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = values[i];
    }
    return row;
  });
}

function getImageDimensions(buf) {
  // PNG
  if (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20)
    };
  }

  // GIF
  if (buf.length >= 10 && (buf.toString('ascii', 0, 6) === 'GIF87a' || buf.toString('ascii', 0, 6) === 'GIF89a')) {
    return {
      width: buf.readUInt16LE(6),
      height: buf.readUInt16LE(8)
    };
  }

  // JPEG
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < buf.length && buf[offset] === 0xff) {
        offset += 1;
      }
      if (offset >= buf.length) break;

      const marker = buf[offset];
      offset += 1;

      if (marker === 0xd8 || marker === 0xd9) {
        continue;
      }
      if (offset + 2 > buf.length) break;

      const segmentLen = buf.readUInt16BE(offset);
      if (segmentLen < 2 || offset + segmentLen > buf.length) break;

      // SOF markers with width/height
      const isSof =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSof && segmentLen >= 7) {
        const height = buf.readUInt16BE(offset + 3);
        const width = buf.readUInt16BE(offset + 5);
        return { width, height };
      }

      offset += segmentLen;
    }
  }

  return null;
}

function fail(errors, id, message) {
  errors.push(`[${id}] ${message}`);
}

function run() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }

  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const rows = parseManifest(manifestText);
  const errors = [];

  for (const row of rows) {
    const id = row.id || '<missing-id>';
    const relPath = row.path;
    const expectedSize = Number.parseInt(row.size_bytes, 10);
    const expectedWidth = Number.parseInt(row.width, 10);
    const expectedHeight = Number.parseInt(row.height, 10);
    const expectedSha = (row.sha256 || '').toLowerCase();

    if (!relPath) {
      fail(errors, id, 'Missing path field');
      continue;
    }

    const absPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(absPath)) {
      fail(errors, id, `File not found: ${relPath}`);
      continue;
    }

    const bytes = fs.readFileSync(absPath);
    const actualSize = bytes.length;
    if (!Number.isNaN(expectedSize) && expectedSize !== actualSize) {
      fail(errors, id, `Size mismatch for ${relPath}: expected ${expectedSize}, got ${actualSize}`);
    }

    const actualSha = crypto.createHash('sha256').update(bytes).digest('hex');
    if (expectedSha && expectedSha !== actualSha) {
      fail(errors, id, `SHA-256 mismatch for ${relPath}: expected ${expectedSha}, got ${actualSha}`);
    }

    const dims = getImageDimensions(bytes);
    if (!dims) {
      fail(errors, id, `Could not parse dimensions for ${relPath}`);
      continue;
    }
    if (!Number.isNaN(expectedWidth) && dims.width !== expectedWidth) {
      fail(errors, id, `Width mismatch for ${relPath}: expected ${expectedWidth}, got ${dims.width}`);
    }
    if (!Number.isNaN(expectedHeight) && dims.height !== expectedHeight) {
      fail(errors, id, `Height mismatch for ${relPath}: expected ${expectedHeight}, got ${dims.height}`);
    }
  }

  if (errors.length > 0) {
    console.error(`Fixture manifest validation failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Fixture manifest validation passed (${rows.length} fixture row(s)).`);
}

run();
