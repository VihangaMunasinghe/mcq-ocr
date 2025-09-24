"use client";

import MainLayout from "@/components/Layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/UI/Input";
import { useState } from "react";
import { Button } from "@/components/UI/Button";

type GenerationState = 'idle' | 'processing' | 'success' | 'error';

export default function GenerateTemplate() {
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState<number | "">("");
  const [numOptions, setNumOptions] = useState<number | "">("");
  const [maxQuestionsPerColumn, setMaxQuestionsPerColumn] = useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleGenerate = async () => {
    // Basic validation
    if (!title.trim()) {
      setErrorMessage("Title is required");
      setGenerationState('error');
      return;
    }
    
    if (!numQuestions || numQuestions <= 0) {
      setErrorMessage("Number of questions must be greater than 0");
      setGenerationState('error');
      return;
    }
    
    if (!numOptions || numOptions <= 1) {
      setErrorMessage("Number of options must be greater than 1");
      setGenerationState('error');
      return;
    }

    setGenerationState('processing');
    setErrorMessage("");
    setDownloadUrl("");

    try {
      // Replace this with your actual API call
      console.log("Generating template with:", {
        title,
        numQuestions,
        numOptions,
        maxQuestionsPerColumn
      });
      await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
      const response = {ok: true, json: async () => ({ 
        downloadUrl: 'https://example.com/template.pdf',
        url: 'https://example.com/template.pdf',
        message: 'Template generated successfully',})}; // Mocked response

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate template');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl || data.url);
      setGenerationState('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setGenerationState('error');
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Open the download URL in a new tab/window
      window.open(downloadUrl, '_blank');
    }
  };

  const resetGeneration = () => {
    setGenerationState('idle');
    setErrorMessage("");
    setDownloadUrl("");
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex items-top justify-center w-full flex-col space-y-4">
          <div className="bg-white p-4 rounded-md shadow-sm mb-4">
            <p className="text-sm text-gray-600">
              Create a custom exam template PDF by entering your title, number of
              questions, and options.
            </p>
          </div>

          <Input
            label="Title"
            placeholder="Enter exam title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={generationState === 'processing'}
          />

          <Input
            label="Number of Questions"
            type="number"
            placeholder="e.g. 50"
            value={numQuestions}
            onChange={(e) =>
              setNumQuestions(e.target.value ? parseInt(e.target.value) : "")
            }
            disabled={generationState === 'processing'}
          />

          <Input
            label="Number of Options"
            type="number"
            placeholder="e.g. 4"
            value={numOptions}
            onChange={(e) =>
              setNumOptions(e.target.value ? parseInt(e.target.value) : "")
            }
            disabled={generationState === 'processing'}
          />

          {/* Advanced Options */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div 
              className="flex items-center cursor-pointer select-none"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                  showAdvanced ? 'rotate-90' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Advanced Options</span>
            </div>
            
            {showAdvanced && (
              <div className="mt-4">
                <Input
                  label="Max Questions Per Column"
                  type="number"
                  placeholder="e.g. 30"
                  value={maxQuestionsPerColumn}
                  onChange={(e) =>
                    setMaxQuestionsPerColumn(e.target.value ? parseInt(e.target.value) : 30)
                  }
                  disabled={generationState === 'processing'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of questions to display in each column (default: 30)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              className="w-fit"
              disabled={generationState === 'processing'}
            >
              {generationState === 'processing' ? 'Generating...' : 'Generate Template'}
            </Button>

            {downloadUrl && (
              <>
                <Button onClick={handleDownload} className="w-fit bg-green-600 hover:bg-green-700">
                  Download PDF
                </Button>
                <Button onClick={resetGeneration} variant="outline" className="w-fit">
                  Generate Another
                </Button>
              </>
            )}

            {generationState === 'error' && (
              <Button onClick={resetGeneration} variant="outline" className="w-fit">
                Try Again
              </Button>
            )}
          </div>

          {/* Loading Spinner */}
          {generationState === 'processing' && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Generating your template...</span>
            </div>
          )}

          {/* Error Message */}
          {generationState === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {downloadUrl && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
              <p className="text-green-600 text-sm">Template generated successfully! Click the download button above.</p>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}