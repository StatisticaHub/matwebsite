type WeeklySession = {
  id: string;
  created_at?: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  status: string;
  topic: string;
  lesson_notes?: string | null;
  understanding_rating?: number | null;
  next_topic?: string | null;
  homework_summary?: string | null;
};

type WeeklyHomework = {
  id: string;
  created_at: string;
  title: string;
  description?: string | null;
  due_date: string | null;
  status: string;
  session_id?: string | null;
  source_session_id?: string | null;
  tutor_feedback?: string | null;
};

type WeeklySubmission = {
  homework_id: string;
  note: string | null;
  submission_url: string | null;
  submitted_at: string;
};

type WeeklyResource = {
  id: string;
  created_at: string;
  session_id: string | null;
  title: string;
  resource_type: string;
  url: string | null;
  note: string | null;
};

type WeeklyMaterial = {
  id: string;
  created_at?: string | null;
  session_id?: string | null;
  title?: string | null;
  original_filename?: string | null;
  file_name?: string | null;
  filename?: string | null;
  category?: string | null;
  uploader_role?: string | null;
  uploaded_by_role?: string | null;
  owner_role?: string | null;
};

type WeeklyRecording = {
  id: string;
  file_type: string | null;
  file_extension: string | null;
  file_size_bytes: number | null;
};

type Props = {
  token: string;
  sessions: WeeklySession[];
  homework: WeeklyHomework[];
  submissions: WeeklySubmission[];
  resources: WeeklyResource[];
  learningMaterials: WeeklyMaterial[];
  recordingsBySession: Map<string, WeeklyRecording[]>;
};

type WeekBucket = {
  key: string;
  start: Date;
  sessions: WeeklySession[];
  looseHomework: WeeklyHomework[];
  looseResources: WeeklyResource[];
  looseMaterials: WeeklyMaterial[];
};

function londonDateParts(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(date);

  const map =
    Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function mondayFor(value: string | Date) {
  const { year, month, day } = londonDateParts(value);
  const local = new Date(Date.UTC(year, month - 1, day));
  const weekday = local.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  local.setUTCDate(local.getUTCDate() + offset);
  return local;
}

function weekKey(value: string | Date) {
  return mondayFor(value).toISOString().slice(0, 10);
}

function formatDay(value: string | null) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Europe/London",
    }
  ).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    }
  ).format(new Date(value));
}

function weekLabel(start: Date) {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const startText =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }
    ).format(start);

  const endText =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(end);

  return `${startText} – ${endText}`;
}

function recordingLabel(type: string | null) {
  const value = String(type || "").toUpperCase();

  if (value === "MP4") return "Watch lesson";
  if (value === "M4A") return "Listen to audio";
  if (value === "VTT" || value === "TRANSCRIPT") return "Open transcript";

  return "Open recording";
}

function materialTitle(item: WeeklyMaterial) {
  return (
    item.title ||
    item.original_filename ||
    item.file_name ||
    item.filename ||
    "Learning file"
  );
}

function materialSource(item: WeeklyMaterial) {
  const role =
    String(
      item.uploader_role ||
        item.uploaded_by_role ||
        item.owner_role ||
        ""
    ).toLowerCase();

  if (role.includes("student")) return "Your upload";
  if (role.includes("tutor")) return "From tutor";

  if (String(item.category || "").toLowerCase() === "submission") {
    return "Your upload";
  }

  return "Learning file";
}

function safeUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function homeworkSessionId(item: WeeklyHomework) {
  return item.source_session_id || item.session_id || null;
}

