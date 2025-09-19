'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CloudUpload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import CSVLoader, { type CSVLoaderProps } from '../loaders/CSVLoader';
import { ModernCard, type ModernCardProps } from './modern-card';

type ModernUploadProps = Omit<CSVLoaderProps, 'className'> & {
  title: string;
  description?: string;
  helper?: string;
  icon?: React.ReactNode;
  sampleLink?: { href: string; label: string };
  footer?: React.ReactNode;
  tone?: ModernCardProps['tone'];
  cardClassName?: string;
  loaderClassName?: string;
};

const ModernUpload: React.FC<ModernUploadProps> = ({
  title,
  description,
  helper,
  icon,
  sampleLink,
  footer,
  tone = 'surface',
  cardClassName,
  loaderClassName,
  ...loaderProps
}) => (
  <ModernCard
    tone={tone}
    padding="lg"
    hoverable={false}
    className={cn(
      'flex flex-col gap-10 overflow-hidden rounded-[32px] border-0 bg-white/95 shadow-[0_32px_88px_-48px_rgba(15,23,42,0.55)] backdrop-blur',
      cardClassName,
    )}
  >
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <h3 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h3>
        {description ? (
          <p className="max-w-xl text-base leading-relaxed text-[var(--foreground-muted)]/90">
            {description}
          </p>
        ) : null}
      </div>
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 via-sky-400/10 to-cyan-400/10 text-sky-600"
      >
        {icon || <CloudUpload className="h-7 w-7" aria-hidden />}
      </motion.span>
    </div>

    <CSVLoader
      {...loaderProps}
      className={cn(
        'rounded-3xl bg-white/95 p-0 shadow-none ring-1 ring-slate-100/70 transition-all duration-300 hover:ring-[var(--accent)]/50 hover:shadow-[0_24px_56px_-32px_rgba(15,23,42,0.45)]',
        loaderClassName,
      )}
    />

    {helper ? (
      <p className="max-w-md text-sm leading-relaxed text-[var(--foreground-subtle)]">
        {helper}
      </p>
    ) : null}

    {sampleLink ? (
      <motion.a
        href={sampleLink.href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
        whileHover={{ x: 2 }}
      >
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
        <span>{sampleLink.label}</span>
      </motion.a>
    ) : null}

    {footer ? <div className="pt-1">{footer}</div> : null}
  </ModernCard>
);

// Backwards compatible alias used elsewhere in the app.
const ModernUploadZone = ModernUpload;

export type { ModernUploadProps };
export { ModernUpload, ModernUploadZone };
export default ModernUpload;
