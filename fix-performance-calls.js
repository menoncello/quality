#!/usr/bin/env node

import fs from 'fs';

const performancePath = './packages/core/src/__tests__/performance-simple.test.ts';
let content = fs.readFileSync(performancePath, 'utf8');

// Fix all remaining plugin.execute calls with simple projectPath
const patterns = [
  {
    find: /projectPath: '\/test',[\s\S]*?\}\)/g,
    replace: `projectPath: '/test',
            config: { name: 'test', version: '1.0.0', tools: [] },
            logger: mockLogger
          } as any)`
  }
];

patterns.forEach(({ find, replace }) => {
  content = content.replace(find, replace);
});

fs.writeFileSync(performancePath, content);
console.log('Fixed remaining plugin.execute calls in performance-simple.test.ts');