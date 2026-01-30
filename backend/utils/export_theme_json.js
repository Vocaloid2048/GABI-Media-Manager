const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node export_theme_json.js <ThemeFile> <OutJson>');
    process.exit(2);
  }

  const [themePath, outPath] = args;
  const protoDir = path.join(__dirname, 'proto');
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith('.proto')).map(f => path.join(protoDir, f));

  const root = await protobuf.load(protoFiles);
  const buf = fs.readFileSync(themePath);

  const candidates = [
    'rv.data.Template.Document',
    'rv.data.Template.Slide',
    'rv.data.Slide',
    'rv.data.MessageDocument',
    'rv.data.TestPatternDocument',
    'rv.data.API_v1_Theme',
    'rv.data.Presentation',
    'rv.data.PresentationSlide',
    'rv.data.PlaylistDocument'
  ];

  let decoded = null;
  let usedType = null;

  for (const t of candidates) {
    const type = root.lookupType(t);
    if (!type) continue;
    try {
      const msg = type.decode(buf);
      // Convert to plain object with defaults
      const obj = type.toObject(msg, { longs: String, enums: String, bytes: String, defaults: true });
      // Heuristic: successful if has slides or elements or application_info
      if (obj && (obj.slides || obj.elements || obj.application_info || obj.themes)) {
        decoded = obj;
        usedType = t;
        break;
      }
    } catch (e) {
      // ignore decode errors
    }
  }

  if (!decoded) {
    // fallback: try to save raw bytes as base64 in JSON
    fs.writeFileSync(outPath, JSON.stringify({ error: 'unable to decode with available types', base64: buf.toString('base64') }, null, 2));
    console.error('Unable to decode Theme file with candidate proto types. Wrote base64 fallback JSON to', outPath);
    process.exit(1);
  }

  const out = { _decodedWith: usedType, data: decoded };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote JSON to', outPath, 'decoded with', usedType);
}

main().catch(err => { console.error(err); process.exit(1); });
