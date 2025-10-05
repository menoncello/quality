#!/usr/bin/env node

import fs from 'fs';

const aggregationPath = './packages/core/src/__tests__/result-aggregation-simple.test.ts';
let content = fs.readFileSync(aggregationPath, 'utf8');

// Fix all metrics objects to include missing properties
const metricsPattern = /metrics:\s*\{([^}]+)\}/g;
content = content.replace(metricsPattern, (match, inner) => {
  // Check what properties are missing
  if (!inner.includes('infoCount')) {
    inner += ',\n          infoCount: 0';
  }
  if (!inner.includes('fixableCount')) {
    inner += ',\n          fixableCount: 0';
  }

  // Make sure all required properties are present
  const metrics = {
    issuesCount: 0,
    errorsCount: 0,
    warningsCount: 0,
    infoCount: 0,
    fixableCount: 0,
    score: 100
  };

  // Parse existing metrics and add missing ones
  const parsed = {};
  inner.split(',').forEach(prop => {
    const [key, value] = prop.trim().split(':');
    if (key && value) {
      parsed[key.trim()] = value.trim();
    }
  });

  // Add missing properties with defaults
  Object.keys(metrics).forEach(key => {
    if (!parsed[key]) {
      parsed[key] = metrics[key];
    }
  });

  // Reconstruct the object
  const result = Object.entries(parsed)
    .map(([key, value]) => `${key}: ${value}`)
    .join(',\n          ');

  return `metrics: {\n          ${result}\n        }`;
});

fs.writeFileSync(aggregationPath, content);
console.log('Fixed all metrics objects in result-aggregation-simple.test.ts');