import Link from "next/link";

import LearningMaterialUploadForm from "@/components/LearningMaterialUploadForm";

import LearningMaterialsList, {
  type LearningMaterialListItem,
} from "@/components/LearningMaterialsList";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Resources",
};

export const dynamic =
  "force-dynamic";

type SearchParams = Promise<{
  engagement?: string;
}>;

export default async function TutorMaterialsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const auth =
    await getTutorSession();

  if (!auth) {
    return null;
  }

  const query =
    await searchParams;

  const supabase =
    createAdminClient();

  const {
    data:
      engagementData,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,status,student_id,subject,title,module,current_focus,students(id,name,email,academic_level,institution,programme)",
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .order(
        "status",
        {
          ascending: true,
        },
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

  if (engagementError) {
    throw new Error(
      engagementError.message,
    );
  }

  const engagements =
    (
      engagementData ||
      []
    ) as any[];

  const requested =
    String(
      query.engagement ||
        "",
    );

  const selected =
    engagements.find(
      (item) =>
        item.id ===
        requested,
    ) ||
    engagements.find(
      (item) =>
        item.status ===
        "active",
    ) ||
    engagements[0] ||
    null;

  let materials:
    LearningMaterialListItem[] =
      [];

  if (selected) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "learning_materials",
        )
        .select(
          "id,created_at,title,description,category,uploaded_by_role,original_filename,mime_type,size_bytes,session_id",
        )
        .eq(
          "engagement_id",
          selected.id,
        )
        .eq(
          "status",
          "active",
        )
        .eq(
          "visible_to_tutor",
          true,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

    if (error) {
      throw new Error(
        error.message,
      );
    }

    materials =
      (
        data ||
        []
      ) as LearningMaterialListItem[];
  }

  const tutorMaterials =
    materials.filter(
      (item) =>
        item.uploaded_by_role !==
        "student",
    );

  const studentUploads =
    materials.filter(
      (item) =>
        item.uploaded_by_role ===
        "student",
    );

  return (
    <div className="tutor-page tutor-materials-page">
      <header className="tutor-page-head">
        <div>
          <span className="tutor-eyebrow">
            Learning workspace
          </span>

          <h1>
            Materials & files
          </h1>

          <p>
            Share private learning
            material with students and
            review files they upload for
            your feedback.
          </p>
        </div>

        <Link
          href="/tutor/students"
          className="tutor-secondary-link"
        >
          View students
        </Link>
      </header>

      {engagements.length ? (
        <>
          <section className="tutor-panel tutor-material-selector">
            <div className="tutor-material-selector-copy">
              <span className="tutor-panel-kicker">
                Student workspace
              </span>

              <h2>
                Choose learner
              </h2>

              <p>
                Materials are stored
                against the student's
                tutoring engagement.
              </p>
            </div>

            <div className="tutor-material-student-tabs">
              {engagements.map(
                (item) => (
                  <Link
                    key={
                      item.id
                    }
                    href={`/tutor/materials?engagement=${encodeURIComponent(
                      item.id,
                    )}`}
                    className={
                      selected?.id ===
                      item.id
                        ? "is-active"
                        : undefined
                    }
                  >
                    <strong>
                      {item.students
                        ?.name ||
                        "Student"}
                    </strong>

                    <span>
                      {
                        item.subject
                      }
                    </span>
                  </Link>
                ),
              )}
            </div>
          </section>

          {selected && (
            <>
              <section className="tutor-material-workspace-head">
                <div>
                  <span className="tutor-eyebrow">
                    {
                      selected.subject
                    }
                  </span>

                  <h2>
                    {selected.students
                      ?.name ||
                      "Student"}
                  </h2>

                  <p>
                    {selected.current_focus ||
                      selected.module ||
                      selected.title}
                  </p>
                </div>

                <div className="tutor-material-summary">
                  <div>
                    <span>
                      Shared
                    </span>

                    <strong>
                      {
                        tutorMaterials.length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Student uploads
                    </span>

                    <strong>
                      {
                        studentUploads.length
                      }
                    </strong>
                  </div>
                </div>
              </section>

              <div className="tutor-material-main-grid">
                <div className="tutor-material-primary">
                  <section className="tutor-panel">
                    <div className="tutor-panel-head">
                      <div>
                        <span className="tutor-panel-kicker">
                          Shared learning
                        </span>

                        <h2>
                          Materials
                        </h2>
                      </div>

                      <span>
                        {
                          tutorMaterials.length
                        }{" "}
                        files
                      </span>
                    </div>

                    <LearningMaterialsList
                      materials={
                        tutorMaterials
                      }
                      viewerRole="tutor"
                      downloadBaseUrl="/api/tutor/materials"
                      emptyText="Upload the first worksheet, notes, slides or dataset for this student."
                    />
                  </section>

                  <section className="tutor-panel">
                    <div className="tutor-panel-head">
                      <div>
                        <span className="tutor-panel-kicker">
                          Student → tutor
                        </span>

                        <h2>
                          Student uploads
                        </h2>
                      </div>

                      <span>
                        {
                          studentUploads.length
                        }{" "}
                        files
                      </span>
                    </div>

                    <LearningMaterialsList
                      materials={
                        studentUploads
                      }
                      viewerRole="tutor"
                      downloadBaseUrl="/api/tutor/materials"
                      emptyText="Files the student uploads from their Learning Portal will appear here."
                    />
                  </section>
                </div>

                <aside className="tutor-material-side">
                  <LearningMaterialUploadForm
                    role="tutor"
                    endpoint="/api/tutor/materials"
                    engagementId={
                      selected.id
                    }
                    studentId={
                      selected.student_id
                    }
                  />

                  <section className="tutor-panel tutor-material-context">
                    <span className="tutor-panel-kicker">
                      Student context
                    </span>

                    <h2>
                      {
                        selected.students
                          ?.name
                      }
                    </h2>

                    <dl className="tutor-details">
                      <div>
                        <dt>
                          Subject
                        </dt>

                        <dd>
                          {
                            selected.subject
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Level
                        </dt>

                        <dd>
                          {selected.students
                            ?.academic_level ||
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Institution
                        </dt>

                        <dd>
                          {selected.students
                            ?.institution ||
                            "—"}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Focus
                        </dt>

                        <dd>
                          {selected.current_focus ||
                            selected.module ||
                            "—"}
                        </dd>
                      </div>
                    </dl>

                    <Link
                      className="tutor-secondary-link"
                      href={`/tutor/progress/${selected.id}`}
                    >
                      Open progress record →
                    </Link>
                  </section>
                </aside>
              </div>
            </>
          )}
        </>
      ) : (
        <section className="tutor-panel tutor-empty-state">
          <span className="tutor-eyebrow">
            Learning materials
          </span>

          <h2>
            No student workspace yet
          </h2>

          <p>
            Materials can be shared once
            a tutoring engagement has
            been assigned to you.
          </p>
        </section>
      )}
    </div>
  );
}
