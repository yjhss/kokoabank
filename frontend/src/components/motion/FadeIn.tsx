import type { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type FadeInProps = PropsWithChildren<{
  delay?: number;
  className?: string;
}>;

export default function FadeIn({
  children,
  delay = 0,
  className = '',
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
