/**
 * Navigation Transitions Component
 * Provides smooth transitions between different dashboard views
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

interface TransitionState {
  isTransitioning: boolean;
  fromView: string;
  toView: string;
  progress: number;
}

interface NavigationTransitionsProps {
  isTransitioning: boolean;
  fromView: string;
  toView: string;
  duration?: number;
  onComplete?: () => void;
}

export const NavigationTransitions: React.FC<NavigationTransitionsProps> = ({
  isTransitioning,
  fromView,
  toView,
  duration = 500,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    fromView: '',
    toView: '',
    progress: 0,
  });

  useEffect(() => {
    if (isTransitioning && !transitionState.isTransitioning) {
      setTransitionState({
        isTransitioning: true,
        fromView,
        toView,
        progress: 0,
      });
      setProgress(0);

      // Animate progress using setInterval instead of requestAnimationFrame
      const startTime = Date.now();
      const animateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(elapsed / duration, 1);

        setProgress(currentProgress);
        setTransitionState(prev => ({ ...prev, progress: currentProgress }));

        if (currentProgress >= 1) {
          clearInterval(animateInterval);
          setTransitionState({
            isTransitioning: false,
            fromView: '',
            toView: '',
            progress: 1,
          });
          onComplete?.();
        }
      }, 16); // ~60fps

      return () => clearInterval(animateInterval);
    }
  }, [isTransitioning, fromView, toView, duration, onComplete, transitionState.isTransitioning]);

  if (!transitionState.isTransitioning) {
    return null;
  }

  // Render transition animation
  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box flexDirection="row" alignItems="center" marginBottom={1}>
        <Text color="gray">Transitioning: </Text>
        <Text color="blue">{transitionState.fromView}</Text>
        <Text color="gray"> → </Text>
        <Text color="green">{transitionState.toView}</Text>
      </Box>

      {/* Progress bar */}
      <Box width={30} flexDirection="row">
        <Text color="gray">[</Text>
        {Array.from({ length: 28 }).map((_, index) => {
          const isActive = index / 28 <= progress;
          return (
            <Text key={index} color={isActive ? 'green' : 'gray'}>
              {isActive ? '█' : '░'}
            </Text>
          );
        })}
        <Text color="gray">]</Text>
      </Box>

      <Text color="gray">{Math.round(progress * 100)}%</Text>
    </Box>
  );
};

/**
 * Fade transition component
 */
export const FadeTransition: React.FC<{
  show: boolean;
  children: React.ReactNode;
}> = ({ show, children }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show !== visible) {
      const timer = setTimeout(() => setVisible(show), 50);
      return () => clearTimeout(timer);
    }
  }, [show, visible]);

  return visible ? <Box>{children}</Box> : null;
};

/**
 * Slide transition component
 */
export const SlideTransition: React.FC<{
  show: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  children: React.ReactNode;
}> = ({ show, direction = 'right', children }) => {
  const [visible, setVisible] = useState(show);
  const [currentDirection, setCurrentDirection] = useState(direction);

  useEffect(() => {
    if (show !== visible) {
      setCurrentDirection(show ? 'right' : 'left');
      const timer = setTimeout(() => setVisible(show), 100);
      return () => clearTimeout(timer);
    }
  }, [show, visible]);

  if (!visible) return null;

  const getOffset = () => {
    switch (currentDirection) {
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '';
    }
  };

  return (
    <Box flexDirection="row" alignItems="center">
      {currentDirection === 'left' && <Text color="gray">{getOffset()}</Text>}
      <Box>{children}</Box>
      {currentDirection === 'right' && <Text color="gray">{getOffset()}</Text>}
    </Box>
  );
};

/**
 * Loading transition for view changes
 */
export const LoadingTransition: React.FC<{
  message?: string;
  duration?: number;
}> = ({ message = 'Loading...', duration = 2000 }) => {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 200);

    const timeInterval = setInterval(() => {
      setElapsed(prev => prev + 100);
    }, 100);

    return () => {
      clearInterval(dotInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const progress = Math.min(elapsed / duration, 1);
  const progressWidth = Math.round(progress * 20);

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box flexDirection="row" alignItems="center" marginBottom={1}>
        <Text color="cyan">{message}</Text>
        <Text color="gray">{dots}</Text>
      </Box>

      <Box width={22} flexDirection="row">
        <Text color="gray">[</Text>
        {Array.from({ length: 20 }).map((_, index) => {
          const isActive = index < progressWidth;
          return (
            <Text key={index} color={isActive ? 'cyan' : 'gray'}>
              {isActive ? '█' : '░'}
            </Text>
          );
        })}
        <Text color="gray">]</Text>
      </Box>

      {progress < 1 && (
        <Text color="gray" italic>
          Preparing view... ({Math.round(progress * 100)}%)
        </Text>
      )}
    </Box>
  );
};

export default NavigationTransitions;
