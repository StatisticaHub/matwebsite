import { createAdminClient } from "@/lib/supabase/admin";

type RecordingRow = {
  id: string;
  file_type: string | null;
  file_extension: string | null;
  recording_type: string | null;
  file_size_bytes: number | null;
  student_visible: boolean;
};

function label(type: string | null) {
  const value = String(type || "").toUpperCase();

  if (value === "MP4") return "Lesson recording";
  if (value === "M4A") return "Audio recording";
  if (value === "VTT" || value === "TRANSCRIPT") return "Transcript";

  return "Lesson file";
}

function action(type: string | null) {
  const value = String(type || "").toUpperCase();

  if (value === "MP4") return "Watch recording ↗";
  if (value === "M4A") return "Listen ↗";
  if (value === "VTT" || value === "TRANSCRIPT") return "Open transcript ↗";

  return "Open ↗";
}

function sizeText(value: number | null) {
  if (value === null || value < 0) return null;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function TutorSessionRecordings({
  sessionId,
}: {
  sessionId: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("session_recordings")
    .select(
      "id,file_type,file_extension,recording_type,file_size_bytes,student_visible"
    )
    .eq("session_id", sessionId)
    .eq("tutor_visible", true)
    .eq("status", "completed")
    .in("file_type", ["MP4", "M4A", "VTT", "TRANSCRIPT"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load tutor session recordings:", error);
    return null;
  }

  const recordings = (data || []) as RecordingRow[];

  if (!recordings.length) {
    return null;
  }

  return (
    <section className="tutor-panel tutor-recordings-panel">
      <div className="tutor-panel-head">
        <div>
          <span className="tutor-eyebrow">Lesson media</span>
          <h2>Session recordings</h2>
        </div>
        <span>{recordings.length} available</span>
      </div>

      <p className="tutor-help">
        Recordings are stored by MAT after Zoom processing. Technical Zoom
        metadata is not shown here.
      </p>

      <div className="tutor-recording-list">
        {recordings.map((recording) => {
          const size = sizeText(recording.file_size_bytes);

          return (
            <article
              className="tutor-recording-card"
              key={recording.id}
            >
              <div className="tutor-recording-copy">
                <strong>{label(recording.file_type)}</strong>
                <small>
                  {[recording.file_extension || recording.file_type, size]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>

              <span
                className={`tutor-recording-visibility ${
                  recording.student_visible ? "shared" : "private"
                }`}
              >
                {recording.student_visible
                  ? "Visible to student"
                  : "Tutor only"}
              </span>

              <a
                className="tutor-secondary-button tutor-recording-open"
                href={`/api/tutor/recordings/${recording.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {action(recording.file_type)}
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
