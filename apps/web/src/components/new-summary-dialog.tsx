import React from 'react';
import { Button } from './ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface NewSummaryDialogProps {
  show: boolean;
  newSummaryTitle: string;
  isGenerating: boolean;
  onTitleChange: (title: string) => void;
  onCancel: () => void;
  onGenerate: () => void;
}

export function NewSummaryDialog({
  show,
  newSummaryTitle,
  isGenerating,
  onTitleChange,
  onCancel,
  onGenerate
}: NewSummaryDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Create New Summary</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Title
            </label>
            <input
              type="text"
              value={newSummaryTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Key Concepts, Chapter 1 Summary, Quick Review"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isGenerating || !newSummaryTitle.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
