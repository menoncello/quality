#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, 'packages/core/src/prioritization/workflow-integration.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements for corrupted patterns
const replacements = [
  // Fix corrupted property names
  [/\.teamPreference\(s\)/g, '.teamPreferences'],
  [/\.teamPreference\(s /g, '.teamPreferences'],

  // Fix corrupted variable/array names
  [/prioritization\(s\)/g, 'prioritizations'],
  [/integration\(s\)/g, 'integrations'],
  [/notification\(s\)/g, 'notifications'],
  [/workflow\(s\)/g, 'workflows'],
  [/subscription\(s\)/g, 'subscriptions'],
  [/issue\(s\)/g, 'issues'],
  [/suggestion\(s\)/g, 'suggestions'],
  [/platform\(s\)/g, 'platforms'],
  [/severity\(s\)/g, 'severities'],
  [/level\(s\)/g, 'levels'],
  [/action\(s\)/g, 'actions'],
  [/event\(s\)/g, 'events'],
  [/handler\(s\)/g, 'handlers'],
  [/listener\(s\)/g, 'listeners'],
  [/alert\(s\)/g, 'alerts'],
  [/message\(s\)/g, 'messages'],
];

// Apply replacements
replacements.forEach(([pattern, replacement]) => {
  const newContent = content.replace(pattern, replacement);
  if (newContent !== content) {
    content = newContent;
    console.log(`Applied replacement: ${pattern} -> ${replacement}`);
  }
});

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fixed workflow-integration.ts');