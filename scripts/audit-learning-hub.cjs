const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

const source = fs.readFileSync("lib/resources.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const holder = new Module("learning-hub-audit");
holder.paths = module.paths;
holder._compile(compiled, "learning-hub-audit.cjs");

const { resources, resourceCategories } = holder.exports;
const errors = [];
const resourceSlugs = resources.map((item) => item.slug);
const categorySlugs = resourceCategories.map((item) => item.slug);

function duplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

for (const slug of duplicates(resourceSlugs)) errors.push(`Duplicate resource slug: ${slug}`);
for (const slug of duplicates(categorySlugs)) errors.push(`Duplicate category slug: ${slug}`);

for (const resource of resources) {
  if (!categorySlugs.includes(resource.categorySlug)) {
    errors.push(`${resource.slug}: unknown category ${resource.categorySlug}`);
  }
  if (!resource.sections?.length) errors.push(`${resource.slug}: no article sections`);
  if (!resource.takeaways?.length) errors.push(`${resource.slug}: no key takeaways`);
  if (!resource.tutoringLinks?.length) errors.push(`${resource.slug}: no tutoring link`);
  for (const related of resource.relatedSlugs ?? []) {
    if (!resourceSlugs.includes(related)) errors.push(`${resource.slug}: missing related guide ${related}`);
  }
}

if (errors.length) {
  console.error("Learning Hub audit failed:\n" + errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Learning Hub audit passed: ${resources.length} guides across ${resourceCategories.length} topic hubs.`);
