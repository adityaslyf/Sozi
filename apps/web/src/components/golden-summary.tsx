import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Sparkles, BookOpen, List } from 'lucide-react';
import { toast } from 'sonner';
import AUTH_CONFIG from '@/config/auth';

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
  type: string;
  status: string;
  createdAt: string;
}

const GoldenSummary: React.FC<GoldenSummaryProps> = ({ fileId, fileName, workspaceId }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const generateSummary = async () => {
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
          regenerate: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
        toast.success('Golden summary generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingSummary = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/summary`, {
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

  // Load existing summary on component mount
  React.useEffect(() => {
    loadExistingSummary();
  }, [fileId, workspaceId, loadExistingSummary]);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Golden Summary</h3>
        </div>
        
        {!summary && (
          <Button 
            onClick={generateSummary} 
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
                Generate Golden Notes
              </>
            )}
          </Button>
        )}
      </div>

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
                generateSummary();
              }}
              disabled={isGenerating}
              className="hover:bg-gray-50 transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate Summary
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* No Summary State */}
      {!summary && !isLoading && !isGenerating && (
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
              onClick={generateSummary} 
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
  );
};

export default GoldenSummary;
