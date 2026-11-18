import fs from 'node:fs';
const required = [
'app/page.tsx','app/find-a-tutor/page.tsx','app/subjects/page.tsx','app/subjects/[slug]/page.tsx',
'app/levels/page.tsx','app/levels/[slug]/page.tsx','app/tutoring/page.tsx','app/how-it-works/page.tsx',
'app/ai-tutor/page.tsx','app/tutors/page.tsx','app/become-a-tutor/page.tsx','app/resources/page.tsx',
'app/resources/[slug]/page.tsx','app/about/page.tsx','app/faq/page.tsx','app/contact/page.tsx',
'app/academic-integrity/page.tsx','app/safeguarding/page.tsx','app/privacy/page.tsx','app/terms/page.tsx',
'components/TutoringLeadForm.tsx','components/AITutorDemo.tsx','components/TutorApplicationDemo.tsx',
'lib/tutoring-data.ts','lib/resources.ts'
];
const missing=required.filter(x=>!fs.existsSync(x));
if(missing.length){console.error('Missing required build files:',missing);process.exit(1)}
const route=fs.readFileSync('app/api/tutoring-lead/route.ts','utf8');
if(route.includes('RESEND_API_KEY')||route.includes('supabase')){console.error('Build-mode lead route unexpectedly contains a live integration.');process.exit(1)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const deps=Object.keys(pkg.dependencies||{});
if(deps.some(x=>x.includes('supabase')||x.includes('resend')||x.includes('stripe'))){console.error('Unexpected external integration dependency.');process.exit(1)}
console.log(`Public build audit passed: ${required.length} core files present, no live lead/CRM/payment integration attached.`);
