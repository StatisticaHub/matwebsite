import type { Subject } from "@/lib/tutoring-data";
import type { TutoringService } from "@/lib/tutoring-services";
import type { ConversionFaqItem } from "@/components/ConversionFaq";

export function subjectConversionFaqs(subject: Subject): ConversionFaqItem[] {
  const audiences = subject.audiences.slice(0, 4).join(", ");
  const topicExamples = subject.topics.slice(0, 4).join(", ");

  return [
    {
      question: `Which levels can you support in ${subject.name}?`,
      answer: `Support is matched to the learner and course context. Common levels include ${audiences}. When you send an enquiry, include the course or curriculum so the teaching can start at the right depth.`,
    },
    {
      question: `Can I bring my own ${subject.name.toLowerCase()} course material to a session?`,
      answer: `Yes. Lecture notes, syllabus topics, practice questions and software output can all help a tutor understand how your course presents the material. The session should still focus on teaching the method and helping you work independently.`,
    },
    {
      question: `What kinds of ${subject.name.toLowerCase()} topics can we work on?`,
      answer: `Typical areas include ${topicExamples}. If your topic is more specialised, describe it in the enquiry and we can review whether a suitable tutor is available.`,
    },
    {
      question: "Can tutoring help with assessed coursework or a dissertation?",
      answer: `Tutoring can explain concepts, methods, software, interpretation and research decisions. It cannot write, complete or impersonate a student's assessed work. The aim is to help you understand and defend your own work.`,
    },
  ];
}

export function serviceConversionFaqs(service: TutoringService): ConversionFaqItem[] {
  return [
    {
      question: `How does ${service.title.toLowerCase()} work online?`,
      answer: "Sessions are live and one-to-one. You can share the course context, questions or software output, then work through explanation, examples and guided practice with the tutor.",
    },
    {
      question: "Can I book one session before deciding on regular tutoring?",
      answer: "Yes. The enquiry can be for a focused one-off session or ongoing support. We review the academic need first and can arrange the most appropriate format.",
    },
    {
      question: "What should I include in my tutoring request?",
      answer: "Include your academic level, subject or module, the exact topic you are finding difficult, and what you want to be able to do after the session. Deadlines and preferred availability are useful when relevant.",
    },
    {
      question: "Will a tutor complete assessed work for me?",
      answer: "No. Tutors can teach methods, discuss approaches, review understanding and practise similar problems, but assessed work must remain your own.",
    },
  ];
}

export function specialistConversionFaqs(title: string, subject: string): ConversionFaqItem[] {
  return [
    {
      question: `Who is ${title.toLowerCase()} suitable for?`,
      answer: `It is designed for learners who need focused one-to-one help with ${subject.toLowerCase()} at the level and depth used in their own course or research training. Send the module or project context with your enquiry so we can review the fit.`,
    },
    {
      question: "Can I use my own data, output or course examples in a session?",
      answer: "Yes, where appropriate. A tutor can use your material to understand the context and teach the underlying method, software workflow or interpretation. The purpose is learning rather than completing assessed work for you.",
    },
    {
      question: "Can I start with a single session?",
      answer: "Yes. You can request a focused session for one topic or ask for ongoing tutoring. The format can be decided after the academic context has been reviewed.",
    },
    {
      question: "What happens after I send a tutoring request?",
      answer: "We review the subject, level, topic, availability and type of support needed, then arrange the most suitable available tutor or next step. You can decide whether to proceed after the proposed support is clear.",
    },
  ];
}
