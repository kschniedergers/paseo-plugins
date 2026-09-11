import type { PluginClientContext } from "@getpaseo/plugin/client";
import { VideoEmbed } from "./client/video-embed";
import { parseVideoSegments, VIDEO_EMBED_KIND, videoEmbedSchema } from "./shared/video";

export default function contribute(client: PluginClientContext) {
  client.addTimelineTransformer({
    id: "video-embeds",
    query: { itemType: "assistant_message" },
    transform({ item }) {
      const segments = parseVideoSegments(item.text);
      if (!segments) {
        return undefined;
      }
      return {
        items: [{ type: "plugin", kind: VIDEO_EMBED_KIND, version: 1, data: { segments } }],
      };
    },
  });
  client.addTimelineRenderer({
    kind: VIDEO_EMBED_KIND,
    version: 1,
    schema: videoEmbedSchema,
    Component: VideoEmbed,
  });
  return () => {};
}
