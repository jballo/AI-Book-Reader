'use server'

export async function convertTextToSpeech(text: string): Promise<{
  audioUrl: string;
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`Converting text (${text.length} chars) to speech...`);
    
    // Call your Express endpoint
    const url_endpoint = new URL(process.env.TEXT_TO_SPEECH_ENDPOINT || "http://127.0.0.1:5001/text-to-speech");
    
    const controller = new AbortController();
    // Set a reasonable timeout
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url_endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.API_KEY || '',
      },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error || response.statusText;
      } catch {
        errorDetail = response.statusText;
      }
      
      throw new Error(`API Error: ${errorDetail}`);
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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}