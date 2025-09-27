import React, { useState, useCallback } from 'react';
import { FileText, StickyNote, Brain } from 'lucide-react';
import { toast } from 'sonner';
import AUTH_CONFIG from '@/config/auth';
import { MCQSession } from './mcq-session';
import { SummaryDisplay } from './summary-display';
import { PersonalNotes } from './personal-notes';
import { Exercises } from './exercises';
import { MCQConfigModal } from './mcq-config-modal';
import { MCQSessionSelector } from './mcq-session-selector';
import { NewSummaryDialog } from './new-summary-dialog';

interface GoldenSummaryProps {
  fileId: string;
  fileName: string;
  workspaceId: string;
}

interface SummaryStructure {
  heading: string;
  content: string;
}

interface SummaryData {
  id: string;
  summary: string;
  keyTopics: string[];
  structure: SummaryStructure[];
  personalNotes?: string;
  type: string;
  status: string;
  createdAt: string;
  title?: string;
  version?: number;
}

interface SummaryListItem {
  id: string;
  title: string;
  version: number;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  keyTopics: string[];
}

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface MCQQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  context: string;
}

interface SessionResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

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

const GoldenSummary: React.FC<GoldenSummaryProps> = ({ fileId, fileName, workspaceId }) => {
  // Summary state
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryList, setSummaryList] = useState<SummaryListItem[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Notes state
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'exercises'>('summary');
  const [showNewSummaryDialog, setShowNewSummaryDialog] = useState(false);
  const [newSummaryTitle, setNewSummaryTitle] = useState('');
  
  // MCQ state
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [mcqSettings, setMCQSettings] = useState({
    difficulty: 'Easy',
    numberOfQuestions: 20,
    focus: 'Tailored for me',
    studyMode: 'Study Solo',
    sessionMode: 'Practice Mode',
    showAnswers: 'immediately'
  });
  const [showMCQSession, setShowMCQSession] = useState(false);
  const [mcqQuestions, setMCQQuestions] = useState<MCQQuestion[]>([]);
  const [mcqSessionId, setMCQSessionId] = useState<string>('');
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [existingSessions, setExistingSessions] = useState<MCQSessionData[]>([]);
  const [showSessionSelector, setShowSessionSelector] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Summary functions
  const loadSummaryList = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/summaries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummaryList(data.summaries);
          if (data.summaries.length > 0 && !selectedSummaryId) {
            setSelectedSummaryId(data.summaries[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading summary list:', error);
    }
  }, [fileId, workspaceId, selectedSummaryId]);

  const loadSpecificSummary = useCallback(async (summaryId: string) => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/summaries/${summaryId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fileId, workspaceId]);

  const generateSummary = async (title?: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to generate summaries');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'golden',
          regenerate: false,
          title: title || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
        setSelectedSummaryId(data.summary.id);
        toast.success('Golden summary generated successfully!');
        loadSummaryList();
      } else {
        toast.error(data.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
      setShowNewSummaryDialog(false);
      setNewSummaryTitle('');
    }
  };

  // Notes functions
  const loadPersonalNotes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPersonalNotes(data.notes || []);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, [fileId, workspaceId]);

  const createNewNote = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to create notes');
      return;
    }

    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    setIsSavingNote(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Note created successfully!');
        setNewNoteTitle('');
        setNewNoteContent('');
        loadPersonalNotes();
      } else {
        toast.error(data.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const updateNote = async (noteId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to update notes');
      return;
    }

    setIsSavingNote(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingNoteTitle,
          content: editingNoteContent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Note updated successfully!');
        setEditingNoteId(null);
        setEditingNoteTitle('');
        setEditingNoteContent('');
        loadPersonalNotes();
      } else {
        toast.error(data.message || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to delete notes');
      return;
    }

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Note deleted successfully!');
        loadPersonalNotes();
      } else {
        toast.error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const startEditingNote = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteTitle('');
    setEditingNoteContent('');
  };

  // MCQ functions
  const handleStartMCQSession = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to start MCQ session');
      return;
    }

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/mcq/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Existing sessions check:', data);
      
      if (data.success && data.sessions && data.sessions.length > 0) {
        console.log('Found existing sessions:', data.sessions.length);
        setExistingSessions(data.sessions);
        setShowSessionSelector(true);
        return;
      } else {
        console.log('No existing sessions found, generating new ones');
      }
    } catch (error) {
      console.error('Error loading existing MCQ sessions:', error);
    }

    await generateNewMCQSession();
  };

  const generateNewMCQSession = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to generate MCQ session');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/mcq/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: mcqSettings.difficulty,
          numberOfQuestions: mcqSettings.numberOfQuestions,
          focus: mcqSettings.focus
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Generated ${data.mcqs.length} questions successfully!`);
        setMCQQuestions(data.mcqs);
        setMCQSessionId(data.sessionId);
        setShowSessionSelector(false);
        setShowMCQModal(false);
        setShowMCQSession(true);
      } else {
        toast.error(data.message || 'Failed to generate MCQ questions');
      }
    } catch (error) {
      console.error('Error generating MCQs:', error);
      toast.error('Failed to generate MCQ questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadMCQSession = async (sessionId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to load MCQ session');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/mcq/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        const formattedQuestions = data.questions.map((q: { id: string; question: string; options: any; explanation: string; difficulty: string; topic: string; context?: string }) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
          context: q.context || ''
        }));

        setMCQQuestions(formattedQuestions);
        setMCQSessionId(sessionId);
        setShowSessionSelector(false);
        setShowMCQModal(false);
        setShowMCQSession(true);
        toast.success('MCQ session loaded successfully!');
      } else {
        toast.error(data.message || 'Failed to load MCQ session');
      }
    } catch (error) {
      console.error('Error loading MCQ session:', error);
      toast.error('Failed to load MCQ session. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMCQSessionComplete = (results: SessionResults) => {
    setSessionResults(results);
    toast.success(`Session completed! You scored ${results.score}/${results.totalQuestions} (${results.percentage}%)`);
    console.log('MCQ Session Results:', results);
  };

  const handleBackFromMCQSession = () => {
    setShowMCQSession(false);
    setMCQQuestions([]);
    setMCQSessionId('');
    setSessionResults(null);
  };

  // Load data on component mount
  React.useEffect(() => {
    loadSummaryList();
    loadPersonalNotes();
  }, [fileId, workspaceId, loadSummaryList, loadPersonalNotes]);

  React.useEffect(() => {
    if (selectedSummaryId) {
      loadSpecificSummary(selectedSummaryId);
    }
  }, [selectedSummaryId, loadSpecificSummary]);

  // Show MCQ Session if active
  if (showMCQSession && mcqQuestions.length > 0) {
    return (
      <MCQSession
        sessionId={mcqSessionId}
        workspaceId={workspaceId}
        fileId={fileId}
        questions={mcqQuestions}
        sessionSettings={mcqSettings}
        fileName={fileName}
        onBack={handleBackFromMCQSession}
        onComplete={handleMCQSessionComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'summary'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              AI Summary
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'notes'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Personal Notes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'exercises'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Exercises
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'summary' && (
          <SummaryDisplay
            summary={summary}
            summaryList={summaryList}
            selectedSummaryId={selectedSummaryId}
            isGenerating={isGenerating}
            isLoading={isLoading}
            fileName={fileName}
            onSummarySelect={setSelectedSummaryId}
            onNewSummary={() => setShowNewSummaryDialog(true)}
            onCreateNewSummary={() => {
              setSummary(null);
              setShowNewSummaryDialog(true);
            }}
          />
        )}

        {activeTab === 'notes' && (
          <PersonalNotes
            personalNotes={personalNotes}
            editingNoteId={editingNoteId}
            editingNoteTitle={editingNoteTitle}
            editingNoteContent={editingNoteContent}
            isSavingNote={isSavingNote}
            newNoteTitle={newNoteTitle}
            newNoteContent={newNoteContent}
            onEditingNoteTitleChange={setEditingNoteTitle}
            onEditingNoteContentChange={setEditingNoteContent}
            onNewNoteTitleChange={setNewNoteTitle}
            onNewNoteContentChange={setNewNoteContent}
            onCreateNewNote={createNewNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onStartEditingNote={startEditingNote}
            onCancelEditingNote={cancelEditingNote}
          />
        )}

        {activeTab === 'exercises' && (
          <Exercises onStartMCQ={() => setShowMCQModal(true)} />
        )}
      </div>

      {/* Modals */}
      <NewSummaryDialog
        show={showNewSummaryDialog}
        newSummaryTitle={newSummaryTitle}
        isGenerating={isGenerating}
        onTitleChange={setNewSummaryTitle}
        onCancel={() => {
          setShowNewSummaryDialog(false);
          setNewSummaryTitle('');
        }}
        onGenerate={() => generateSummary(newSummaryTitle)}
      />

      <MCQSessionSelector
        show={showSessionSelector}
        existingSessions={existingSessions}
        mcqSettings={mcqSettings}
        isGenerating={isGenerating}
        onClose={() => setShowSessionSelector(false)}
        onCreateNew={generateNewMCQSession}
        onLoadSession={loadMCQSession}
      />

      <MCQConfigModal
        show={showMCQModal}
        fileName={fileName}
        mcqSettings={mcqSettings}
        isGenerating={isGenerating}
        onClose={() => setShowMCQModal(false)}
        onSettingsChange={setMCQSettings}
        onStart={handleStartMCQSession}
      />
    </div>
  );
};

export default GoldenSummary;
