import { Message } from '../types';

interface GenerateOptions {
  model: string;
  prompt: string;
  history: Message[];
  useSearch: boolean;
  useDeepThink: boolean;
  images?: string[]; // base64 strings
}

/**
 * Connects to the local FastAPI backend via POST.
 * Endpoint: POST http://127.0.0.1:8000/generate
 * Body: { "prompt": "...", "tokens": 500 }
 */
export const streamChatResponse = async (
  { prompt, history }: GenerateOptions,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // 1. Prepare the Context
    // Bigram models (and most raw LLMs) expect a single string. 
    // We concatenate the history to give the model "memory".
    const conversationHistory = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
      .join('\n');
    
    const fullPrompt = `${conversationHistory}\nUser: ${prompt}\nModel:`;

    // 2. Configuration
    // We use localhost to avoid some IP binding issues on certain machines
    const endpoint = 'http://127.0.0.1:8000/generate'; 

    // 3. Make the POST Request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        tokens: 500
      })
    });

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorText = await response.text();
        if (errorText) errorDetails = errorText;
      } catch (e) { /* ignore */ }
      throw new Error(`Server Error (${response.status}): ${errorDetails}`);
    }

    if (!response.body) {
      throw new Error("No response body received from server.");
    }

    // 4. Handle the Stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullText += chunk;
        onChunk(chunk);
      }
    }

    return fullText;

  } catch (error) {
    console.error("API Connection Error:", error);
    throw error; // Re-throw to be handled by the UI
  }
};