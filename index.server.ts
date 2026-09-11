import type { PluginServerContext } from "@getpaseo/plugin/server";
import { readVideo } from "./server/read-video";
import { readVideoRpc } from "./shared/video";

export default function contribute(server: PluginServerContext) {
  server.handle(readVideoRpc, readVideo);
  return () => {};
}
