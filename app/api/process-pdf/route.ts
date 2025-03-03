import { NextRequest, NextResponse } from 'next/server';

// The API key should be stored as a server-side environment variable
const API_KEY = process.env.LANDING_AI_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_VISION_API_URL || 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';

export async function POST(request: NextRequest) {
  try {
    console.log('API route called with URL:', API_URL);
    
    // Check for API key
    if (!API_KEY) {
      console.error('Missing API key');
      return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
    }
    
    // Get form data from the incoming request
    const formData = await request.formData();
    const fileData = formData.get('image') as File | null;
    const prompts = formData.get('prompts') as string || 'Please analyze this document';
    
    if (!fileData) {
      console.error('No file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`Processing file: ${fileData.name}, type: ${fileData.type}, size: ${fileData.size} bytes`);
    
    // Create a new FormData object for the API call
    const apiFormData = new FormData();
    
    // For PDF files, use 'pdf' field name instead of 'image'
    const isPdf = fileData.type === 'application/pdf';
    const fieldName = isPdf ? 'pdf' : 'image';
    
    console.log(`Using field name '${fieldName}' for file type: ${fileData.type}`);
    
    // Append the file with the correct field name based on type
    apiFormData.append(fieldName, fileData);
    
    // Append other parameters
    apiFormData.append('prompts', prompts);
    apiFormData.append('model', 'agentic');
    
    // Make the API call with proper Basic auth
    console.log('Calling external API...');
    
    // Ensure the API key is properly formatted for Basic auth
    const authHeader = `Basic ${API_KEY}`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: apiFormData
    });
    
    console.log('API response status:', response.status);
    
    // Handle the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      return NextResponse.json({ error: `API error: ${response.status}`, details: errorText }, { status: response.status });
    }
    
    // Process and return the successful response
    const data = await response.json();
    console.log('API request successful');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in API route:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}