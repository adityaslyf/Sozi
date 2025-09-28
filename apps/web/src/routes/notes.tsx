import { createFileRoute } from '@tanstack/react-router';

function NotesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notes</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Notes Coming Soon</h2>
          <p className="text-gray-600">Personal notes and annotations will be available here.</p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});
