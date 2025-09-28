import { createFileRoute } from '@tanstack/react-router';

function ExercisesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Exercises</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏋️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exercises Coming Soon</h2>
          <p className="text-gray-600">Practice exercises and quizzes will be available here.</p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/exercises')({
  component: ExercisesPage,
});