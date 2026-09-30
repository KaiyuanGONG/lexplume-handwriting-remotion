# Validation — 2026-09-30

- TypeScript and ESLint pass.
- The actual Remotion composition rendered all 101 frames to H.264 MP4.
- Independent FFmpeg decoding passed: 1920 × 1080, 30 fps, 3.37 seconds.
- The reference contains a silent AAC track (mean and peak approximately -91 dB); the recreation intentionally has no audio.
- A same-frame comparison against the reference was inspected for writing order, feather pose, ink retraction and final logo geometry.
- Whole-frame SSIM after normalizing timestamps: approximately 0.996. The large blank background contributes to this metric; it is not a claim of pixel identity.
- Runtime uses SVG vector geometry and Remotion frame sampling, without replaying the reference video or screenshots.
- The local reference, signed URL, binding credential, rendered outputs and machine-specific authentication files are not part of this repository.

## Commands

```sh
npm ci
npm run lint
npm run typecheck
npm run render
```

For the local render, an existing Chrome executable was supplied with Remotion's `--browser-executable` option. On another machine Remotion can use its managed browser.
