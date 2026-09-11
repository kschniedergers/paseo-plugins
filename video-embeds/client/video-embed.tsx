import { useAgent, useRpc, type PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { readVideoRpc, type VideoEmbedData } from "../shared/video";
import { createMediaUrl, isWeb, renderVideoElement, revokeMediaUrl } from "./web";

export function VideoEmbed({ item, theme, host, agentId }: PluginTimelineItemProps<VideoEmbedData>) {
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
}: {
  path: string;
  label: string;
  cwd: string | undefined;
  hostId: string;
  theme: PluginTimelineItemProps["theme"];
}) {
  const readVideo = useRpc(readVideoRpc);
  const query = useQuery({
    queryKey: ["video-embed", hostId, cwd ?? null, path],
    queryFn: () => readVideo({ path, cwd }),
    enabled: isWeb,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const media = query.data?.ok ? query.data : null;
  const mediaUrl = useMemo(
    () => (media ? createMediaUrl(media.base64, media.mime) : null),
    [media],
  );
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        revokeMediaUrl(mediaUrl);
      }
    };
  }, [mediaUrl]);

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

  let message: string | null = null;
  if (!isWeb) {
    message = `▶ ${label || fileName} — video embeds play in the web and desktop apps.`;
  } else if (query.isPending) {
    message = "Loading video…";
  } else if (!mediaUrl) {
    message = "Video preview unavailable.";
  }
  if (message) {
    return (
      <View style={[styles.frame, styles.state]}>
        <Text style={styles.muted}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.frame}>{renderVideoElement({ src: mediaUrl ?? "", label: label || fileName })}</View>
  );
}
