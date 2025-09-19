'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

interface QuarterlyPresetsProps {
  onSelectRange: (startMonth: string, endMonth: string, label: string) => void;
  currentYear?: number;
}

interface QuarterPreset {
  label: string;
  startMonth: string;
  endMonth: string;
  icon: React.ReactNode;
  description: string;
}

const QuarterlyPresets: React.FC<QuarterlyPresetsProps> = ({ 
  onSelectRange, 
  currentYear = new Date().getFullYear() 
}) => {
  const generateQuarterPresets = (year: number): QuarterPreset[] => [
    {
      label: `Q1 ${year}`,
      startMonth: `${year}-01`,
      endMonth: `${year}-03`,
      icon: <Calendar className="w-4 h-4" />,
      description: 'January - March'
    },
    {
      label: `Q2 ${year}`,
      startMonth: `${year}-04`,
      endMonth: `${year}-06`,
      icon: <Calendar className="w-4 h-4" />,
      description: 'April - June'
    },
    {
      label: `Q3 ${year}`,
      startMonth: `${year}-07`,
      endMonth: `${year}-09`,
      icon: <Calendar className="w-4 h-4" />,
      description: 'July - September'
    },
    {
      label: `Q4 ${year}`,
      startMonth: `${year}-10`,
      endMonth: `${year}-12`,
      icon: <Calendar className="w-4 h-4" />,
      description: 'October - December'
    }
  ];

  const additionalPresets: QuarterPreset[] = [
    {
      label: `H1 ${currentYear}`,
      startMonth: `${currentYear}-01`,
      endMonth: `${currentYear}-06`,
      icon: <Clock className="w-4 h-4" />,
      description: 'First Half Year'
    },
    {
      label: `H2 ${currentYear}`,
      startMonth: `${currentYear}-07`,
      endMonth: `${currentYear}-12`,
      icon: <Clock className="w-4 h-4" />,
      description: 'Second Half Year'
    },
    {
      label: `FY ${currentYear}`,
      startMonth: `${currentYear}-01`,
      endMonth: `${currentYear}-12`,
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Full Year'
    },
    {
      label: `YTD ${currentYear}`,
      startMonth: `${currentYear}-01`,
      endMonth: (() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        return `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      })(),
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Year to Date'
    }
  ];

  const currentYearQuarters = generateQuarterPresets(currentYear);
  const nextYearQuarters = generateQuarterPresets(currentYear + 1);
  const allPresets = [...currentYearQuarters, ...nextYearQuarters, ...additionalPresets];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Range Selection</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {currentYearQuarters.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onSelectRange(preset.startMonth, preset.endMonth, preset.label)}
              className="flex items-center gap-2 h-auto py-3 px-3 text-left flex-col"
            >
              <div className="flex items-center gap-2 w-full">
                {preset.icon}
                <span className="font-medium">{preset.label}</span>
              </div>
              <span className="text-xs text-slate-500 w-full">{preset.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Extended Periods</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {additionalPresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onSelectRange(preset.startMonth, preset.endMonth, preset.label)}
              className="flex items-center gap-2 h-auto py-3 px-3 text-left flex-col"
            >
              <div className="flex items-center gap-2 w-full">
                {preset.icon}
                <span className="font-medium">{preset.label}</span>
              </div>
              <span className="text-xs text-slate-500 w-full">{preset.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Next Year Planning</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {nextYearQuarters.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onSelectRange(preset.startMonth, preset.endMonth, preset.label)}
              className="flex items-center gap-2 h-auto py-3 px-3 text-left flex-col opacity-75 hover:opacity-100"
            >
              <div className="flex items-center gap-2 w-full">
                {preset.icon}
                <span className="font-medium">{preset.label}</span>
              </div>
              <span className="text-xs text-slate-500 w-full">{preset.description}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Healthcare Planning Tip</p>
            <p>Q4 typically shows higher claims activity due to deductible resets. Plan fee adjustments accordingly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyPresets;