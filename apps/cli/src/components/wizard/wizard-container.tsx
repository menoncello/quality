import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';

export interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<WizardStepProps>;
}

export interface WizardStepProps {
  current: number;
  total: number;
  onNext: (stepData?: Record<string, unknown>) => void;
  onBack: () => void;
  onCancel: () => void;
  data?: Record<string, unknown>;
}

export interface WizardContainerProps {
  steps: WizardStep[];
  onComplete: (wizardData: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function WizardContainer({
  steps,
  onComplete,
  onCancel,
}: WizardContainerProps): React.ReactElement {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [wizardData, setWizardData] = React.useState<Record<string, unknown>>({});
  const { exit } = useApp();

  const handleNext = React.useCallback(
    (stepData?: Record<string, unknown>) => {
      const newData = { ...wizardData, ...stepData };
      setWizardData(newData);

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(newData);
      }
    },
    [currentStep, steps.length, wizardData, onComplete]
  );

  const handleBack = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleCancel = React.useCallback(() => {
    onCancel();
    exit();
  }, [onCancel, exit]);

  useInput((input, key) => {
    if (key.escape || (input === 'c' && key.ctrl)) {
      handleCancel();
    }
  });

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData?.component;

  if (!StepComponent) {
    return (
      <Box>
        <Text color="red">Error: Invalid wizard step</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Setup Wizard - {currentStepData.title}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      <StepComponent
        current={currentStep}
        total={steps.length}
        onNext={handleNext}
        onBack={handleBack}
        onCancel={handleCancel}
        data={wizardData}
      />

      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press ESC or Ctrl+C to cancel</Text>
      </Box>
    </Box>
  );
}
