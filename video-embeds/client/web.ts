import { createElement, type ReactElement } from "react";
import { Platform } from "react-native";

// This plugin typechecks without the DOM library. Declare only what this module uses.
declare const atob: (data: string) => string;
declare const Blob: new (parts: Uint8Array[], options: { type: string }) => object;
declare const URL: { createObjectURL(blob: object): string; revokeObjectURL(url: string): void };

export const isWeb = Platform.OS === "web";

/** Base64 video bytes → object URL a <video> can play. Null off the web. */
export function createMediaUrl(base64: string, mime: string): string | null {
  if (!isWeb) {
    return null;
  }
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function revokeMediaUrl(url: string): void {
  if (isWeb) {
    URL.revokeObjectURL(url);
  }
}

/** Native <video> with controls (no autoplay). Only rendered on the web. */
export function renderVideoElement(input: { src: string; label: string }): ReactElement | null {
  if (!isWeb) {
    return null;
  }
  return createElement("video", {
    src: input.src,
    controls: true,
    preload: "metadata",
    "aria-label": input.label,
    style: { width: "100%", aspectRatio: "16 / 9", display: "block", backgroundColor: "black" },
  });
}
