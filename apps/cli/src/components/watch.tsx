import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

interface WatchProps {
  debounce?: string;
  interval?: string;
}

export function WatchComponent(props: WatchProps): React.ReactElement {
  const { exit } = useApp();
  const [isRunning, setIsRunning] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = parseInt(props.interval ?? '5000');
    const interval = setInterval(() => {
      setLastRun(new Date());
      setAnalysisCount(prev => prev + 1);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isRunning, props.interval]);

  useEffect(() => {
    const handleKeyPress = (data: Buffer | string) => {
      if (data === 'q') {
        setIsRunning(false);
        exit();
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', handleKeyPress);

    return () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', handleKeyPress);
    };
  }, [exit]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          DevQuality Watch Mode
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Monitoring for changes...</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Press 'q' to quit</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="green">Status: {isRunning ? 'Running' : 'Stopped'}</Text>
      </Box>

      {lastRun && (
        <Box marginBottom={1}>
          <Text>Last run: {lastRun.toLocaleTimeString()}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text>Analyses completed: {analysisCount}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Interval: {props.interval ?? '5000'}ms | Debounce: {props.debounce ?? '1000'}ms
        </Text>
      </Box>
    </Box>
  );
}
