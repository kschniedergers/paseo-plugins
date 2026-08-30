# video-embeds

Paseo plugin that renders `![clip](/path/to/file.mp4)` in assistant messages as an inline
`<video controls>` player. Also handles `.webm` and `.mov`.

- A timeline transformer matches `assistant_message` items containing video markdown and splits
  them into prose + video segments. Messages that also embed non-video images are left to the host
  (a transformer can only replace a whole item with plugin items).
- The renderer fetches bytes over plugin RPC — the daemon-side handler reads the file with plain
  `fs`, resolves relative paths against the agent's cwd, expands `~`, enforces a 30 MB cap, and
  sniffs magic bytes (`ftyp` / EBML). Failures render as quiet "Video preview unavailable." text.
- Playback is web/desktop only (plugins cannot ship native modules); iOS/Android show a labeled
  fallback card. Audio tracks play — bytes pass through untouched.

Requires a host with plugin timeline rendering: Paseo v0.7.0-beta.1 or newer.

```bash
npm install          # dev deps (typecheck + tests only)
npm run typecheck
npm test
paseo plugin install /home/kai/Code/paseo-plugins/video-embeds
```

The daemon needs `"pluginsEnabled": true` in its `config.json`. After editing plugin source, run
`paseo plugin reload video-embeds`.
