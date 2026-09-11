# paseo-plugins

Plugins for [Paseo](https://paseo.sh). One folder per plugin, each self-contained.

| Plugin                            | ID             | What it does                                                                                              |
| --------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| [`video-embeds/`](video-embeds)   | `video-embeds` | Renders `![clip](/path.mp4)` in assistant messages as an inline video player — mp4, webm, mov, with audio. Mobile shows a placeholder card. |

## Install

Plugins install individually:

```bash
paseo plugin add kschniedergers/paseo-plugins --path video-embeds
```

Pin a release with `--ref <tag>`, or follow `main` and run `paseo plugin update --all`. Each plugin
declares the Paseo versions it supports in its `paseo-plugin.json`.

## Develop

Every plugin is a standalone TypeScript project: `cd <plugin> && npm install && npm run typecheck && npm test`.
CI runs the same for each folder that has a `paseo-plugin.json`.
