import React from 'react';
import { Button } from './ui/button';
import { Loader2, X } from 'lucide-react';

interface MCQSessionData {
  id: string;
  title: string;
  difficulty: string;
  focus: string;
  sessionMode: string;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

interface MCQSettings {
  difficulty: string;
  numberOfQuestions: number;
  focus: string;
  studyMode: string;
  sessionMode: string;
  showAnswers: string;
}

interface MCQSessionSelectorProps {
  show: boolean;
  existingSessions: MCQSessionData[];
  mcqSettings: MCQSettings;
  isGenerating: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onLoadSession: (sessionId: string) => void;
}

export function MCQSessionSelector({
  show,
  existingSessions,
  mcqSettings,
  isGenerating,
  onClose,
  onCreateNew,
  onLoadSession
}: MCQSessionSelectorProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Choose MCQ Session</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Create New Session Option */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Create New Session</h3>
                <p className="text-sm text-gray-600">
                  Generate {mcqSettings.numberOfQuestions} new {mcqSettings.difficulty.toLowerCase()} questions
                </p>
              </div>
              <Button
                onClick={onCreateNew}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Create New'
                )}
              </Button>
            </div>
          </div>

          {/* Existing Sessions */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Previous Sessions</h3>
            {existingSessions.map((session) => (
              <div key={session.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {session.difficulty}
                      </span>
                      <span>{session.totalQuestions} questions</span>
                      <span>{session.focus}</span>
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onLoadSession(session.id)}
                    disabled={isGenerating}
                    variant="outline"
                    className="ml-4"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Start Session'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
