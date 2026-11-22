import { getTutorSession } from "@/lib/tutor-auth";
import { updateTutorAvailabilityFromPortal } from "@/app/tutor/actions";
import TimeZoneSelect from "@/components/TimeZoneSelect";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zone";
export const metadata = { title: "Tutor availability" };
type SearchParams = Promise<{ saved?: string }>;
export default async function TutorAvailabilityPage({ searchParams }: { searchParams: SearchParams }) {
  const auth = await getTutorSession(); if (!auth) return null; const query = await searchParams; const tutor = auth.tutor;
  return <div className="tutor-page"><header className="tutor-page-head"><div><span className="tutor-eyebrow">Profile</span><h1>Availability</h1><p>Keep your teaching availability current so the MAT team can match new students accurately.</p></div></header>{query.saved === "1" && <div className="tutor-alert success">Availability updated.</div>}
    <section className="tutor-panel"><form action={updateTutorAvailabilityFromPortal} className="tutor-form">
      <label>
        <span>Timezone</span>
        <TimeZoneSelect
          name="timezone"
          defaultValue={tutor.timezone || DEFAULT_TIME_ZONE}
          required
        />
        <small>All tutor session times use this timezone.</small>
      </label>
      <fieldset><legend>Available days</legend><div className="tutor-check-grid">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => { const value = day.toLowerCase(); return <label key={day}><input type="checkbox" name="availabilityDays" value={value} defaultChecked={(tutor.availability_days || []).includes(value)} /><span>{day}</span></label>; })}</div></fieldset>
      <fieldset><legend>Teaching periods</legend><div className="tutor-check-grid compact">{["Morning","Afternoon","Evening"].map(period => { const value = period.toLowerCase(); return <label key={period}><input type="checkbox" name="availabilityPeriods" value={value} defaultChecked={(tutor.availability_periods || []).includes(value)} /><span>{period}</span></label>; })}</div></fieldset>
      <div className="tutor-form-grid"><label><span>Weekly teaching capacity (hours)</span><input name="weeklyCapacityHours" type="number" min="0" max="80" step="0.5" defaultValue={tutor.weekly_capacity_hours ?? ""} /></label><label><span>Maximum active students</span><input name="maxActiveStudents" type="number" min="0" max="100" defaultValue={tutor.max_active_students ?? ""} /></label></div>
      <label><span>Availability notes</span><textarea name="availabilityNotes" defaultValue={tutor.availability_notes || ""} placeholder="For example: weekday evenings after 18:00; flexible on Saturdays." /></label>
      <label className="tutor-check-single"><input type="checkbox" name="acceptsTrials" value="yes" defaultChecked={tutor.accepts_trials !== false} /><span>I am currently available for trial sessions</span></label>
      <button className="tutor-primary-button" type="submit">Save availability</button>
    </form></section>
  </div>;
}
