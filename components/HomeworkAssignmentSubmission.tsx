import HomeworkSubmissionForm from "@/components/HomeworkSubmissionForm";
import LearningMaterialUploadForm from "@/components/LearningMaterialUploadForm";
import LearningMaterialsList from "@/components/LearningMaterialsList";

export default function HomeworkAssignmentSubmission({
  token,
  engagementId,
  homeworkId,
  homeworkTitle,
  existing,
  materials,
}: {
  token: string;
  engagementId: string;
  homeworkId: string;
  homeworkTitle: string;
  existing:
    | {
        note: string | null;
        submission_url: string | null;
      }
    | null;
  materials: any[];
}) {
  return (
    <div className="portal-assignment-submission-workspace">
      <div className="portal-assignment-submission-head">
        <div>
          <span className="portal-kicker">Your submission</span>
          <strong>Upload your work for this assignment</strong>
        </div>

        {materials.length > 0 && (
          <span className="portal-assignment-file-count">
            {materials.length} file{materials.length === 1 ? "" : "s"} uploaded
          </span>
        )}
      </div>

      {materials.length > 0 && (
        <div className="portal-assignment-existing-files">
          <LearningMaterialsList
            materials={materials}
            viewerRole="student"
            downloadBaseUrl={`/api/portal/${encodeURIComponent(token)}/materials`}
            emptyText=""
          />
        </div>
      )}

      <div className="portal-assignment-upload-box">
        <LearningMaterialUploadForm
          role="student"
          endpoint={`/api/portal/${encodeURIComponent(token)}/materials?homework=${encodeURIComponent(homeworkId)}`}
          engagementId={engagementId}
          defaultCategory="submission"
          compact
        />
      </div>

      <div className="portal-assignment-note-box">
        <HomeworkSubmissionForm
          token={token}
          homeworkId={homeworkId}
          existing={existing}
        />

        <small>
          Files uploaded here stay attached to “{homeworkTitle}”. Add a note
          or external link only if it helps your tutor review the work.
        </small>
      </div>
    </div>
  );
}
