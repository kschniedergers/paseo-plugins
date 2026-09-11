---
name: paseo-video-embeds
description: Show the user a video or screen recording inline in Paseo chat (mp4, webm, mov). Use whenever you have produced or found a recording — browser/Playwright session recordings, simulator or emulator captures, demo clips, proof-of-work videos — so the user can watch it in the chat instead of opening a file.
---

Paseo renders a markdown image whose path ends in `.mp4`, `.webm`, or `.mov` as an inline video player with controls (the video-embeds plugin). Write it on its own line with the absolute path:

```markdown
Here is the recording of the checkout flow:

![checkout flow](/absolute/path/to/checkout.mp4)
```

Rules that make it actually play:

- Use an absolute path (`~` is fine). Paths relative to your working directory also resolve.
- Keep the file under 30 MB, or the embed shows "Video preview unavailable." Re-encode large captures first: `ffmpeg -i in.mov -c:v libx264 -crf 28 -pix_fmt yuv420p -c:a aac out.mp4`
- The file must really be mp4/webm/mov (the daemon checks the header). Audio tracks are kept.
- Don't put images and videos in the same message — a message that mixes them falls back to image rendering. Send images in a separate message.
- Text around the video renders as plain text in that message, so keep it to a short sentence and put formatted content (lists, code, tables) in a separate message.
- Playback works in the desktop and web apps; iOS/Android show a placeholder card with the file name.
