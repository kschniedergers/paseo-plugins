import { describe, expect, it } from "vitest";
import { transformAssistantMessage } from "./video.shared";

function transform(text: string) {
  return transformAssistantMessage({ item: { type: "assistant_message", text } });
}

describe("transformAssistantMessage", () => {
  it("replaces a pure video message with a single video segment", () => {
    const result = transform("![clip](/tmp/demo/clip.mp4)");
    expect(result).toEqual({
      items: [
        {
          type: "plugin",
          kind: "video-embed",
          version: 1,
          data: {
            segments: [{ kind: "video", path: "/tmp/demo/clip.mp4", label: "clip" }],
          },
        },
      ],
    });
  });

  it("keeps surrounding prose as text segments", () => {
    const result = transform(
      "Here is the recorded clip:\n\n![clip](/tmp/demo/clip.mp4)\n\nLet me know what you think.",
    );
    expect(result?.items[0]?.data).toEqual({
      segments: [
        { kind: "text", text: "Here is the recorded clip:" },
        { kind: "video", path: "/tmp/demo/clip.mp4", label: "clip" },
        { kind: "text", text: "Let me know what you think." },
      ],
    });
  });

  it("handles multiple videos, relative paths, and markdown titles", () => {
    const result = transform(
      '![a](screenshots/one.webm)\n![b](</tmp/with space/two.MOV> "title")',
    );
    expect(result?.items[0]?.data).toEqual({
      segments: [
        { kind: "video", path: "screenshots/one.webm", label: "a" },
        { kind: "video", path: "/tmp/with space/two.MOV", label: "b" },
      ],
    });
  });

  it("leaves messages without video embeds untouched", () => {
    expect(transform("just some text")).toBeUndefined();
    expect(transform("![shot](/tmp/screen.png)")).toBeUndefined();
  });

  it("leaves messages mixing video and non-video images untouched", () => {
    expect(
      transform("![shot](/tmp/screen.png)\n![clip](/tmp/clip.mp4)"),
    ).toBeUndefined();
  });
});
