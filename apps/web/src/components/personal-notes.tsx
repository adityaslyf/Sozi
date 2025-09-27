import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, StickyNote, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PersonalNotesProps {
  personalNotes: PersonalNote[];
  editingNoteId: string | null;
  editingNoteTitle: string;
  editingNoteContent: string;
  isSavingNote: boolean;
  newNoteTitle: string;
  newNoteContent: string;
  onEditingNoteTitleChange: (title: string) => void;
  onEditingNoteContentChange: (content: string) => void;
  onNewNoteTitleChange: (title: string) => void;
  onNewNoteContentChange: (content: string) => void;
  onCreateNewNote: () => void;
  onUpdateNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onStartEditingNote: (note: PersonalNote) => void;
  onCancelEditingNote: () => void;
}

export function PersonalNotes({
  personalNotes,
  editingNoteId,
  editingNoteTitle,
  editingNoteContent,
  isSavingNote,
  newNoteTitle,
  newNoteContent,
  onEditingNoteTitleChange,
  onEditingNoteContentChange,
  onNewNoteTitleChange,
  onNewNoteContentChange,
  onCreateNewNote,
  onUpdateNote,
  onDeleteNote,
  onStartEditingNote,
  onCancelEditingNote
}: PersonalNotesProps) {
  return (
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
              onChange={(e) => onNewNoteTitleChange(e.target.value)}
              placeholder="Note title (e.g., Key Insights, Questions, Action Items)"
              className="w-full px-3 py-2 border-0 bg-transparent text-base font-medium placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            <textarea
              value={newNoteContent}
              onChange={(e) => onNewNoteContentChange(e.target.value)}
              placeholder="Write your thoughts, insights, and connections..."
              className="w-full min-h-[80px] px-3 py-2 border-0 bg-transparent resize-none placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            {(newNoteTitle.trim() || newNoteContent.trim()) && (
              <div className="flex gap-2 justify-end pt-2 border-t border-amber-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onNewNoteTitleChange('');
                    onNewNoteContentChange('');
                  }}
                  disabled={isSavingNote}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreateNewNote}
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
                        onChange={(e) => onEditingNoteTitleChange(e.target.value)}
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
                          onClick={onCancelEditingNote}
                          disabled={isSavingNote}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onUpdateNote(note.id)}
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
                          onClick={() => onStartEditingNote(note)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteNote(note.id)}
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
                    onChange={(e) => onEditingNoteContentChange(e.target.value)}
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
  );
}
