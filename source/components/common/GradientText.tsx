import React from 'react';
import { Text, Box } from 'ink';

interface GradientTextProps {
  text: string;
  gradient: string[];
}

export const GradientText: React.FC<GradientTextProps> = ({ text, gradient }) => {
  const lines = text.split('\n').filter(line => line.length > 0);
  
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        const colorIndex = Math.min(
          Math.floor((i / Math.max(lines.length - 1, 1)) * (gradient.length - 1)),
          gradient.length - 1
        );
        return (
          <Text key={i} color={gradient[colorIndex]}>{line}</Text>
        );
      })}
    </Box>
  );
};
