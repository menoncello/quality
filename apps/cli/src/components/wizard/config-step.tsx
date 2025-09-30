import React from 'react';
import { Box, Text, useInput } from 'ink';
import { WizardStepProps } from './wizard-container';

export interface ConfigStepProps extends WizardStepProps {
  toolName: string;
  description: string;
  configPath: string;
  existingConfig?: boolean;
  configPreview?: string;
  onGenerate: () => Promise<void>;
  onValidate: () => Promise<boolean>;
}

type StepState = 'input' | 'generating' | 'validating' | 'complete' | 'error';

export function ConfigStep({
  toolName,
  description,
  configPath,
  existingConfig,
  configPreview,
  onNext,
  onBack,
  onGenerate,
  onValidate,
}: ConfigStepProps): React.ReactElement {
  const [state, setState] = React.useState<StepState>('input');
  const [action, setAction] = React.useState<'replace' | 'merge' | 'skip'>();
  const [error, setError] = React.useState<string>();

  useInput(async input => {
    if (state !== 'input') {
      return;
    }

    if (input === 'b' || input === 'B') {
      onBack();
      return;
    }

    if (existingConfig) {
      if (input === 'r' || input === 'R') {
        setAction('replace');
        await processGeneration('replace');
      } else if (input === 'm' || input === 'M') {
        setAction('merge');
        await processGeneration('merge');
      } else if (input === 's' || input === 'S') {
        setAction('skip');
        onNext({ [`${toolName}Action`]: 'skip' });
      }
    } else {
      if (input === 'y' || input === 'Y') {
        await processGeneration('create');
      } else if (input === 'n' || input === 'N') {
        onNext({ [`${toolName}Action`]: 'skip' });
      }
    }
  });

  const processGeneration = async (generationAction: string) => {
    try {
      setState('generating');
      await onGenerate();

      setState('validating');
      const isValid = await onValidate();

      if (isValid) {
        setState('complete');
        setTimeout(() => {
          onNext({ [`${toolName}Action`]: generationAction, [`${toolName}Config`]: configPath });
        }, 1000);
      } else {
        setState('error');
        setError('Configuration validation failed');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>{toolName} Configuration</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>{description}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Configuration file: {configPath}</Text>
      </Box>

      {existingConfig && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color="yellow">⚠ Existing configuration detected</Text>
          </Box>
          {configPreview && (
            <Box marginBottom={1} flexDirection="column">
              <Text dimColor>Current configuration preview:</Text>
              <Box marginLeft={2} flexDirection="column">
                <Text dimColor>{configPreview}</Text>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {state === 'input' && (
        <Box flexDirection="column">
          {existingConfig ? (
            <Box marginTop={1}>
              <Text>
                <Text bold color="cyan">
                  (R)eplace
                </Text>{' '}
                /{' '}
                <Text bold color="green">
                  (M)erge
                </Text>{' '}
                /{' '}
                <Text bold color="yellow">
                  (S)kip
                </Text>{' '}
                /{' '}
                <Text bold dimColor>
                  (B)ack
                </Text>
              </Text>
            </Box>
          ) : (
            <Box marginTop={1}>
              <Text>
                Generate configuration?{' '}
                <Text bold color="green">
                  (Y)es
                </Text>{' '}
                /{' '}
                <Text bold color="yellow">
                  (N)o
                </Text>{' '}
                /{' '}
                <Text bold dimColor>
                  (B)ack
                </Text>
              </Text>
            </Box>
          )}
        </Box>
      )}

      {state === 'generating' && (
        <Box marginTop={1}>
          <Text color="cyan">⏳ Generating configuration...</Text>
        </Box>
      )}

      {state === 'validating' && (
        <Box marginTop={1}>
          <Text color="cyan">⏳ Validating configuration...</Text>
        </Box>
      )}

      {state === 'complete' && (
        <Box marginTop={1}>
          <Text color="green">✓ Configuration {action ?? 'created'} successfully!</Text>
        </Box>
      )}

      {state === 'error' && error && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color="red">✗ Error: {error}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              Press <Text bold>(B)ack</Text> to return
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
