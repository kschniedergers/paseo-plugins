import type { RpcInput, RpcOutput } from "@getpaseo/plugin";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MAX_VIDEO_BYTES, VIDEO_MIME_BY_EXTENSION, type readVideoRpc } from "../shared/video";

type Input = RpcInput<typeof readVideoRpc>;
type Output = RpcOutput<typeof readVideoRpc>;

function resolveVideoPath(input: Input): string {
  const raw = input.path.startsWith("~/") ? path.join(os.homedir(), input.path.slice(2)) : input.path;
  return path.isAbsolute(raw) ? raw : path.resolve(input.cwd ?? os.homedir(), raw);
}

function hasVideoMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === ".webm") {
    // EBML header shared by WebM/Matroska.
    return buffer.length >= 4 && buffer.readUInt32BE(0) === 0x1a45dfa3;
  }
  // mp4/mov are ISO BMFF: the first box is "ftyp" at offset 4.
  return buffer.length >= 8 && buffer.toString("latin1", 4, 8) === "ftyp";
}

export async function readVideo(input: Input): Promise<Output> {
  const filePath = resolveVideoPath(input);
  const ext = path.extname(filePath).toLowerCase();
  const mime = VIDEO_MIME_BY_EXTENSION[ext];
  if (!mime) {
    return { ok: false, reason: "not_video" };
  }

  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!stats.isFile()) {
    return { ok: false, reason: "unreadable" };
  }
  if (stats.size > MAX_VIDEO_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  let bytes;
  try {
    bytes = await fs.readFile(filePath);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!hasVideoMagicBytes(bytes, ext)) {
    return { ok: false, reason: "not_video" };
  }
  return { ok: true, base64: bytes.toString("base64"), mime };
}
