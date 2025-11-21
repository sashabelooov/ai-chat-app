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
 * Connects to the backend via POST.
 * Endpoint: /generate
 */
export const streamChatResponse = async (
  { prompt, history, model, useSearch, useDeepThink, images }: GenerateOptions,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // 1. Prepare the Context
    const conversationHistory = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
      .join('\n');
    
    const fullPrompt = `${conversationHistory}\nUser: ${prompt}\nModel:`;

    // 2. Configuration
    // Use relative path so it works when served by the Python backend
    const endpoint = '/generate'; 

    // 3. Make the POST Request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        model: model,
        search: useSearch,
        thinking: useDeepThink,
        images: images
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