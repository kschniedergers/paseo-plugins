import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const VIDEO_EMBED_KIND = "video-embed";

export const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

// The whole file travels through plugin RPC as base64, so keep the same cap
// Paseo's built-in image previews use.
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

export const readVideoRpc = defineRpc({
  name: "video.read",
  input: z.object({ path: z.string(), cwd: z.string().optional() }),
  output: z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), base64: z.string(), mime: z.string() }),
    z.object({ ok: z.literal(false), reason: z.enum(["too_large", "not_video", "unreadable"]) }),
  ]),
});

const segmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("video"), path: z.string(), label: z.string() }),
]);

export const videoEmbedSchema = z.object({ segments: z.array(segmentSchema) });

export type VideoEmbedData = z.output<typeof videoEmbedSchema>;
export type VideoEmbedSegment = VideoEmbedData["segments"][number];

const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)]\((<[^>]+>|[^)\n]+)\)/g;
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)$/i;

function imageSource(token: string): string {
  // Drop an optional markdown title: ![alt](path "title")
  const withoutTitle = /^(.*?)(?:\s+(['"]).*?\2)?$/.exec(token.trim());
  let source = withoutTitle?.[1]?.trim() ?? token.trim();
  if (source.startsWith("<") && source.endsWith(">")) {
    source = source.slice(1, -1).trim();
  }
  return source;
}

export function isVideoSource(source: string): boolean {
  const withoutQuery = source.split(/[?#]/, 1)[0] ?? "";
  return VIDEO_EXTENSION_PATTERN.test(withoutQuery);
}

/**
 * Splits an assistant message into prose and video segments. Returns undefined
 * when the message embeds no videos, or when it also embeds non-video images —
 * a plugin replacement can only emit plugin items, so those messages stay with
 * the host's image rendering.
 */
export function parseVideoSegments(text: string): VideoEmbedSegment[] | undefined {
  const segments: VideoEmbedSegment[] = [];
  let videoCount = 0;
  let cursor = 0;

  for (const match of text.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    const source = imageSource(match[2] ?? "");
    if (!isVideoSource(source)) {
      return undefined;
    }
    const prose = text.slice(cursor, match.index).trim();
    if (prose) {
      segments.push({ kind: "text", text: prose });
    }
    segments.push({ kind: "video", path: source, label: (match[1] ?? "").trim() });
    videoCount += 1;
    cursor = (match.index ?? 0) + match[0].length;
  }

  if (videoCount === 0) {
    return undefined;
  }
  const trailing = text.slice(cursor).trim();
  if (trailing) {
    segments.push({ kind: "text", text: trailing });
  }
  return segments;
}
