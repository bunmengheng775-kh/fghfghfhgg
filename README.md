# Velo — Video Converter

A browser-based video converter built with React, Vite, and FFmpeg WebAssembly. It can extract MP3 audio from a video or transcode video into MP4.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Deploy to Vercel

1. Create a GitHub repository and upload these project files.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel should detect Vite automatically.
4. Use these settings if prompted:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
5. Click **Deploy**.

No server-side API or environment variables are required. FFmpeg WebAssembly core files are loaded from jsDelivr on the first conversion, so the deployed site needs internet access to that CDN.

## Important limitations

- Conversion runs on the visitor's device. The site does not upload their video to your server.
- The UI rejects files larger than 500 MB, but much smaller files may still fail on phones or devices with limited memory.
- The first conversion can take time because the FFmpeg engine must load.
- MP4 output re-encodes video with H.264 and audio with AAC, which can be CPU-intensive.
- This is a client-side demo, not a high-throughput conversion service. For reliable large-file conversion, use a dedicated backend/worker with upload limits, job queues, timeouts, and automatic file deletion.
- Convert only videos you own or have permission to process.
