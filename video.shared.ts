import type { PluginTimelineTransformerContribution } from "@getpaseo/plugin";
import { z } from "zod";

export const VIDEO_EMBED_KIND = "video-embed";

export const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

// The whole file travels through plugin RPC as base64, so keep the same cap
// the core image pipeline uses for previews.
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

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

type AssistantMessageTransformer =
  PluginTimelineTransformerContribution<"assistant_message">["transform"];

/**
 * Replaces assistant messages that embed videos with a plugin item. Messages
 * that also embed non-video images are left untouched so the host keeps
 * rendering those; a plugin replacement can only emit plugin items.
 */
export const transformAssistantMessage: AssistantMessageTransformer = ({ item }) => {
  const text = item.text;
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

  return {
    items: [{ type: "plugin", kind: VIDEO_EMBED_KIND, version: 1, data: { segments } }],
  };
};
