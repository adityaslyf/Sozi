import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Sparkles, BookOpen, List, Edit3, Save, X, FileText, StickyNote, Plus, Trash2, Brain, Users, Zap, MessageSquare, GraduationCap, ArrowRight, ChevronDown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import AUTH_CONFIG from '@/config/auth';
import { MCQSession } from './mcq-session';

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
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryList, setSummaryList] = useState<SummaryListItem[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'exercises'>('summary');
  const [showNewSummaryDialog, setShowNewSummaryDialog] = useState(false);
  const [newSummaryTitle, setNewSummaryTitle] = useState('');
  
  // MCQ Configuration Modal State
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [mcqSettings, setMCQSettings] = useState({
    difficulty: 'Easy',
    numberOfQuestions: 20,
    focus: 'Tailored for me',
    studyMode: 'Study Solo', // 'Study Solo' or 'Study with Friends'
    sessionMode: 'Practice Mode', // 'Practice Mode' or 'Exam Mode'
    showAnswers: 'immediately' // 'immediately' or 'after session'
  });

  // MCQ Session State
  const [showMCQSession, setShowMCQSession] = useState(false);
  const [mcqQuestions, setMCQQuestions] = useState<MCQQuestion[]>([]);
  const [mcqSessionId, setMCQSessionId] = useState<string>('');
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [existingSessions, setExistingSessions] = useState<MCQSessionData[]>([]);
  const [showSessionSelector, setShowSessionSelector] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

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
          // Auto-select the latest summary if none selected
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
        // Reload the summary list to show the new summary
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
        loadPersonalNotes(); // Reload notes
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
        loadPersonalNotes(); // Reload notes
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
        loadPersonalNotes(); // Reload notes
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

  const loadExistingMCQSessions = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/mcq/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.success) {
        setExistingSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading existing MCQ sessions:', error);
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
        // Convert database questions to frontend format
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

  const handleStartMCQSession = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to start MCQ session');
      return;
    }

    // First, check if there are existing sessions
    await loadExistingMCQSessions();
    
    // If there are existing sessions, show selector
    if (existingSessions.length > 0) {
      setShowSessionSelector(true);
      return;
    }

    // Otherwise, generate new MCQs directly
    await generateNewMCQSession();
  };

  const handleMCQSessionComplete = (results: SessionResults) => {
    setSessionResults(results);
    toast.success(`Session completed! You scored ${results.score}/${results.totalQuestions} (${results.percentage}%)`);
    
    // Optional: Store results for future analytics
    console.log('MCQ Session Results:', results);
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

  const handleBackFromMCQSession = () => {
    setShowMCQSession(false);
    setMCQQuestions([]);
    setMCQSessionId('');
    setSessionResults(null);
  };

  // Load summary list and notes on component mount
  React.useEffect(() => {
    loadSummaryList();
    loadPersonalNotes();
  }, [fileId, workspaceId, loadSummaryList, loadPersonalNotes]);

  // Load specific summary when selection changes
  React.useEffect(() => {
    if (selectedSummaryId) {
      loadSpecificSummary(selectedSummaryId);
    }
  }, [selectedSummaryId, loadSpecificSummary]);

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Skip empty lines
      if (!line.trim()) return null;
      
      // Clean up the line and handle markdown formatting
      let cleanLine = line.trim();
      
      // Handle bold text (**text** -> <strong>text</strong>)
      cleanLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle bullet points (• or - at start)
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('* ');
      
      if (isBullet) {
        // Remove bullet character and clean
        const bulletText = cleanLine.replace(/^[•\-*]\s*/, '');
        return (
          <div key={index} className="flex items-start gap-3 mb-3">
            <span className="text-blue-500 font-bold mt-1 text-lg">•</span>
            <div 
              className="flex-1 text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: bulletText }}
            />
          </div>
        );
      } else {
        return (
          <div 
            key={index} 
            className="mb-2 leading-relaxed text-gray-800"
            dangerouslySetInnerHTML={{ __html: cleanLine }}
          />
        );
      }
    }).filter(Boolean);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Study Materials</h3>
        </div>
        
        {activeTab === 'summary' && (
          <div className="flex items-center gap-3">
            {summaryList.length > 0 && (
              <select
                value={selectedSummaryId || ''}
                onChange={(e) => setSelectedSummaryId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {summaryList.map((summary) => (
                  <option key={summary.id} value={summary.id}>
                    {summary.title} (v{summary.version})
                  </option>
                ))}
              </select>
            )}
            <Button 
              onClick={() => setShowNewSummaryDialog(true)} 
              disabled={isGenerating}
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
                  {summaryList.length > 0 ? 'New Summary' : 'Generate Golden Notes'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

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
        {/* AI Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading summary...
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Display */}
            {summary && (
        <div className="space-y-6">
          {/* Main Summary */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-800 leading-relaxed text-base">{summary.summary}</p>
            </CardContent>
          </Card>

          {/* Key Topics */}
          {summary.keyTopics && summary.keyTopics.length > 0 && (
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <List className="w-5 h-5 text-green-600" />
                  Key Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3">
                  {summary.keyTopics.map((topic, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200 hover:shadow-sm transition-shadow"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Structured Content */}
          {summary.structure && summary.structure.length > 0 && (
            <div className="space-y-4">
              {summary.structure.map((section, index) => {
                const colors = [
                  'border-l-purple-500 text-purple-600',
                  'border-l-orange-500 text-orange-600', 
                  'border-l-pink-500 text-pink-600',
                  'border-l-indigo-500 text-indigo-600',
                  'border-l-teal-500 text-teal-600'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <Card key={index} className={`border-l-4 shadow-sm ${colorClass.split(' ')[0]}`}>
                    <CardHeader className="pb-4">
                      <CardTitle className={`text-lg font-semibold ${colorClass.split(' ')[1]}`}>
                        {section.heading}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-gray-800 space-y-2 text-base">
                        {formatContent(section.content)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={() => {
                setSummary(null);
                setShowNewSummaryDialog(true);
              }}
              disabled={isGenerating}
              className="hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create New Summary
            </Button>
          </div>
        </div>
      )}

      {/* No Summary State */}
      {!summary && !isLoading && !isGenerating && summaryList.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-yellow-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">Create Golden Summary</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              Transform "{fileName}" into structured, AI-powered study notes with key concepts, topics, and organized content.
            </p>
            <Button 
              onClick={() => setShowNewSummaryDialog(true)} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Golden Notes
            </Button>
          </CardContent>
        </Card>
      )}
            </div>
        )}

        {/* Personal Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-600" />
              <h4 className="text-lg font-semibold text-gray-900">Personal Notes</h4>
              <span className="text-sm text-gray-500">({personalNotes.length})</span>
            </div>

            {/* Quick Add Note Input */}
            <Card className="border-2 border-dashed border-amber-200 hover:border-amber-300 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title (e.g., Key Insights, Questions, Action Items)"
                    className="w-full px-3 py-2 border-0 bg-transparent text-base font-medium placeholder-gray-400 focus:outline-none focus:ring-0"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your thoughts, insights, and connections..."
                    className="w-full min-h-[80px] px-3 py-2 border-0 bg-transparent resize-none placeholder-gray-400 focus:outline-none focus:ring-0"
                  />
                  {(newNoteTitle.trim() || newNoteContent.trim()) && (
                    <div className="flex gap-2 justify-end pt-2 border-t border-amber-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewNoteTitle('');
                          setNewNoteContent('');
                        }}
                        disabled={isSavingNote}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createNewNote}
                        disabled={isSavingNote || !newNoteTitle.trim() || !newNoteContent.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        size="sm"
                      >
                        {isSavingNote ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Note
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            {personalNotes.length > 0 ? (
              <div className="space-y-4">
                {personalNotes.map((note) => (
                  <Card key={note.id} className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium text-gray-900">
                          {editingNoteId === note.id ? (
                            <input
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          ) : (
                            note.title
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {editingNoteId === note.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingNote}
                                disabled={isSavingNote}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateNote(note.id)}
                                disabled={isSavingNote}
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                              >
                                {isSavingNote ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingNote(note)}
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteNote(note.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(note.updatedAt).toLocaleDateString()} at {new Date(note.updatedAt).toLocaleTimeString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {editingNoteId === note.id ? (
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                          {note.content}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No notes yet. Use the input above to add your first note.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Exercises</h4>
              <span className="text-sm text-gray-500">Test your knowledge</span>
            </div>

            {/* Exercise Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Multiple Choice Questions */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <List className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Multiple Choice Questions</h3>
                      <p className="text-sm text-gray-600 mb-4">Test your knowledge with quizzes</p>
                    </div>
                    <Button 
                      className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
                      variant="outline"
                      onClick={() => setShowMCQModal(true)}
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz with Friends */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Quiz with Friends</h3>
                      <p className="text-sm text-gray-600 mb-4">Challenge your friends in a quiz</p>
                    </div>
                    <Button 
                      className="w-full bg-green-50 text-green-600 hover:bg-green-100 border-0"
                      variant="outline"
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Flashcards */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Flashcards</h3>
                      <p className="text-sm text-gray-600 mb-4">Master key concepts</p>
                    </div>
                    <Button 
                      className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 border-0"
                      variant="outline"
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Open Questions */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-orange-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <MessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Open Questions</h3>
                      <p className="text-sm text-gray-600 mb-4">Practice written-response questions</p>
                    </div>
                    <Button 
                      className="w-full bg-orange-50 text-orange-600 hover:bg-orange-100 border-0"
                      variant="outline"
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Exam Mode */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-red-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <GraduationCap className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Exam</h3>
                      <p className="text-sm text-gray-600 mb-4">Prepare with realistic exam conditions</p>
                    </div>
                    <Button 
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-0"
                      variant="outline"
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Study Assistant */}
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Sparkles className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">AI Study Assistant</h3>
                      <p className="text-sm text-gray-600 mb-4">Get personalized study recommendations</p>
                    </div>
                    <Button 
                      className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0"
                      variant="outline"
                    >
                      START SESSION
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No activity data yet. Start an exercise to see your progress!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* New Summary Dialog */}
      {showNewSummaryDialog && (
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
                  onChange={(e) => setNewSummaryTitle(e.target.value)}
                  placeholder="e.g., Key Concepts, Chapter 1 Summary, Quick Review"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewSummaryDialog(false);
                    setNewSummaryTitle('');
                  }}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateSummary(newSummaryTitle)}
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
      )}

      {/* MCQ Session Selector Modal */}
      {showSessionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Choose MCQ Session</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionSelector(false)}
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
                    onClick={generateNewMCQSession}
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
                {existingSessions.map((session: MCQSessionData) => (
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
                        onClick={() => loadMCQSession(session.id)}
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
      )}

      {/* MCQ Configuration Modal */}
      {showMCQModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Start a Multiple Choice Questions Session</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMCQModal(false)}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, studyMode: e.target.value})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, studyMode: e.target.value})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, difficulty: e.target.value})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, numberOfQuestions: parseInt(e.target.value)})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, focus: e.target.value})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, sessionMode: e.target.value})}
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
                      onChange={(e) => setMCQSettings({...mcqSettings, sessionMode: e.target.value})}
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
                  onClick={handleStartMCQSession}
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
      )}

    </div>
  );
};

export default GoldenSummary;
