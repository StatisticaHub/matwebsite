"use client";

import {
  FormEvent,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

import styles from "./LearningMaterials.module.css";

type Props = {
  role: "student" | "tutor";

  endpoint: string;

  engagementId: string;

  studentId?: string | null;

  weekId?: string | null;

  sessionId?: string | null;

  defaultCategory?: string;

  compact?: boolean;
};

const categoryOptions = [
  ["lesson_material", "Lesson material"],
  ["worksheet", "Worksheet / practice"],
  ["homework", "Homework"],
  ["submission", "Student submission"],
  ["slides", "Slides"],
  ["dataset", "Dataset"],
  ["notes", "Notes"],
  ["reference", "Reference material"],
  ["solution", "Worked solution"],
  ["other", "Other"],
];

const acceptedFiles = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".txt",
  ".json",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".zip",
  ".r",
  ".py",
  ".sas",
  ".do",
].join(",");

type Status =
  | "idle"
  | "preparing"
  | "uploading"
  | "saving"
  | "success"
  | "error";

export default function LearningMaterialUploadForm({
  role,
  endpoint,
  engagementId,
  studentId,
  weekId = null,
  sessionId = null,
  defaultCategory,
  compact = false,
}: Props) {
  const router =
    useRouter();

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const [
    status,
    setStatus,
  ] =
    useState<Status>(
      "idle",
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const loading =
    [
      "preparing",
      "uploading",
      "saving",
    ].includes(status);

  async function responseJson(
    response: Response,
  ) {
    return response
      .json()
      .catch(
        () => null,
      );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form =
      new FormData(
        event.currentTarget,
      );

    const file =
      form.get(
        "materialFile",
      );

    if (
      !(file instanceof File) ||
      file.size <= 0
    ) {
      setStatus("error");
      setMessage(
        "Choose a file to upload.",
      );
      return;
    }

    if (
      file.size >
      50 * 1024 * 1024
    ) {
      setStatus("error");
      setMessage(
        "Files must be 50 MB or smaller.",
      );
      return;
    }

    const title =
      String(
        form.get(
          "materialTitle",
        ) || "",
      ).trim();

    const description =
      String(
        form.get(
          "materialDescription",
        ) || "",
      ).trim();

    const category =
      String(
        form.get(
          "materialCategory",
        ) ||
          defaultCategory ||
          (
            role === "student"
              ? "submission"
              : "lesson_material"
          ),
      );

    const metadata = {
      engagementId,

      ...(weekId
        ? {
            weekId,
          }
        : {}),

      ...(studentId
        ? {
            studentId,
          }
        : {}),

      ...(sessionId
        ? {
            sessionId,
          }
        : {}),

      filename:
        file.name,

      mimeType:
        file.type ||
        "application/octet-stream",

      sizeBytes:
        file.size,

      title:
        title ||
        file.name,

      description,

      category,
    };

    try {
      setStatus(
        "preparing",
      );

      setMessage(
        "Preparing secure upload…",
      );

      /*
       * Step 1:
       * Ask the authenticated MAT route for a
       * short-lived signed Storage upload token.
       */
      const prepareResponse =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                metadata,
              ),
          },
        );

      const prepared =
        await responseJson(
          prepareResponse,
        );

      if (
        !prepareResponse.ok ||
        !prepared?.bucket ||
        !prepared?.path ||
        !prepared?.token
      ) {
        throw new Error(
          prepared?.error ||
            "Could not prepare the upload.",
        );
      }

      setStatus(
        "uploading",
      );

      setMessage(
        "Uploading file securely…",
      );

      /*
       * Step 2:
       * Upload directly to the private Supabase
       * bucket. The file bytes never pass through
       * the Next.js application server.
       */
      const supabase =
        createClient();

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            prepared.bucket,
          )
          .uploadToSignedUrl(
            prepared.path,
            prepared.token,
            file,
          );

      if (uploadError) {
        throw new Error(
          uploadError.message ||
            "File upload failed.",
        );
      }

      setStatus(
        "saving",
      );

      setMessage(
        "Adding file to the learning workspace…",
      );

      /*
       * Step 3:
       * The server validates that the file now
       * exists and records its metadata.
       */
      const saveResponse =
        await fetch(
          endpoint,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...metadata,

                storagePath:
                  prepared.path,
              }),
          },
        );

      const saved =
        await responseJson(
          saveResponse,
        );

      if (
        !saveResponse.ok ||
        !saved?.ok
      ) {
        throw new Error(
          saved?.error ||
            "The file uploaded but could not be added to the workspace.",
        );
      }

      formRef.current?.reset();

      setStatus(
        "success",
      );

      setMessage(
        role === "student"
          ? "Your file has been shared with your tutoring team."
          : "The material is now available in the student's learning workspace.",
      );

      router.refresh();
    } catch (error) {
      setStatus(
        "error",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "The file could not be uploaded.",
      );
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className={`${styles.uploadForm} ${
        compact
          ? styles.compact
          : ""
      }`}
    >
      <div
        className={
          styles.uploadIntro
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            {role ===
            "student"
              ? "SHARE WITH YOUR TUTOR"
              : "SHARE WITH STUDENT"}
          </span>

          <h3>
            {role ===
            "student"
              ? "Upload your work"
              : "Add learning material"}
          </h3>
        </div>

        <span
          className={
            styles.privateBadge
          }
        >
          {role === "student"
            ? "Tutor visible"
            : "Student visible"}
        </span>
      </div>

      <p
        className={
          styles.uploadHelp
        }
      >
        {role ===
        "student"
          ? "Upload coursework drafts, practice work, datasets, screenshots or other files you want your tutor to review."
          : "Upload worksheets, notes, slides, datasets, worked examples or other material for this student."}
      </p>

      <label
        className={
          styles.fileDrop
        }
      >
        <span>
          Choose file
        </span>

        <input
          name="materialFile"
          type="file"
          accept={
            acceptedFiles
          }
          required
          disabled={
            loading
          }
        />

        <small>
          PDF, Office,
          images, CSV,
          code/data files or
          ZIP · maximum 50 MB
        </small>
      </label>

      <div
        className={
          styles.formGrid
        }
      >
        <label>
          <span>
            Title
          </span>

          <input
            name="materialTitle"
            maxLength={200}
            placeholder={
              role ===
              "student"
                ? "e.g. Regression practice attempt"
                : "e.g. Week 3 regression worksheet"
            }
            disabled={
              loading
            }
          />
        </label>

        <label>
          <span>
            Category
          </span>

          <select
            name="materialCategory"
            defaultValue={
              defaultCategory ||
              (
                role ===
                "student"
                  ? "submission"
                  : "lesson_material"
              )
            }
            disabled={
              loading
            }
          >
            {categoryOptions.map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={
                    value
                  }
                  value={
                    value
                  }
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <label>
        <span>
          Note{" "}
          <small>
            optional
          </small>
        </span>

        <textarea
          name="materialDescription"
          maxLength={3000}
          placeholder={
            role ===
            "student"
              ? "Tell your tutor what you want them to look at or where you got stuck."
              : "Add context, instructions, or what the student should focus on."
          }
          disabled={
            loading
          }
        />
      </label>

      <button
        type="submit"
        className={
          styles.uploadButton
        }
        disabled={
          loading
        }
      >
        {status ===
        "preparing"
          ? "Preparing…"
          : status ===
              "uploading"
            ? "Uploading…"
            : status ===
                "saving"
              ? "Saving…"
              : role ===
                  "student"
                ? "Share file"
                : "Upload material"}
      </button>

      {message && (
        <div
          className={`${styles.message} ${
            status ===
            "error"
              ? styles.error
              : status ===
                  "success"
                ? styles.success
                : styles.progress
          }`}
          role={
            status ===
            "error"
              ? "alert"
              : "status"
          }
        >
          {message}
        </div>
      )}
    </form>
  );
}
