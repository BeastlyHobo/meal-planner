#!/usr/bin/env tsx

/**
 * /meal-plan Skill CLI Implementation
 *
 * Usage:
 *   npm run meal-plan new [YYYY-MM-DD]
 *   npm run meal-plan generate
 *   npm run meal-plan validate [file]
 *   npm run meal-plan publish [file]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  printMealPlanValidationResult,
  validateMealPlanFile,
} from "./mealPlanValidation";
import { DEFAULT_SETTINGS, type HouseholdSettings } from "@/lib/settings";
import { getHouseholdSettings } from "@/lib/services/settingsService";

const MEALPLANS_DIR = path.join(process.cwd(), 'data', 'mealplans');
const CURRENT_WEEK_FILE = path.join(process.cwd(), 'data', 'current-week.md');

function showHelp() {
  console.log(`
🍃 Harvest Meal Plan Skill

USAGE:
  npm run meal-plan [command] [options]

COMMANDS:
  new [date]       Create a new week plan (date = Monday start YYYY-MM-DD)
  generate         Generate complete valid meal plan
  validate [file]  Validate existing meal plan
  publish [file]   Publish draft plan to current week
`);
}

function getMondayDate(inputDate?: string): Date {
  const date = inputDate ? new Date(inputDate) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function createNewPlan(startDate: Date) {
  const dateStr = startDate.toISOString().split('T')[0];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const filename = `mealplan-week-${dateStr}.md`;
  const filepath = path.join(MEALPLANS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.log(`⚠️  Plan already exists: ${filename}`);
    return filepath;
  }

  const templatePath = path.join(process.cwd(), 'data', 'meal-plan-skill.md');
  const template = fs.readFileSync(templatePath, 'utf8');
  const jsonParts = template.split('```json');
  if (jsonParts.length < 2) {
    throw new Error(`No \`\`\`json template found in ${templatePath}`);
  }
  // Use the last fenced json block (Output Template), not earlier prose mentions.
  const jsonSection = jsonParts[jsonParts.length - 1].split('```')[0];

  const content = `# Current Week Plan: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}

Active meal plan for the current week.

## Canonical JSON
\`\`\`json
${jsonSection.replace('[start] — [end]', `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`)}
\`\`\`
`;

  fs.writeFileSync(filepath, content);
  console.log(`✅ Created new meal plan: ${filename}`);
  return filepath;
}

/**
 * Validate against the household's live settings when a database is reachable, so the
 * questionnaire's hard nos and targets actually gate a week. Falls back to the defaults
 * so validation still runs with no DB (CI, a fresh clone, offline authoring).
 */
async function loadSettingsForValidation(): Promise<HouseholdSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }
  return getHouseholdSettings();
}

async function validatePlan(filepath?: string) {
  const targetFile = filepath ?? CURRENT_WEEK_FILE;
  console.log(`🔍 Validating: ${targetFile}`);

  const settings = await loadSettingsForValidation();
  const result = validateMealPlanFile(targetFile, {
    printShoppingOrder: true,
    settings,
  });
  printMealPlanValidationResult(result);
  return result.valid;
}

async function publishPlan(filepath?: string) {
  const targetFile = filepath ?? CURRENT_WEEK_FILE;

  if (!(await validatePlan(targetFile))) {
    console.log('❌ Cannot publish invalid plan');
    process.exit(1);
  }

  fs.copyFileSync(targetFile, CURRENT_WEEK_FILE);
  console.log('✅ Copied to current-week.md');

  console.log('🔄 Running sync pipeline...');
  execSync('npm run meal-plan:sync', { stdio: 'inherit' });
  execSync('npm run meal-plan:publish', { stdio: 'inherit' });

  console.log('✅ Plan published successfully!');
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'new':
      createNewPlan(getMondayDate(args[1]));
      break;
    case 'validate': {
      const valid = await validatePlan(args[1]);
      if (!valid) {
        process.exitCode = 1;
      }
      break;
    }
    case 'publish':
      await publishPlan(args[1]);
      break;
    case 'generate': {
      console.log('🧠 Generating full meal plan...');
      const newPath = createNewPlan(getMondayDate());
      console.log(`📝 Edit plan at: ${newPath}`);
      console.log('💡 Once complete run: npm run meal-plan validate && npm run meal-plan publish');
      break;
    }
    default:
      showHelp();
  }
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);