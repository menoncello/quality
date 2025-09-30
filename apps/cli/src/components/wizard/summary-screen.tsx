import React from 'react';
import { Box, Text, useInput } from 'ink';
import { WizardStepProps } from './wizard-container';

export interface ValidationResult {
  tool: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  configPath?: string;
}

export interface SummaryScreenProps extends WizardStepProps {
  validationResults: ValidationResult[];
  generatedFiles: string[];
  onRunAnalysis?: () => Promise<void>;
}

export function SummaryScreen({
  validationResults,
  generatedFiles,
  onNext,
  onRunAnalysis,
}: Omit<SummaryScreenProps, 'data'>): React.ReactElement {
  const [isRunningAnalysis, setIsRunningAnalysis] = React.useState(false);

  useInput(async input => {
    if (input === 'y' || input === 'Y') {
      if (onRunAnalysis) {
        setIsRunningAnalysis(true);
        await onRunAnalysis();
      }
      onNext();
    } else if (input === 'n' || input === 'N') {
      onNext();
    }
  });

  const hasErrors = validationResults.some(result => result.status === 'error');
  const hasWarnings = validationResults.some(result => result.status === 'warning');

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="green">
          🎉 Setup Wizard Completed!
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold>Configuration Summary:</Text>
        </Box>

        {validationResults.map(result => (
          <Box key={result.tool} marginBottom={1} flexDirection="column">
            <Box>
              <Text>
                {result.status === 'success' && <Text color="green">✓</Text>}
                {result.status === 'warning' && <Text color="yellow">⚠</Text>}
                {result.status === 'error' && <Text color="red">✗</Text>}
                <Text> {result.tool}</Text>
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>{result.message}</Text>
            </Box>
            {result.configPath && (
              <Box marginLeft={2}>
                <Text dimColor>Config: {result.configPath}</Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold>Generated Files:</Text>
        </Box>

        {generatedFiles.length > 0 ? (
          generatedFiles.map(file => (
            <Box key={file} marginLeft={2}>
              <Text dimColor>• {file}</Text>
            </Box>
          ))
        ) : (
          <Box marginLeft={2}>
            <Text dimColor>No new files generated</Text>
          </Box>
        )}
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      {hasErrors && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color="red" bold>
              ⚠ Some configurations failed validation
            </Text>
          </Box>
          <Box>
            <Text>Please review the errors above and fix them manually.</Text>
          </Box>
        </Box>
      )}

      {hasWarnings && !hasErrors && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color="yellow" bold>
              ⚠ Some configurations have warnings
            </Text>
          </Box>
          <Box>
            <Text>The setup completed, but you may want to review the warnings above.</Text>
          </Box>
        </Box>
      )}

      {!hasErrors && !hasWarnings && (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="green">✓ All configurations validated successfully!</Text>
          </Box>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold>Next Steps:</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>1. Review the generated configuration files</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>2. Customize configurations as needed for your project</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>3. Run 'dev-quality analyze' to analyze your project</Text>
        </Box>
        <Box marginLeft={2}>
          <Text>4. Run 'dev-quality report' to generate quality reports</Text>
        </Box>
      </Box>

      {!isRunningAnalysis && !hasErrors && onRunAnalysis && (
        <Box marginTop={1}>
          <Text>
            Run initial analysis now?{' '}
            <Text bold color="green">
              (Y)es
            </Text>{' '}
            /{' '}
            <Text bold color="yellow">
              (N)o
            </Text>
          </Text>
        </Box>
      )}

      {isRunningAnalysis && (
        <Box marginTop={1}>
          <Text color="cyan">⏳ Running initial analysis...</Text>
        </Box>
      )}

      {(hasErrors || !onRunAnalysis) && (
        <Box marginTop={1}>
          <Text>
            Press <Text bold>(Y)</Text> to exit
          </Text>
        </Box>
      )}
    </Box>
  );
}
