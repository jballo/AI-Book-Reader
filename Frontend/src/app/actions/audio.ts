'use server'
import { auth } from '@clerk/nextjs/server';

function apiUrl(path: string) {
  const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, '');
  if (baseUrl) return new URL(`${baseUrl}${path}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('API_BASE_URL is not set. Set it to the URL of the Express server.');
  }
  return new URL(`http://127.0.0.1:5001${path}`);
}

const FALLBACK_ERROR = 'Try again.';
const STATUSES_WITH_READABLE_ERROR = [400, 429, 503];

async function failedRequestError(response: Response) {
  if (!STATUSES_WITH_READABLE_ERROR.includes(response.status)) return FALLBACK_ERROR;
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : FALLBACK_ERROR;
}

export async function convertTextToSpeech(text: string): Promise<{
  audioUrl: string;
  success: boolean;
  error?: string;
}> {
  const { userId, getToken } = await auth();
  const sessionToken = userId ? await getToken() : null;
  if (!sessionToken) {
    return { audioUrl: '', success: false, error: 'Unauthorized' };
  }

  try {
    console.log(`Converting text (${text.length} chars) to speech...`);
    
    // Call your Express endpoint
    const url_endpoint = apiUrl('/text-to-speech');
    
    const controller = new AbortController();
    // Set a reasonable timeout
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url_endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        audioUrl: '',
        success: false,
        error: await failedRequestError(response),
      };
    }

    // Get the audio data and convert to base64 for efficient transfer
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Received audio data: ${arrayBuffer.byteLength} bytes`);
    
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      success: true
    };
  } catch (error) {
    console.error('Error in convertTextToSpeech:', error);
    return {
      audioUrl: '',
      success: false,
      error: FALLBACK_ERROR
    };
  }
}