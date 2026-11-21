import type { Subject } from "@/lib/tutoring-data";
import type { TutoringService } from "@/lib/tutoring-services";
import type { ConversionFaqItem } from "@/components/ConversionFaq";

export function subjectConversionFaqs(subject: Subject): ConversionFaqItem[] {
  const audiences = subject.audiences.slice(0, 4).join(", ");
  const topicExamples = subject.topics.slice(0, 4).join(", ");

  return [
    {
      question: `Which levels can you tutor in ${subject.name}?`,
      answer: `We tutor ${subject.name.toLowerCase()} at different levels, including ${audiences}. Include your course, module or curriculum in the enquiry so we can match the request to the right level.`,
    },
    {
      question: `Can I bring my own ${subject.name.toLowerCase()} course material to a session?`,
      answer: `Yes. Lecture notes, syllabus topics, practice questions and software output can help the tutor see how your course presents the material. The session should focus on explaining the method and helping you use it yourself.`,
    },
    {
      question: `What kinds of ${subject.name.toLowerCase()} topics can we work on?`,
      answer: `Common areas include ${topicExamples}. If your topic is more specialised, describe it in the enquiry and we can check whether a suitable tutor is available.`,
    },
    {
      question: "Can tutoring help with assessed coursework or a dissertation?",
      answer: "A tutor can explain concepts, methods, software, interpretation and research decisions. We will not write or complete assessed work for you. The aim is to help you understand and defend your own work.",
    },
  ];
}

export function serviceConversionFaqs(service: TutoringService): ConversionFaqItem[] {
  return [
    {
      question: `How does ${service.title.toLowerCase()} work online?`,
      answer: "Sessions are live and one-to-one. Bring the course material, questions or software output you are working with and use the session for explanation, examples, practice and feedback.",
    },
    {
      question: "Can I start with one session?",
      answer: "Yes. You can request a single focused session or ongoing tutoring. If regular sessions would help, you can decide that after the first session.",
    },
    {
      question: "What should I include in my tutoring request?",
      answer: "Include your level, subject or module, the exact topic you are stuck on and what you want to be able to do after the session. Add a deadline and preferred availability if they matter.",
    },
    {
      question: "Will a tutor complete assessed work for me?",
      answer: "No. Tutors can explain methods, discuss your reasoning and practise similar problems with you, but assessed work must remain your own.",
    },
  ];
}

export function specialistConversionFaqs(title: string, subject: string): ConversionFaqItem[] {
  return [
    {
      question: `Who is ${title.toLowerCase()} suitable for?`,
      answer: `It is for learners who want focused one-to-one help with ${subject.toLowerCase()} at the level used in their own course or research training. Send the module or project context so we can match the request properly.`,
    },
    {
      question: "Can I use my own data, output or course examples in a session?",
      answer: "Yes, where appropriate. Your material can give the tutor useful context for teaching the underlying method, software workflow or interpretation. The purpose is learning, not completing assessed work for you.",
    },
    {
      question: "Can I start with a single session?",
      answer: "Yes. You can book a focused session for one topic or ask about ongoing tutoring. You do not need to commit to regular sessions first.",
    },
    {
      question: "What happens after I send a tutoring request?",
      answer: "We read the subject, level, topic and availability, then suggest a suitable tutor and confirm the price and next step. You decide whether to proceed before tutoring is booked.",
    },
  ];
}
