import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';

interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  context: string;
}

interface MCQSessionProps {
  sessionId: string;
  workspaceId: string;
  fileId: string;
  questions: MCQQuestion[];
  sessionSettings: {
    difficulty: string;
    numberOfQuestions: number;
    focus: string;
    studyMode: string;
    sessionMode: string;
  };
  fileName: string;
  onBack: () => void;
  onComplete: (results: SessionResults) => void;
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

export function MCQSession({ sessionId, workspaceId, fileId, questions, sessionSettings, fileName, onBack, onComplete }: MCQSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const selectedAnswer = selectedAnswers[currentQuestion?.id];

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionId: string) => {
    if (isSessionComplete) return;

    const timeSpent = Date.now() - questionStartTime;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));

    setQuestionTimes(prev => ({
      ...prev,
      [currentQuestion.id]: timeSpent
    }));

    // Don't auto-advance - let user click Next button
    toast.success('Answer selected! Click Next to continue.');
  };

  const handlePreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    // Check if current question is answered
    if (!selectedAnswer) {
      toast.error('Please select an answer before proceeding');
      return;
    }

    if (!isLastQuestion) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // This is the last question - complete the session
      handleCompleteSession();
    }
  };

  const handleCompleteSession = async () => {
    if (answeredCount < questions.length) {
      toast.error('Please answer all questions before completing the session');
      return;
    }

    const totalTimeSpent = Date.now() - sessionStartTime;
    let correctCount = 0;

    const answers = questions.map(question => {
      const selectedOptionId = selectedAnswers[question.id];
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      const isCorrect = selectedOption?.isCorrect || false;
      
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        selectedOptionId: selectedOptionId || null,
        isCorrect,
        timeSpent: questionTimes[question.id] || 0
      };
    });

    const results: SessionResults = {
      score: correctCount,
      totalQuestions: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
      timeSpent: totalTimeSpent,
      answers
    };

    // Save attempt to database
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/files/${fileId}/mcq/sessions/${sessionId}/attempt`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers: answers,
            timeSpent: totalTimeSpent
          })
        });

        if (response.ok) {
          toast.success('Session results saved successfully!');
        } else {
          toast.error('Failed to save session results');
        }
      }
    } catch (error) {
      console.error('Error saving session results:', error);
      toast.error('Failed to save session results');
    }

    setIsSessionComplete(true);
    setShowResults(true);
    onComplete(results);
  };

  const handleRetakeSession = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuestionTimes({});
    setIsSessionComplete(false);
    setShowResults(false);
    setQuestionStartTime(Date.now());
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (showResults) {
    const results = {
      score: Object.values(selectedAnswers).filter((answerId, index) => {
        const question = questions[index];
        const selectedOption = question?.options.find(opt => opt.id === answerId);
        return selectedOption?.isCorrect;
      }).length,
      totalQuestions: questions.length,
      percentage: Math.round((Object.values(selectedAnswers).filter((answerId, index) => {
        const question = questions[index];
        const selectedOption = question?.options.find(opt => opt.id === answerId);
        return selectedOption?.isCorrect;
      }).length / questions.length) * 100),
      timeSpent: Date.now() - sessionStartTime
    };

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h1>
          <p className="text-gray-600">Here's how you performed on {fileName}</p>
        </div>

        {/* Score Card */}
        <Card className="p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {results.score}/{results.totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-gray-700 mb-4">
              {results.percentage}% Correct
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time: {formatTime(results.timeSpent)}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Correct: {results.score}
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Incorrect: {results.totalQuestions - results.score}
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Breakdown */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Question Review</h3>
          <div className="space-y-3">
            {questions.map((question, index) => {
              const selectedOptionId = selectedAnswers[question.id];
              const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
              const correctOption = question.options.find(opt => opt.isCorrect);
              const isCorrect = selectedOption?.isCorrect || false;

              return (
                <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Question {index + 1}</p>
                      <p className="text-xs text-gray-600">{question.topic}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Your answer: {selectedOption?.text.substring(0, 20)}...
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-green-600">
                        Correct: {correctOption?.text.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </Button>
          <Button onClick={handleRetakeSession} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Retake Session
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-600">No questions available</p>
        <Button onClick={onBack} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-semibold">{fileName}</h1>
          <p className="text-sm text-gray-600">
            {sessionSettings.difficulty} • {sessionSettings.sessionMode}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <p className="text-xs text-gray-600">
            {answeredCount} answered
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{answeredCount}/{questions.length} completed</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-sm text-gray-600">{currentQuestion.topic}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.isCorrect;
            const showCorrectAnswer = isSessionComplete && isSelected;
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isSessionComplete}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? showCorrectAnswer
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isSessionComplete ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isSelected
                      ? showCorrectAnswer
                        ? isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-red-500 bg-red-500 text-white'
                        : 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {option.id}
                  </div>
                  <span className="text-gray-900">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={isFirstQuestion}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {selectedAnswer ? 'Answer selected' : 'Select an answer to continue'}
          </p>
        </div>

        <Button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLastQuestion ? 'Complete Session' : 'Next Question'}
          {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
