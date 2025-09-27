import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Brain, Users, Zap, MessageSquare, GraduationCap, ArrowRight, Sparkles, List, MessageCircle } from 'lucide-react';
import { ChatInterface } from './chat-interface';

interface ExercisesProps {
  workspaceId: string;
  fileId?: string;
  fileName?: string;
  onStartMCQ: () => void;
}

export function Exercises({ workspaceId, fileId, fileName, onStartMCQ }: ExercisesProps) {
  return (
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
                onClick={onStartMCQ}
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

      {/* AI Chat Assistant */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            AI Study Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChatInterface 
            workspaceId={workspaceId}
            fileId={fileId}
            fileName={fileName}
          />
        </CardContent>
      </Card>

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
  );
}
