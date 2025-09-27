import React from 'react';
import { Button } from './ui/button';
import { Loader2, X, ChevronDown, Settings } from 'lucide-react';

interface MCQSettings {
  difficulty: string;
  numberOfQuestions: number;
  focus: string;
  studyMode: string;
  sessionMode: string;
  showAnswers: string;
}

interface MCQConfigModalProps {
  show: boolean;
  fileName: string;
  mcqSettings: MCQSettings;
  isGenerating: boolean;
  onClose: () => void;
  onSettingsChange: (settings: MCQSettings) => void;
  onStart: () => void;
}

export function MCQConfigModal({
  show,
  fileName,
  mcqSettings,
  isGenerating,
  onClose,
  onSettingsChange,
  onStart
}: MCQConfigModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start a Multiple Choice Questions Session</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">All PDFs selected</label>
            <div className="relative">
              <select className="w-full p-3 border border-gray-200 rounded-lg bg-white appearance-none pr-10">
                <option>{fileName}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Study Mode Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="studyMode"
                  value="Study Solo"
                  checked={mcqSettings.studyMode === 'Study Solo'}
                  onChange={(e) => onSettingsChange({...mcqSettings, studyMode: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-gray-900">Study Solo</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="studyMode"
                  value="Study with Friends"
                  checked={mcqSettings.studyMode === 'Study with Friends'}
                  onChange={(e) => onSettingsChange({...mcqSettings, studyMode: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Study with Friends</span>
                  <p className="text-xs text-gray-500">Invite friends to join a session</p>
                  <p className="text-xs text-gray-500">* they don't need an account</p>
                </div>
              </label>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Settings</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select difficulty of the questions</label>
              <div className="relative">
                <select 
                  value={mcqSettings.difficulty}
                  onChange={(e) => onSettingsChange({...mcqSettings, difficulty: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white appearance-none pr-10"
                >
                  <option value="Easy">🟢 Easy</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Hard">🔴 Hard</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select the number of questions</label>
              <div className="relative">
                <select 
                  value={mcqSettings.numberOfQuestions}
                  onChange={(e) => onSettingsChange({...mcqSettings, numberOfQuestions: parseInt(e.target.value)})}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white appearance-none pr-10"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={30}>30</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Focus */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Focus</label>
              <div className="relative">
                <select 
                  value={mcqSettings.focus}
                  onChange={(e) => onSettingsChange({...mcqSettings, focus: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white appearance-none pr-10"
                >
                  <option value="Tailored for me">Tailored for me</option>
                  <option value="All topics">All topics</option>
                  <option value="Weak areas">Weak areas</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">"Tailored for me" includes unanswered exercises and ones you've struggled with.</p>
            </div>
          </div>

          {/* Session Mode */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sessionMode"
                  value="Practice Mode"
                  checked={mcqSettings.sessionMode === 'Practice Mode'}
                  onChange={(e) => onSettingsChange({...mcqSettings, sessionMode: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Practice Mode</span>
                  <p className="text-xs text-gray-500">Show answers immediately</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sessionMode"
                  value="Exam Mode"
                  checked={mcqSettings.sessionMode === 'Exam Mode'}
                  onChange={(e) => onSettingsChange({...mcqSettings, sessionMode: e.target.value})}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium text-gray-900">Exam Mode</span>
                  <p className="text-xs text-gray-500">Show answers after session</p>
                </div>
              </label>
            </div>
          </div>

          {/* Session Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Your session will contain <span className="font-semibold">{mcqSettings.numberOfQuestions} questions</span>
            </p>
          </div>

          {/* Start Button */}
          <div className="flex justify-end pt-4">
            <Button 
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-base font-medium"
              onClick={onStart}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                'Start'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
