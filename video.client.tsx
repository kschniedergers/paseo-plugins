import { useAgent, useRpc, type PluginTimelineItemProps } from "@getpaseo/plugin";
import { useQuery } from "@tanstack/react-query";
import React, { createElement, useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { readVideoRpc } from "./video.rpc";
import type { VideoEmbedData } from "./video.shared";

export function VideoEmbed({
  item,
  theme,
  layout,
  host,
  agentId,
}: PluginTimelineItemProps<VideoEmbedData>) {
  const agent = useAgent(agentId, ({ cwd }) => ({ cwd }));
  const styles = useMemo(
    () => ({
      container: { gap: 12 },
      prose: { color: theme.colors.foreground, fontSize: 15, lineHeight: 22 },
    }),
    [theme],
  );

  return (
    <View style={styles.container}>
      {item.data.segments.map((segment, index) =>
        segment.kind === "text" ? (
          <Text key={`text-${index}`} style={styles.prose}>
            {segment.text}
          </Text>
        ) : (
          <VideoSegment
            key={`video-${index}`}
            path={segment.path}
            label={segment.label}
            cwd={agent?.cwd}
            hostId={host.id}
            theme={theme}
            platform={layout.platform}
          />
        ),
      )}
    </View>
  );
}

function VideoSegment({
  path,
  label,
  cwd,
  hostId,
  theme,
  platform,
}: {
  path: string;
  label: string;
  cwd: string | undefined;
  hostId: string;
  theme: PluginTimelineItemProps["theme"];
  platform: "ios" | "android" | "web";
}) {
  const readVideo = useRpc(readVideoRpc);
  const query = useQuery({
    queryKey: ["video-embed", hostId, cwd ?? null, path],
    queryFn: () => readVideo({ path, cwd }),
    enabled: platform === "web",
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const media = query.data?.ok ? query.data : null;
  const objectUrl = useMemo(() => {
    if (!media || platform !== "web") {
      return null;
    }
    const bytes = Uint8Array.from(atob(media.base64), (char) => char.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: media.mime }));
  }, [media, platform]);
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const styles = useMemo(
    () => ({
      frame: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 10,
        overflow: "hidden" as const,
        backgroundColor: theme.colors.surface1,
      },
      state: { padding: 16 },
      muted: { color: theme.colors.foregroundMuted, fontSize: 14 },
    }),
    [theme],
  );

  const fileName = path.split("/").pop() ?? path;

  if (platform !== "web") {
    return (
      <View style={[styles.frame, styles.state]}>
        <Text style={styles.muted}>
          ▶ {label || fileName} — video embeds play in the web and desktop apps.
        </Text>
      </View>
    );
  }

  if (query.isPending) {
    return (
      <View style={[styles.frame, styles.state]}>
        <Text style={styles.muted}>Loading video…</Text>
      </View>
    );
  }

  if (!objectUrl) {
    return (
      <View style={[styles.frame, styles.state]}>
        <Text style={styles.muted}>Video preview unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      {createElement("video", {
        src: objectUrl,
        controls: true,
        preload: "metadata",
        "aria-label": label || fileName,
        style: {
          width: "100%",
          aspectRatio: "16 / 9",
          display: "block",
          backgroundColor: "black",
        },
      })}
    </View>
  );
}
