import type { PluginContext } from "@getpaseo/plugin";
import { VideoEmbed } from "./video.client";
import { readVideo } from "./video.server";
import { readVideoRpc } from "./video.rpc";
import {
  transformAssistantMessage,
  VIDEO_EMBED_KIND,
  videoEmbedSchema,
} from "./video.shared";

export default function contribute(plugin: PluginContext) {
  plugin.handle(readVideoRpc, readVideo);
  plugin.addTimelineTransformer({
    id: "video-embeds",
    query: { itemType: "assistant_message" },
    transform: transformAssistantMessage,
  });
  plugin.addTimelineRenderer({
    kind: VIDEO_EMBED_KIND,
    version: 1,
    schema: videoEmbedSchema,
    Component: VideoEmbed,
  });
  return () => {};
}
