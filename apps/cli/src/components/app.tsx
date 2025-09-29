import React from 'react';
import { Box, Text, useApp } from 'ink';
import { version } from '../../package.json';

export function App(): React.ReactElement {
  const { exit } = useApp();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      exit();
    }, 5000);

    return () => clearTimeout(timer);
  }, [exit]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          DevQuality CLI v{version}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Code Quality Analysis and Reporting Tool</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Use 'dev-quality --help' for available commands</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="green">✓</Text>
        <Text> TypeScript configured</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="green">✓</Text>
        <Text> Commander.js CLI framework ready</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="green">✓</Text>
        <Text> Ink interactive components available</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Starting interactive mode... (auto-exit in 5 seconds)</Text>
      </Box>
    </Box>
  );
}
