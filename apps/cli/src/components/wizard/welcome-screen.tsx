import React from 'react';
import { Box, Text, useInput } from 'ink';
import { WizardStepProps } from './wizard-container';
import { DetectionResult } from '@dev-quality/core';

export interface WelcomeScreenProps extends WizardStepProps {
  detectionResult?: DetectionResult;
}

export function WelcomeScreen({
  onNext,
  onCancel,
  detectionResult,
}: Omit<WelcomeScreenProps, 'data'>): React.ReactElement {
  const [isReady, setIsReady] = React.useState(false);

  useInput(input => {
    if (input === 'y' || input === 'Y') {
      setIsReady(true);
      onNext({ detectionResult });
    } else if (input === 'n' || input === 'N') {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text>Welcome to the DevQuality Setup Wizard!</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          This wizard will guide you through configuring the Bun-based tool stack for your project.
        </Text>
      </Box>

      {detectionResult && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="cyan">
              Project Detection Summary:
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>
              • Project: <Text bold>{detectionResult.project.name}</Text>
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>
              • Type: <Text bold>{detectionResult.project.type}</Text>
            </Text>
          </Box>

          {detectionResult.project.frameworks.length > 0 && (
            <Box marginBottom={1}>
              <Text>
                • Frameworks: <Text bold>{detectionResult.project.frameworks.join(', ')}</Text>
              </Text>
            </Box>
          )}

          <Box marginBottom={1}>
            <Text>
              • Tools Found: <Text bold>{detectionResult.tools.length}</Text>
            </Text>
          </Box>

          {detectionResult.tools.length > 0 && (
            <Box flexDirection="column" marginLeft={2}>
              {detectionResult.tools.map(tool => (
                <Box key={tool.name}>
                  <Text>
                    - {tool.name} <Text dimColor>({tool.version})</Text>
                  </Text>
                </Box>
              ))}
            </Box>
          )}

          <Box marginBottom={1} marginTop={1}>
            <Text>
              • Source Directories:{' '}
              <Text bold>{detectionResult.structure.sourceDirectories.join(', ')}</Text>
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text>
              • Test Directories:{' '}
              <Text bold>{detectionResult.structure.testDirectories.join(', ')}</Text>
            </Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1} marginBottom={1}>
        <Text>The wizard will configure the following tools:</Text>
      </Box>

      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Box>
          <Text>• Bun Test (test runner with coverage)</Text>
        </Box>
        <Box>
          <Text>• ESLint (code linting)</Text>
        </Box>
        <Box>
          <Text>• Prettier (code formatting)</Text>
        </Box>
        <Box>
          <Text>• TypeScript (type checking)</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text>
          Continue with setup?{' '}
          <Text bold color="green">
            (Y)es
          </Text>{' '}
          /{' '}
          <Text bold color="red">
            (N)o
          </Text>
        </Text>
      </Box>

      {isReady && (
        <Box marginTop={1}>
          <Text color="cyan">Starting configuration...</Text>
        </Box>
      )}
    </Box>
  );
}
