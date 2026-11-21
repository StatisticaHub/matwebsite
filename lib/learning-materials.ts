import { randomUUID } from "node:crypto";

export const LEARNING_MATERIAL_BUCKET = "learning-materials";
export const LEARNING_MATERIAL_MAX_BYTES = 50 * 1024 * 1024;

export const learningMaterialCategories = [
  "lesson_material",
  "worksheet",
  "homework",
  "submission",
  "slides",
  "dataset",
  "notes",
  "reference",
  "solution",
  "other",
] as const;

export type LearningMaterialCategory =
  (typeof learningMaterialCategories)[number];

const allowedMimeTypes = new Set([
  "application/pdf",

  "image/jpeg",
  "image/png",
  "image/webp",

  "text/plain",
  "text/csv",

  "application/json",
  "application/octet-stream",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "application/zip",
  "application/x-zip-compressed",
]);

const allowedExtensions = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "txt",
  "csv",
  "json",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "zip",
  "r",
  "py",
  "sas",
  "do",
]);

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return (
      new URL(origin).host ===
      request.headers.get("host")
    );
  } catch {
    return false;
  }
}

export function cleanText(
  value: unknown,
  max = 5000,
) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export function safeFilename(value: unknown) {
  const raw =
    String(value || "")
      .split(/[\\/]/)
      .pop()
      ?.normalize("NFKC") || "file";

  const cleaned = raw
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

  return cleaned || "file";
}

export function fileExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");

  return parts.length > 1
    ? parts.pop() || ""
    : "";
}

export function validateLearningFile(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (!input.filename) {
    return "Please choose a file.";
  }

  if (
    !Number.isFinite(input.sizeBytes) ||
    input.sizeBytes <= 0
  ) {
    return "The selected file is empty or invalid.";
  }

  if (
    input.sizeBytes >
    LEARNING_MATERIAL_MAX_BYTES
  ) {
    return "Files must be 50 MB or smaller.";
  }

  const extension =
    fileExtension(input.filename);

  if (!allowedExtensions.has(extension)) {
    return "This file type is not supported.";
  }

  if (
    input.mimeType &&
    !allowedMimeTypes.has(input.mimeType)
  ) {
    /*
     * Some browsers report code/data files as
     * application/octet-stream. The bucket itself still
     * applies its MIME restrictions.
     */
    return "This file format is not supported.";
  }

  return null;
}

export function materialStoragePath(input: {
  studentId: string;
  engagementId: string;
  role: "student" | "tutor";
  filename: string;
}) {
  return [
    input.studentId,
    input.engagementId,
    input.role,
    `${randomUUID()}-${safeFilename(input.filename)}`,
  ].join("/");
}

export function materialPathBelongsTo(input: {
  path: string;
  studentId: string;
  engagementId: string;
  role: "student" | "tutor";
}) {
  const prefix =
    `${input.studentId}/${input.engagementId}/${input.role}/`;

  return input.path.startsWith(prefix);
}

export function validCategory(
  value: unknown,
): LearningMaterialCategory {
  const category =
    cleanText(value, 50);

  return learningMaterialCategories.includes(
    category as LearningMaterialCategory,
  )
    ? (category as LearningMaterialCategory)
    : "other";
}

export function splitStoragePath(path: string) {
  const index = path.lastIndexOf("/");

  if (index < 1) {
    return null;
  }

  return {
    folder: path.slice(0, index),
    filename: path.slice(index + 1),
  };
}
