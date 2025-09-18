'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  ModernCard, 
  ModernContainer, 
  ModernHeader, 
  ModernText, 
  ModernGrid, 
  ModernBadge,
  ModernSection
} from './modern-layout';
import { cn } from '@/app/lib/utils';

/**
 * Modern Upload Components - Clean, Minimalist File Upload Experience
 */

interface ModernUploadZoneProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
}

export const ModernUploadZone: React.FC<ModernUploadZoneProps> = ({
  onFileSelect,
  accept = '.csv',
  multiple = false,
  maxSize = '10MB',
  isLoading = false,
  isSuccess = false,
  isError = false,
  errorMessage,
  className
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getStateIcon = () => {
    if (isLoading) return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Sparkles className="w-8 h-8" /></motion.div>;
    if (isSuccess) return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (isError) return <AlertCircle className="w-8 h-8 text-red-500" />;
    return <FileSpreadsheet className="w-8 h-8 text-slate-400" />;
  };

  const getStateText = () => {
    if (isLoading) return 'Processing your file...';
    if (isSuccess) return 'File uploaded successfully!';
    if (isError) return errorMessage || 'Upload failed';
    return 'Drop your CSV file here or click to browse';
  };

  const getStateColors = () => {
    if (isSuccess) return 'border-green-200 bg-green-50/50';
    if (isError) return 'border-red-200 bg-red-50/50';
    if (isDragging) return 'border-blue-300 bg-blue-50/50';
    return 'border-slate-200 bg-white';
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isLoading}
      />
      
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
          getStateColors(),
          isLoading && 'cursor-not-allowed'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!isLoading ? handleClick : undefined}
        whileHover={!isLoading ? { scale: 1.01 } : undefined}
        whileTap={!isLoading ? { scale: 0.99 } : undefined}
      >
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {getStateIcon()}
          </motion.div>
          
          <div>
            <ModernHeader size="md" className="mb-2">
              {getStateText()}
            </ModernHeader>
            
            {!isLoading && !isSuccess && !isError && (
              <ModernText size="sm" color="muted">
                Supports {accept} files up to {maxSize}
              </ModernText>
            )}
          </div>
          
          {!isLoading && !isSuccess && (
            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4" />
              Choose File
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

interface UploadRequirementsProps {
  title: string;
  requirements: string[];
  templateUrl?: string;
  className?: string;
}

export const UploadRequirements: React.FC<UploadRequirementsProps> = ({
  title,
  requirements,
  templateUrl,
  className
}) => {
  return (
    <ModernCard className={className}>
      <div className="mb-4">
        <ModernHeader size="md" className="mb-2">
          {title}
        </ModernHeader>
        <ModernText size="sm" color="muted">
          Required columns for your CSV file
        </ModernText>
      </div>
      
      <div className="space-y-3 mb-6">
        {requirements.map((requirement, index) => (
          <motion.div
            key={requirement}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <ModernText size="sm">
              {requirement}
            </ModernText>
          </motion.div>
        ))}
      </div>
      
      {templateUrl && (
        <motion.a
          href={templateUrl}
          download
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
          whileHover={{ x: 5 }}
        >
          <Download className="w-4 h-4" />
          Download Template
          <ArrowRight className="w-4 h-4" />
        </motion.a>
      )}
    </ModernCard>
  );
};

interface UploadStepsProps {
  currentStep: number;
  steps: { title: string; description: string }[];
  className?: string;
}

export const UploadSteps: React.FC<UploadStepsProps> = ({ 
  currentStep, 
  steps, 
  className 
}) => {
  return (
    <div className={cn('flex items-center justify-center space-x-8', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <React.Fragment key={step.title}>
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300',
                isCompleted 
                  ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                  : isActive 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 ring-4 ring-blue-50' 
                    : 'bg-slate-100 text-slate-500 border-2 border-slate-200'
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              <div>
                <div className={cn(
                  'font-medium text-sm transition-colors duration-300',
                  isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-500'
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-slate-500 max-w-24 truncate">
                  {step.description}
                </div>
              </div>
            </motion.div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                'h-px w-12 transition-colors duration-300',
                index < currentStep ? 'bg-green-200' : 'bg-slate-200'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface ModernUploadPageProps {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  className?: string;
}

export const ModernUploadPage: React.FC<ModernUploadPageProps> = ({
  title,
  subtitle, 
  currentStep,
  totalSteps,
  children,
  className
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    title: `Step ${i + 1}`,
    description: i === 0 ? 'Upload' : i === 1 ? 'Configure' : 'Analyze'
  }));

  return (
    <div className={cn('min-h-screen bg-slate-50/30', className)}>
      <ModernSection spacing="xl">
        <ModernContainer size="lg">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ModernHeader size="xl" className="mb-4">
              {title}
            </ModernHeader>
            <ModernText size="lg" color="muted" className="max-w-2xl mx-auto">
              {subtitle}
            </ModernText>
          </motion.div>
          
          {/* Progress Steps */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <UploadSteps currentStep={currentStep} steps={steps} />
          </motion.div>
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {children}
          </motion.div>
        </ModernContainer>
      </ModernSection>
    </div>
  );
};

export default {
  ModernUploadZone,
  UploadRequirements,
  UploadSteps,
  ModernUploadPage
};