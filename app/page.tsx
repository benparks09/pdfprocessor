'use client';

import { useState, useCallback } from 'react';
import { callVisionApi } from './utils/api';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    processSelectedFile(selectedFile);
  };

  const processSelectedFile = (selectedFile: File | undefined) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setResult('');
      setError('');
    } else {
      setFile(null);
      setFileName('');
      setError('Please select a valid PDF file');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    processSelectedFile(droppedFile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;
    
    try {
      setIsProcessing(true);
      setError('');
      
      // Read the file as ArrayBuffer
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const fileContent = event.target?.result;
          
          if (!fileContent) {
            throw new Error('Failed to read file content');
          }
          
          // Convert string to Blob if needed to match the expected parameter type
          const content = typeof fileContent === 'string' 
            ? new Blob([fileContent], { type: 'application/pdf' }) 
            : new Blob([new Uint8Array(fileContent as ArrayBuffer)], { type: 'application/pdf' });
            
          const response = await callVisionApi(content);
          setResult(response.choices?.[0]?.message?.content || JSON.stringify(response, null, 2));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsProcessing(false);
        }
      };
      
      fileReader.onerror = () => {
        setError('Error reading the file');
        setIsProcessing(false);
      };
      
      fileReader.readAsArrayBuffer(file);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-6">Financial Statement Processor</h1>
      
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div 
            className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <div className="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF files only</p>
              
              {fileName && (
                <div className="mt-4 p-2 bg-blue-50 rounded-md border border-blue-200 w-full">
                  <p className="text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-blue-600 truncate">{fileName}</span>
                  </p>
                </div>
              )}
            </div>
            
            <input 
              id="fileInput"
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={!file || isProcessing}
            className={`w-full p-3 rounded-lg font-medium transition-colors
              ${isProcessing 
                ? 'bg-gray-400 text-white cursor-wait' 
                : file 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isProcessing 
              ? 'Processing...' 
              : file 
                ? 'Process PDF' 
                : 'Select a PDF to continue'}
          </button>
        </form>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-2">Results:</h2>
            <div className="text-sm whitespace-pre-wrap">{result}</div>
          </div>
        )}
      </div>
    </main>
  );
}