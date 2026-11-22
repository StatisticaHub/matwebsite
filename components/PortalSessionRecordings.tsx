import { createAdminClient } from "@/lib/supabase/admin";

type RecordingRow = {
  id: string;
  file_type: string | null;
  file_extension: string | null;
  recording_type: string | null;
  file_size_bytes: number | null;
  recording_start: string | null;
  recording_end: string | null;
};

function fileLabel(fileType: string | null) {
  const type = String(fileType || "").toUpperCase();
  if (type === "MP4") return "Lesson recording";
  if (type === "M4A") return "Audio recording";
  if (type === "VTT" || type === "TRANSCRIPT") return "Transcript";
  return "Lesson file";
}

function actionLabel(fileType: string | null) {
  const type = String(fileType || "").toUpperCase();
  if (type === "MP4") return "Watch recording ↗";
  if (type === "M4A") return "Listen to audio ↗";
  if (type === "VTT" || type === "TRANSCRIPT") return "Open transcript ↗";
  return "Open ↗";
}

function formatBytes(value: number | null) {
  if (value === null || value < 0) return null;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PortalSessionRecordings({
  token,
  sessionId,
}: {
  token: string;
  sessionId: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("session_recordings")
    .select(
      "id,file_type,file_extension,recording_type,file_size_bytes,recording_start,recording_end"
    )
    .eq("session_id", sessionId)
    .eq("student_visible", true)
    .eq("status", "completed")
    .in("file_type", ["MP4", "M4A", "VTT", "TRANSCRIPT"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load student session recordings:", error);
    return null;
  }

  const recordings = (data || []) as RecordingRow[];
  if (!recordings.length) return null;

  return (
    <div className="portal-session-recordings">
      <span className="portal-session-recordings-label">Lesson recordings</span>

      <div className="portal-session-recordings-list">
        {recordings.map((recording) => {
          const size = formatBytes(recording.file_size_bytes);

          return (
            <div className="portal-session-recording" key={recording.id}>
              <div>
                <strong>{fileLabel(recording.file_type)}</strong>
                <small>
                  {[recording.file_extension || recording.file_type, size]
                    .filter(Boolean)
                    .join(" · ")}
                </small>

              </div>

              <a
                className="button button-secondary portal-recording-button"
                href={`/api/portal/${encodeURIComponent(token)}/recordings/${recording.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {actionLabel(recording.file_type)}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
