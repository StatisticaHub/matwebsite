import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServerSupabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";

const MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024;

const allowedCertificateTypes = new Map([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

function clean(value: FormDataEntryValue | null, max = 5000) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function list(value: FormDataEntryValue | null) {
  return clean(value, 3000)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100);
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function reference() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  return `MAT-TUT-${date}-${crypto
    .randomUUID()
    .slice(0, 6)
    .toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!hasServerSupabaseConfig()) {
    return NextResponse.json(
      { error: "Tutor applications are temporarily unavailable." },
      { status: 503 },
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid application submission." },
      { status: 400 },
    );
  }

  // Honeypot. Return success without storing bot submissions.
  if (clean(form.get("companyWebsite"), 500)) {
    return NextResponse.json({
      ok: true,
      reference: reference(),
    });
  }

  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 240).toLowerCase();
  const phone = clean(form.get("phone"), 80) || null;
  const country = clean(form.get("country"), 120);

  const subjects = list(form.get("subjects"));
  const levels = list(form.get("levels"));
  const specialisms = list(form.get("specialisms"));
  const languages = list(form.get("languages"));

  const qualifications = clean(form.get("qualifications"), 5000);
  const teachingExperience = clean(
    form.get("teachingExperience"),
    5000,
  );

  const timezone = clean(form.get("timezone"), 120);
  const availability = clean(form.get("availability"), 2000);
  const onlineTeachingSetup = clean(
    form.get("onlineTeachingSetup"),
    2000,
  );
  const motivation = clean(form.get("motivation"), 3000);

  const demoSubject = clean(form.get("demoSubject"), 160);
  const demoLevel = clean(form.get("demoLevel"), 160);
  const demoTopic = clean(form.get("demoTopic"), 300);
  const demoVideoUrl = clean(form.get("demoVideoUrl"), 1500);
  const demoNotes = clean(form.get("demoNotes"), 2000) || null;

  const integrity =
    clean(form.get("academicIntegrity"), 20) === "yes";

  const reference1 = {
    name: clean(form.get("reference1Name"), 160),
    email: clean(form.get("reference1Email"), 240).toLowerCase(),
    organisation:
      clean(form.get("reference1Organisation"), 240) || null,
    relationship: clean(
      form.get("reference1Relationship"),
      240,
    ),
    phone: clean(form.get("reference1Phone"), 80) || null,
  };

  const reference2 = {
    name: clean(form.get("reference2Name"), 160),
    email: clean(form.get("reference2Email"), 240).toLowerCase(),
    organisation:
      clean(form.get("reference2Organisation"), 240) || null,
    relationship: clean(
      form.get("reference2Relationship"),
      240,
    ),
    phone: clean(form.get("reference2Phone"), 80) || null,
  };

  if (
    !name ||
    !validEmail(email) ||
    !country ||
    !subjects.length ||
    !levels.length ||
    !languages.length ||
    !qualifications ||
    !teachingExperience ||
    !timezone ||
    !availability ||
    !onlineTeachingSetup ||
    !motivation ||
    !reference1.name ||
    !validEmail(reference1.email) ||
    !reference1.relationship ||
    !reference2.name ||
    !validEmail(reference2.email) ||
    !reference2.relationship ||
    !demoSubject ||
    !demoLevel ||
    !demoTopic ||
    !validUrl(demoVideoUrl) ||
    !integrity
  ) {
    return NextResponse.json(
      {
        error:
          "Please complete all required application fields, both references and the teaching demonstration.",
      },
      { status: 400 },
    );
  }

  if (reference1.email === reference2.email) {
    return NextResponse.json(
      {
        error:
          "Please provide two different referees with different email addresses.",
      },
      { status: 400 },
    );
  }

  const certificate = form.get("degreeCertificate");

  if (!(certificate instanceof File)) {
    return NextResponse.json(
      { error: "Please upload your degree certificate." },
      { status: 400 },
    );
  }

  if (!allowedCertificateTypes.has(certificate.type)) {
    return NextResponse.json(
      {
        error:
          "Degree certificates must be PDF, JPG or PNG files.",
      },
      { status: 400 },
    );
  }

  if (
    certificate.size <= 0 ||
    certificate.size > MAX_CERTIFICATE_BYTES
  ) {
    return NextResponse.json(
      {
        error:
          "The degree certificate must be no larger than 10 MB.",
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("tutor_applications")
    .select("id,status")
    .eq("email", email)
    .in("status", ["new", "reviewing", "approved"])
    .limit(1);

  if (existingError) {
    console.error(
      "Could not check tutor application duplicates:",
      existingError,
    );
  }

  if ((existing || []).length) {
    return NextResponse.json(
      {
        error:
          "There is already an active tutor application using this email address.",
      },
      { status: 409 },
    );
  }

  const applicationReference = reference();

  const { data: application, error: applicationError } =
    await supabase
      .from("tutor_applications")
      .insert({
        reference: applicationReference,
        name,
        email,
        phone,
        country,
        subjects,
        levels,
        specialisms,
        languages,
        qualifications,
        teaching_experience: teachingExperience,
        timezone,
        availability,
        online_teaching_setup: onlineTeachingSetup,
        motivation,
        demo_subject: demoSubject,
        demo_level: demoLevel,
        demo_topic: demoTopic,
        demo_video_url: demoVideoUrl,
        demo_notes: demoNotes,
        academic_integrity_confirmed: integrity,
        status: "new",
      })
      .select("id,reference")
      .single();

  if (applicationError || !application) {
    console.error(
      "Could not save tutor application:",
      applicationError,
    );

    return NextResponse.json(
      { error: "Could not save your tutor application." },
      { status: 500 },
    );
  }

  const { error: referencesError } = await supabase
    .from("tutor_application_references")
    .insert([
      {
        application_id: application.id,
        reference_number: 1,
        ...reference1,
      },
      {
        application_id: application.id,
        reference_number: 2,
        ...reference2,
      },
    ]);

  if (referencesError) {
    console.error(
      "Could not save tutor references:",
      referencesError,
    );

    await supabase
      .from("tutor_applications")
      .delete()
      .eq("id", application.id);

    return NextResponse.json(
      { error: "Could not save your referee information." },
      { status: 500 },
    );
  }

  const extension =
    allowedCertificateTypes.get(certificate.type) || "bin";

  const storagePath =
    `${application.id}/` +
    `${crypto.randomUUID()}.${extension}`;

  const fileBuffer = Buffer.from(
    await certificate.arrayBuffer(),
  );

  const { error: uploadError } = await supabase.storage
    .from("tutor-application-documents")
    .upload(storagePath, fileBuffer, {
      contentType: certificate.type,
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Could not upload tutor certificate:",
      uploadError,
    );

    await supabase
      .from("tutor_applications")
      .delete()
      .eq("id", application.id);

    return NextResponse.json(
      { error: "Could not upload your degree certificate." },
      { status: 500 },
    );
  }

  const { error: documentError } = await supabase
    .from("tutor_application_documents")
    .insert({
      application_id: application.id,
      document_type: "degree_certificate",
      storage_bucket: "tutor-application-documents",
      storage_path: storagePath,
      original_filename: certificate.name.slice(0, 500),
      mime_type: certificate.type,
      size_bytes: certificate.size,
      verification_status: "submitted",
    });

  if (documentError) {
    console.error(
      "Could not save tutor document metadata:",
      documentError,
    );

    await supabase.storage
      .from("tutor-application-documents")
      .remove([storagePath]);

    await supabase
      .from("tutor_applications")
      .delete()
      .eq("id", application.id);

    return NextResponse.json(
      { error: "Could not complete your application." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      reference: application.reference,
    },
    { status: 201 },
  );
}
