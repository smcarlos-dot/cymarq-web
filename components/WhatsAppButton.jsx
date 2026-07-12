'use client';

import { motion } from 'framer-motion';
import { site } from '@/data/site';

export default function WhatsAppButton() {
  return (
    <motion.a
      href={site.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp ${site.whatsapp}`}
      title={`WhatsApp ${site.whatsapp}`}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-xl shadow-black/25"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" aria-hidden="true">
        <path d="M16.04 4c-6.6 0-11.96 5.33-11.96 11.9 0 2.1.56 4.14 1.62 5.94L4 28l6.32-1.65a12 12 0 0 0 5.71 1.45h.01c6.6 0 11.96-5.33 11.96-11.9C28 9.33 22.64 4 16.04 4Zm0 21.77h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.64-.24-.37a9.8 9.8 0 0 1-1.52-5.25c0-5.45 4.46-9.88 9.93-9.88a9.9 9.9 0 0 1 9.92 9.9c0 5.45-4.46 9.85-9.93 9.85Zm5.45-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </motion.a>
  );
}
