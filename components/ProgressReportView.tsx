import type { ProgressPlanItem, ProgressReport } from "@/lib/progress";
import { masteryLabel, reportPeriodLabel, riskLabel, topicMastery } from "@/lib/progress";

function pct(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export default function ProgressReportView({ report, studentName, subject, tutorName, topics = [] }: {
  report: ProgressReport;
  studentName: string;
  subject: string;
  tutorName?: string | null;
  topics?: ProgressPlanItem[];
}) {
  return <article className="progress-report-sheet">
    <header className="progress-report-header">
      <div><span className="progress-report-brand">My Academic Tutor</span><h1>{report.title}</h1><p>{studentName} · {subject}</p></div>
      <div className="progress-report-period"><span>Reporting period</span><strong>{reportPeriodLabel(report.period_start, report.period_end)}</strong>{tutorName && <small>Tutor: {tutorName}</small>}</div>
    </header>

    <section className="progress-report-score-row">
      <div className="progress-report-score"><span>Overall progress</span><strong>{pct(report.overall_score)}</strong><small>{riskLabel(report)}</small></div>
      <div><span>Attendance</span><strong>{pct(report.attendance_rate)}</strong><small>{report.sessions_completed} attended · {report.sessions_missed} missed</small></div>
      <div><span>Homework</span><strong>{pct(report.homework_completion_rate)}</strong><small>{report.homework_completed}/{report.homework_total} completed</small></div>
      <div><span>Understanding</span><strong>{report.average_understanding === null ? "—" : `${Number(report.average_understanding).toFixed(1)}/5`}</strong><small>Session average</small></div>
    </section>

    {topics.length > 0 && <section className="progress-report-section"><h2>Topic mastery</h2><div className="progress-topic-report-list">{topics.map((topic) => {
      const mastery = topicMastery(topic);
      return <div key={topic.id}><div><strong>{topic.topic}</strong>{topic.next_step && <small>Next: {topic.next_step}</small>}</div><div className="progress-mini-bar"><i style={{ width: `${mastery}%` }} /></div><span>{mastery}% · {masteryLabel(mastery)}</span></div>;
    })}</div></section>}

    <div className="progress-report-copy-grid">
      {report.summary && <section className="progress-report-section"><h2>Summary</h2><p>{report.summary}</p></section>}
      {report.strengths && <section className="progress-report-section"><h2>Strengths</h2><p>{report.strengths}</p></section>}
      {report.areas_for_improvement && <section className="progress-report-section"><h2>Areas to develop</h2><p>{report.areas_for_improvement}</p></section>}
      {report.next_focus && <section className="progress-report-section"><h2>Next focus</h2><p>{report.next_focus}</p></section>}
      {report.tutor_comment && <section className="progress-report-section"><h2>Tutor comment</h2><p>{report.tutor_comment}</p></section>}
    </div>
    <footer className="progress-report-footer">Progress indicators summarise tutoring records for this period and are not academic grades or formal institutional assessments.</footer>
  </article>;
}
