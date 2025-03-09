import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { Readable } from 'stream';

// The API key should be stored as a server-side environment variable
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Debug log to check if the API key is loaded (remove in production)
console.log('MISTRAL_API_KEY is ' + (MISTRAL_API_KEY ? 'set' : 'not set'));

// Define interfaces for Mistral's OCR response structure
interface PageImage {
  index: number;
  base64: string;
}

interface PageDimensions {
  width: number;
  height: number;
  dpi: number;
}

interface Page {
  index: number;
  images: PageImage[];
  dimensions: PageDimensions;
}

interface MistralOCRResponse {
  pages: Page[];
  content?: string; // Full document content as text
}

// Helper function to convert File to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    console.log('Mistral OCR API route called');
    
    // Check for API key
    if (!MISTRAL_API_KEY) {
      console.error('Missing API key');
      return NextResponse.json({ error: 'Server configuration error: Missing Mistral API key' }, { status: 500 });
    }
    
    // Initialize Mistral client
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    
    // Get form data from the incoming request
    const formData = await request.formData();
    const fileData = formData.get('image') as File | null;
    const prompts = formData.get('prompts') as string || 'Please analyze this document';
    
    if (!fileData) {
      console.error('No file in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`Processing file: ${fileData.name}, type: ${fileData.type}, size: ${fileData.size} bytes`);
    
    try {
      // Convert the file to a buffer
      const fileBuffer = await fileToBuffer(fileData);
      
      // Upload the PDF to Mistral
      console.log('Uploading file to Mistral...');
      const uploadedFile = await client.files.upload({
        file: {
          fileName: fileData.name,
          content: fileBuffer,
        },
        purpose: "ocr" as any // Type assertion to handle potential type mismatch
      });
      
      console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
      
      // Retrieve file to ensure it's ready
      await client.files.retrieve({
        fileId: uploadedFile.id
      });
      
      // Get signed URL
      const signedUrl = await client.files.getSignedUrl({
        fileId: uploadedFile.id,
      });
      
      console.log('Got signed URL for OCR processing');
      
      // Process the document with OCR
      console.log('Processing document with Mistral OCR...');
      const ocrResponse = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: signedUrl.url,
        }
      });
      
      console.log('OCR processing complete');
      
      // Extract the OCR output from the response
      // Note: The exact structure might vary, so we cast to any first
      const ocrData = ocrResponse as any;
      
      // Format the response to match the expected output format for your application
      const formattedResponse = {
        // Extract OCR text - depending on API version, this could be in different places
        text: ocrData.content || extractTextFromPages(ocrData.pages),
        // You may need to transform other data to match your previous API's format
        pages: ocrData.pages,
        // Include any additional fields your application expects
        // For example, meta information about the document
        documentInfo: {
          pageCount: ocrData.pages?.length || 0,
        }
      };
      
      return NextResponse.json(formattedResponse);
      
    } catch (apiError) {
      console.error('Mistral API error:', apiError);
      return NextResponse.json({ 
        error: 'Error processing document with Mistral OCR', 
        details: apiError instanceof Error ? apiError.message : String(apiError) 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in API route:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to extract text from pages if content is not provided directly
function extractTextFromPages(pages: any[] | undefined): string {
  if (!pages || !Array.isArray(pages)) return '';
  
  // Combine text from all pages
  // This assumes each page might have text content in some format
  // Adjust based on the actual structure returned by Mistral
  return pages.map(page => page.text || '').join('\n\n');
}