export default function StudentWeeklyLearningHub({
  token,
  sessions,
  homework,
  submissions,
  resources,
  learningMaterials,
  recordingsBySession,
}: Props) {
  const currentWeekKey = weekKey(new Date());

  const submissionByHomework =
    new Map(
      submissions.map((item) => [
        item.homework_id,
        item,
      ])
    );

  const sessionIds =
    new Set(sessions.map((item) => item.id));

  const buckets = new Map<string, WeekBucket>();

  function ensureWeek(value: string | Date) {
    const key = weekKey(value);
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        key,
        start: mondayFor(value),
        sessions: [],
        looseHomework: [],
        looseResources: [],
        looseMaterials: [],
      };

      buckets.set(key, bucket);
    }

    return bucket;
  }

  ensureWeek(new Date());

  for (const session of sessions) {
    const value =
      session.completed_at ||
      session.scheduled_for ||
      session.created_at;

    if (!value) continue;

    ensureWeek(value).sessions.push(session);
  }

  for (const item of homework) {
    const linkedSession = homeworkSessionId(item);

    if (linkedSession && sessionIds.has(linkedSession)) {
      continue;
    }

    const value = item.created_at || item.due_date;
    if (!value) continue;

    ensureWeek(value).looseHomework.push(item);
  }

  for (const item of resources) {
    if (item.session_id && sessionIds.has(item.session_id)) {
      continue;
    }

    if (!item.created_at) continue;

    ensureWeek(item.created_at).looseResources.push(item);
  }

  for (const item of learningMaterials) {
    if (item.session_id && sessionIds.has(item.session_id)) {
      continue;
    }

    if (!item.created_at) continue;

    ensureWeek(item.created_at).looseMaterials.push(item);
  }

  const nowWeek = mondayFor(new Date()).getTime();

  const weeks =
    [...buckets.values()]
      .sort((a, b) => {
        if (a.key === currentWeekKey) return -1;
        if (b.key === currentWeekKey) return 1;

        const aTime = a.start.getTime();
        const bTime = b.start.getTime();
        const aFuture = aTime > nowWeek;
        const bFuture = bTime > nowWeek;

        if (aFuture && bFuture) return aTime - bTime;
        if (aFuture !== bFuture) return aFuture ? -1 : 1;

        return bTime - aTime;
      })
      .slice(0, 10);

  return (
    <section className="portal-weekly-hub" id="weekly">
      <div className="portal-weekly-hub-head">
        <div>
          <span className="portal-kicker">Weekly learning record</span>
          <h2>Your tutoring, week by week</h2>
          <p>
            Sessions, recordings, tutor files, homework and your submitted work
            stay together in the week they belong to.
          </p>
        </div>

        <a
          className="button button-secondary"
          href={`/portal/${encodeURIComponent(token)}/recordings`}
        >
          All recordings →
        </a>
      </div>

      <div className="portal-week-stack">
        {weeks.map((week) => {
          const isCurrent = week.key === currentWeekKey;
          const weekSessionIds = new Set(week.sessions.map((item) => item.id));

          const weekHomework =
            homework.filter((item) => {
              const sessionId = homeworkSessionId(item);
              return sessionId && weekSessionIds.has(sessionId);
            });

          return (
            <article
              className={`portal-week-card${isCurrent ? " is-current" : ""}`}
              key={week.key}
            >
              <div className="portal-week-card-head">
                <div>
                  <span>{isCurrent ? "This week" : "Week"}</span>
                  <h3>{weekLabel(week.start)}</h3>
                </div>

                <div className="portal-week-counts">
                  <span>
                    {week.sessions.length} session
                    {week.sessions.length === 1 ? "" : "s"}
                  </span>
                  <span>
                    {weekHomework.length + week.looseHomework.length} homework
                  </span>
                </div>
              </div>

              <div className="portal-week-session-list">
                {[...week.sessions]
                  .sort(
                    (a, b) =>
                      new Date(
                        a.completed_at ||
                          a.scheduled_for ||
                          a.created_at ||
                          0
                      ).getTime() -
                      new Date(
                        b.completed_at ||
                          b.scheduled_for ||
                          b.created_at ||
                          0
                      ).getTime()
                  )
                  .map((session) => {
                    const sessionHomework =
                      homework.filter(
                        (item) => homeworkSessionId(item) === session.id
                      );

                    const sessionResources =
                      resources.filter(
                        (item) => item.session_id === session.id
                      );

                    const sessionMaterials =
                      learningMaterials.filter(
                        (item) => item.session_id === session.id
                      );

                    const recordings =
                      recordingsBySession.get(session.id) || [];

                    const lessonDate =
                      session.completed_at ||
                      session.scheduled_for ||
                      null;

                    return (
                      <section
                        className="portal-week-session"
                        key={session.id}
                      >
                        <div className="portal-week-session-head">
                          <div>
                            <span>{formatDateTime(lessonDate)}</span>
                            <h4>{session.topic}</h4>
                            <small>{session.duration_minutes} min</small>
                          </div>

                          <span
                            className={`portal-status session-${session.status}`}
                          >
                            {session.status}
                          </span>
                        </div>

                        {session.lesson_notes && (
                          <div className="portal-week-note">
                            <span>Lesson notes</span>
                            <p>{session.lesson_notes}</p>
                          </div>
                        )}

                        {recordings.length > 0 && (
                          <div className="portal-week-section">
                            <div className="portal-week-section-title">
                              <span>Recordings</span>
                            </div>

                            <div className="portal-week-link-grid">
                              {recordings.map((recording) => (
                                <a
                                  key={recording.id}
                                  className="portal-week-file-link"
                                  href={`/api/portal/${encodeURIComponent(
                                    token
                                  )}/recordings/${recording.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <strong>
                                    {recordingLabel(recording.file_type)}
                                  </strong>
                                  <span>
                                    {String(
                                      recording.file_extension ||
                                        recording.file_type ||
                                        "Recording"
                                    ).toUpperCase()}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {(sessionResources.length > 0 ||
                          sessionMaterials.length > 0) && (
                          <div className="portal-week-section">
                            <div className="portal-week-section-title">
                              <span>Files & resources</span>
                            </div>

                            <div className="portal-week-link-grid">
                              {sessionMaterials.map((material) => (
                                <a
                                  key={material.id}
                                  className="portal-week-file-link"
                                  href={`/api/portal/${encodeURIComponent(
                                    token
                                  )}/materials/${material.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <strong>{materialTitle(material)}</strong>
                                  <span>{materialSource(material)}</span>
                                </a>
                              ))}

                              {sessionResources.map((resource) => {
                                const href = safeUrl(resource.url);

                                return href ? (
                                  <a
                                    key={resource.id}
                                    className="portal-week-file-link"
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <strong>{resource.title}</strong>
                                    <span>{resource.resource_type}</span>
                                  </a>
                                ) : (
                                  <div
                                    key={resource.id}
                                    className="portal-week-file-link is-static"
                                  >
                                    <strong>{resource.title}</strong>
                                    <span>{resource.resource_type}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {sessionHomework.length > 0 && (
                          <div className="portal-week-section">
                            <div className="portal-week-section-title">
                              <span>Homework</span>
                            </div>

                            <div className="portal-week-homework-list">
                              {sessionHomework.map((item) => {
                                const submission =
                                  submissionByHomework.get(item.id);

                                const submissionUrl =
                                  safeUrl(
                                    submission?.submission_url || null
                                  );

                                return (
                                  <div
                                    className="portal-week-homework"
                                    key={item.id}
                                  >
                                    <div>
                                      <strong>{item.title}</strong>
                                      <span>
                                        {item.due_date
                                          ? `Due ${formatDay(item.due_date)}`
                                          : "No due date"}
                                        {" · "}
                                        {item.status}
                                      </span>

                                      {item.description && (
                                        <p>{item.description}</p>
                                      )}
                                    </div>

                                    {item.tutor_feedback && (
                                      <div className="portal-feedback">
                                        <span>
                                          Tutor feedback
                                        </span>

                                        <p>
                                          {item.tutor_feedback}
                                        </p>
                                      </div>
                                    )}

                                    {item.status === "reviewed" &&
                                      item.tutor_feedback && (
                                        <div className="portal-homework-next-step">
                                          <strong>
                                            Next step
                                          </strong>

                                          <p>
                                            Review your tutor&apos;s feedback.
                                            If changes were requested, revise
                                            your work and submit it again.
                                          </p>
                                        </div>
                                      )}

                                    {item.status === "completed" && (
                                      <div className="portal-homework-next-step is-complete">
                                        <strong>
                                          Complete
                                        </strong>

                                        <p>
                                          Your tutor has marked this work
                                          complete. No further action is
                                          required.
                                        </p>
                                      </div>
                                    )}

                                    {submission && (
                                      <div className="portal-week-submission">
                                        <span>
                                          Submitted{" "}
                                          {formatDay(submission.submitted_at)}
                                        </span>

                                        {submission.note && (
                                          <p>{submission.note}</p>
                                        )}

                                        {submissionUrl && (
                                          <a
                                            href={submissionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            Open submitted work ↗
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {session.next_topic && (
                          <div className="portal-week-next">
                            <span>Next focus</span>
                            <strong>{session.next_topic}</strong>
                          </div>
                        )}
                      </section>
                    );
                  })}

                {!week.sessions.length && (
                  <div className="portal-week-empty">
                    No lesson was recorded in this week yet.
                  </div>
                )}
              </div>

              {(week.looseMaterials.length > 0 ||
                week.looseResources.length > 0) && (
                <section className="portal-week-loose-section">
                  <div className="portal-week-section-title">
                    <span>Files uploaded this week</span>
                  </div>

                  <div className="portal-week-link-grid">
                    {week.looseMaterials.map((material) => (
                      <a
                        key={material.id}
                        className="portal-week-file-link"
                        href={`/api/portal/${encodeURIComponent(
                          token
                        )}/materials/${material.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <strong>{materialTitle(material)}</strong>
                        <span>{materialSource(material)}</span>
                      </a>
                    ))}

                    {week.looseResources.map((resource) => {
                      const href = safeUrl(resource.url);

                      return href ? (
                        <a
                          key={resource.id}
                          className="portal-week-file-link"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <strong>{resource.title}</strong>
                          <span>{resource.resource_type}</span>
                        </a>
                      ) : (
                        <div
                          key={resource.id}
                          className="portal-week-file-link is-static"
                        >
                          <strong>{resource.title}</strong>
                          <span>{resource.resource_type}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {week.looseHomework.length > 0 && (
                <section className="portal-week-loose-section">
                  <div className="portal-week-section-title">
                    <span>Independent homework</span>
                  </div>

                  <div className="portal-week-homework-list">
                    {week.looseHomework.map((item) => {
                      const submission =
                        submissionByHomework.get(item.id);

                      const submissionUrl =
                        safeUrl(
                          submission?.submission_url || null
                        );

                      return (
                        <div
                          className="portal-week-homework"
                          key={item.id}
                        >
                          <div>
                            <strong>{item.title}</strong>
                            <span>
                              {item.due_date
                                ? `Due ${formatDay(item.due_date)}`
                                : "No due date"}
                              {" · "}
                              {item.status}
                            </span>
                          </div>

                          {item.tutor_feedback && (
                                      <div className="portal-feedback">
                                        <span>
                                          Tutor feedback
                                        </span>

                                        <p>
                                          {item.tutor_feedback}
                                        </p>
                                      </div>
                                    )}

                                    {item.status === "reviewed" &&
                                      item.tutor_feedback && (
                                        <div className="portal-homework-next-step">
                                          <strong>
                                            Next step
                                          </strong>

                                          <p>
                                            Review your tutor&apos;s feedback.
                                            If changes were requested, revise
                                            your work and submit it again.
                                          </p>
                                        </div>
                                      )}

                                    {item.status === "completed" && (
                                      <div className="portal-homework-next-step is-complete">
                                        <strong>
                                          Complete
                                        </strong>

                                        <p>
                                          Your tutor has marked this work
                                          complete. No further action is
                                          required.
                                        </p>
                                      </div>
                                    )}

                                    {submission && (
                            <div className="portal-week-submission">
                              <span>
                                Submitted{" "}
                                {formatDay(submission.submitted_at)}
                              </span>

                              {submission.note && (
                                <p>{submission.note}</p>
                              )}

                              {submissionUrl && (
                                <a
                                  href={submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open submitted work ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
