import { defineRpc } from "@getpaseo/plugin/server";
import { z } from "zod";

export const readVideoRpc = defineRpc({
  name: "video.read",
  input: z.object({ path: z.string(), cwd: z.string().optional() }),
  output: z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), base64: z.string(), mime: z.string() }),
    z.object({ ok: z.literal(false), reason: z.enum(["too_large", "not_video", "unreadable"]) }),
  ]),
});
