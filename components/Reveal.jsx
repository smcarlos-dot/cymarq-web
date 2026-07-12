'use client';

import { motion } from 'framer-motion';

/**
 * Aparición por fade + desplazamiento al entrar en el viewport (estilo Apple).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 40,
  once = true,
  className = '',
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
