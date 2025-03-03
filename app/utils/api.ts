/**
 * API configuration and utility functions for the vision agent
 */

// Vision API configuration
export const visionApiConfig = {
    apiUrl: process.env.NEXT_PUBLIC_VISION_API_URL || 'https://api.va.landing.ai/v1/tools/agentic-document-analysis'
};
  
/**
 * Calls the vision API through our server-side API route
 * @param fileContent - The file content as a File or Blob
 * @param prompt - Optional prompt to guide the AI analysis
 * @returns The JSON response from the API
 */
export const callVisionApi = async (fileContent: File | Blob, prompt: string = 'Please analyze this document and extract key information.') => {
  try {
    console.log('Preparing API request with file type:', fileContent.type);
    
    // Create FormData for the request
    const formData = new FormData();
    formData.append('image', fileContent);  // The server-side API route will handle the field name conversion
    formData.append('prompts', prompt);
    formData.append('model', 'agentic');
    
    // Make the request to our server-side API route
    console.log('Sending request to server-side API route');
    const response = await fetch('/api/process-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
};

// For handling PDFs
export const processPdfWithVisionApi = async (pdfContent: File | Blob) => {
  // For PDFs, you would first convert to image if needed
  return await callVisionApi(pdfContent);
};