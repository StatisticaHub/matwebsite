import { createAdminClient } from "@/lib/supabase/admin";

export type TestimonialStatus = "requested" | "submitted" | "approved" | "rejected";

export type PublicTestimonial = {
  id: string;
  rating: number;
  review_text: string;
  display_name: string;
  display_context: string | null;
  subject: string | null;
  academic_level: string | null;
  featured: boolean;
  approved_at: string | null;
  tutor_name: string | null;
};

type GetApprovedOptions = {
  subject?: string;
  tutorId?: string;
  limit?: number;
  featuredFirst?: boolean;
};

export async function getApprovedTestimonials(options: GetApprovedOptions = {}): Promise<PublicTestimonial[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("testimonials")
      .select("id,rating,review_text,display_name,display_context,subject,academic_level,featured,approved_at,tutor_id,tutors(name)")
      .eq("status", "approved")
      .eq("consent_to_publish", true);

    if (options.subject) query = query.ilike("subject", options.subject);
    if (options.tutorId) query = query.eq("tutor_id", options.tutorId);
    if (options.featuredFirst) query = query.order("featured", { ascending: false });
    query = query.order("approved_at", { ascending: false, nullsFirst: false });
    if (options.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      console.error("Could not load approved testimonials", error.message);
      return [];
    }

    return (data || []).flatMap((row: any) => {
      const rating = Number(row.rating);
      if (!row.review_text || !row.display_name || !Number.isFinite(rating)) return [];
      return [{
        id: row.id,
        rating,
        review_text: row.review_text,
        display_name: row.display_name,
        display_context: row.display_context || null,
        subject: row.subject || null,
        academic_level: row.academic_level || null,
        featured: Boolean(row.featured),
        approved_at: row.approved_at || null,
        tutor_name: row.tutors?.name || null,
      } satisfies PublicTestimonial];
    });
  } catch (error) {
    console.error("Could not load approved testimonials", error);
    return [];
  }
}

export function compactPublicName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Student";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`;
}
