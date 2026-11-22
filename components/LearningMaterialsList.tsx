import styles from "./LearningMaterials.module.css";
import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";

export type LearningMaterialListItem = {
  id: string;

  created_at:
    | string
    | null;

  title:
    | string
    | null;

  description?:
    | string
    | null;

  category:
    | string
    | null;

  uploaded_by_role:
    | string
    | null;

  original_filename:
    | string
    | null;

  mime_type?:
    | string
    | null;

  size_bytes:
    | number
    | null;

  session_id?:
    | string
    | null;
};

const categoryLabels:
  Record<string, string> = {
    lesson_material:
      "Lesson material",

    worksheet:
      "Worksheet",

    homework:
      "Homework",

    submission:
      "Student submission",

    slides:
      "Slides",

    dataset:
      "Dataset",

    notes:
      "Notes",

    reference:
      "Reference",

    solution:
      "Worked solution",

    other:
      "Other",
  };

function formatFileSize(
  value:
    | number
    | null,
) {
  if (
    !value ||
    value <= 0
  ) {
    return "";
  }

  if (
    value <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        value / 1024,
      ),
    )} KB`;
  }

  return `${(
    value /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function formatDate(
  value: string | null,
  timeZone: string,
) {
  if (!value) {
    return "";
  }

  try {
    return formatDateTimeInTimeZone(
      value,
      timeZone,
    );
  } catch {
    return "";
  }
}

function initials(
  value:
    | string
    | null,
) {
  if (!value) {
    return "F";
  }

  const extension =
    value
      .split(".")
      .pop()
      ?.slice(0, 4)
      .toUpperCase();

  return (
    extension ||
    "FILE"
  );
}

export default function LearningMaterialsList({
  materials,
  downloadBaseUrl,
  viewerRole,
  emptyText,
  limit,
  timeZone,
}: {
  materials:
    LearningMaterialListItem[];

  downloadBaseUrl:
    string;

  viewerRole:
    "student" | "tutor";

  emptyText?: string;

  limit?: number;

  timeZone?: string | null;
}) {
  const viewerTimeZone =
    normalizeTimeZone(
      timeZone,
      DEFAULT_TIME_ZONE,
    );
  const visible =
    typeof limit ===
    "number"
      ? materials.slice(
          0,
          limit,
        )
      : materials;

  if (
    !visible.length
  ) {
    return (
      <div
        className={
          styles.empty
        }
      >
        <div
          className={
            styles.emptyIcon
          }
        >
          F
        </div>

        <div>
          <strong>
            No files yet
          </strong>

          <p>
            {emptyText ||
              (
                viewerRole ===
                "student"
                  ? "Files shared by you or your tutor will appear here."
                  : "Teaching materials and student uploads will appear here."
              )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        styles.materialList
      }
    >
      {visible.map(
        (material) => {
          const uploadedByStudent =
            material.uploaded_by_role ===
            "student";

          const fileSize =
            formatFileSize(
              material.size_bytes,
            );

          return (
            <article
              key={
                material.id
              }
              className={
                styles.materialRow
              }
            >
              <div
                className={
                  styles.fileIcon
                }
                aria-hidden="true"
              >
                {initials(
                  material.original_filename,
                )}
              </div>

              <div
                className={
                  styles.materialCopy
                }
              >
                <div
                  className={
                    styles.materialTop
                  }
                >
                  <strong>
                    {material.title ||
                      material.original_filename ||
                      "Learning file"}
                  </strong>

                  <span
                    className={
                      uploadedByStudent
                        ? styles.studentBadge
                        : styles.tutorBadge
                    }
                  >
                    {uploadedByStudent
                      ? "Student upload"
                      : material.uploaded_by_role ===
                          "admin"
                        ? "MAT material"
                        : "Tutor material"}
                  </span>
                </div>

                <div
                  className={
                    styles.meta
                  }
                >
                  <span>
                    {categoryLabels[
                      material.category ||
                        ""
                    ] ||
                      "Learning material"}
                  </span>

                  {material.original_filename && (
                    <span>
                      {
                        material.original_filename
                      }
                    </span>
                  )}

                  {fileSize && (
                    <span>
                      {
                        fileSize
                      }
                    </span>
                  )}

                  {material.created_at && (
                    <span>
                      {formatDate(
                        material.created_at,
                        viewerTimeZone,
                      )}
                    </span>
                  )}
                </div>

                {material.description && (
                  <p
                    className={
                      styles.description
                    }
                  >
                    {
                      material.description
                    }
                  </p>
                )}
              </div>

              <a
                className={
                  styles.downloadButton
                }
                href={`${downloadBaseUrl}/${encodeURIComponent(
                  material.id,
                )}`}
              >
                Download
              </a>
            </article>
          );
        },
      )}
    </div>
  );
}
