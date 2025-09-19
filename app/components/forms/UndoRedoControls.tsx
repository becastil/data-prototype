'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Undo2, Redo2, RotateCcw, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset?: () => void;
  historyLength?: number;
  className?: string;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  historyLength = 0,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8 p-0 hover:bg-slate-100 disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8 p-0 hover:bg-slate-100 disabled:opacity-50"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y or Ctrl+Shift+Z)</p>
            </TooltipContent>
          </Tooltip>

          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-600 hover:text-red-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset all changes</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {historyLength > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <History className="h-3 w-3" />
            <span>{historyLength} changes</span>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};

export default UndoRedoControls;