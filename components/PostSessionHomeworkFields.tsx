"use client";

import { useState } from "react";

type Props = {
  defaultTitle: string;
  defaultDescription?: string | null;
};

export default function PostSessionHomeworkFields({
  defaultTitle,
  defaultDescription = null,
}: Props) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div>
      <label className="admin-email-toggle admin-email-toggle-block">
        <input
          name="createHomework"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />

        Create a standalone homework assignment in the student portal
      </label>

      {enabled && (
        <div className="admin-compact-form">
          <p className="admin-help">
            This creates a proper homework item linked to this session.
            The student will see it in Homework &amp; independent work.
          </p>

          <label>
            <span>Homework title</span>

            <input
              name="homeworkTitle"
              required
              defaultValue={defaultTitle}
              placeholder="For example: Topic practice — Questions 1–10"
            />
          </label>

          <label>
            <span>Instructions</span>

            <textarea
              name="homeworkDescription"
              defaultValue={defaultDescription || ""}
              placeholder="What the student should complete, read, revise or submit."
            />
          </label>

          <label>
            <span>Due date</span>

            <input
              name="homeworkDueDate"
              type="date"
            />
          </label>
        </div>
      )}
    </div>
  );
}
