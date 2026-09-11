import { describe, expect, it } from "vitest";
import { parseVideoSegments } from "./video";

describe("parseVideoSegments", () => {
  it("turns a pure video message into a single video segment", () => {
    expect(parseVideoSegments("![clip](/tmp/demo/clip.mp4)")).toEqual([
      { kind: "video", path: "/tmp/demo/clip.mp4", label: "clip" },
    ]);
  });

  it("keeps surrounding prose as text segments", () => {
    expect(
      parseVideoSegments(
        "Here is the recorded clip:\n\n![clip](/tmp/demo/clip.mp4)\n\nLet me know what you think.",
      ),
    ).toEqual([
      { kind: "text", text: "Here is the recorded clip:" },
      { kind: "video", path: "/tmp/demo/clip.mp4", label: "clip" },
      { kind: "text", text: "Let me know what you think." },
    ]);
  });

  it("handles multiple videos, relative paths, and markdown titles", () => {
    expect(
      parseVideoSegments('![a](screenshots/one.webm)\n![b](</tmp/with space/two.MOV> "title")'),
    ).toEqual([
      { kind: "video", path: "screenshots/one.webm", label: "a" },
      { kind: "video", path: "/tmp/with space/two.MOV", label: "b" },
    ]);
  });

  it("leaves messages without video embeds alone", () => {
    expect(parseVideoSegments("just some text")).toBeUndefined();
    expect(parseVideoSegments("![shot](/tmp/screen.png)")).toBeUndefined();
  });

  it("leaves messages mixing video and non-video images alone", () => {
    expect(parseVideoSegments("![shot](/tmp/screen.png)\n![clip](/tmp/clip.mp4)")).toBeUndefined();
  });
});
