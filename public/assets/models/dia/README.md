# Dia 3D Character Model Assets

Place your 3D character asset here:
- Canonical file: `dia.glb` (or `dia.gltf`)
- Path: `/assets/models/dia/dia.glb`

## 30.2 Model Specifications
- Low-to-medium polygon density optimized for real-time WebGL rendering (approx. 20k-60k vertices).
- Facial blend shapes / morph targets:
  - `blink_left`, `blink_right`, `blink`
  - `mouth_open`, `mouth_smile`, `mouth_pucker`
  - `viseme_aa`, `viseme_ee`, `viseme_ih`, `viseme_oh`, `viseme_ou`
- Rigged skeleton with head, neck, spine, and arm bones.
- PBR materials with compressed 1K or 2K textures.

When no custom `.glb` is placed here, Dia automatically renders the high-fidelity procedural stylized 3D companion avatar or falls back gracefully to the canonical 2D transparent sprite.
