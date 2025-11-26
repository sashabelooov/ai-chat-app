import { Message } from '../types';

// =================================================================================
// 🔧 CONFIGURATION
// Change this URL whenever you restart ngrok
// =================================================================================
const API_BASE_URL = 'https://7983a3acb2e2.ngrok-free.app'; 
const API_ENDPOINT = `${API_BASE_URL}/generate`;

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
 */
export const streamChatResponse = async (
  { prompt, history, model, useSearch, useDeepThink, images }: GenerateOptions,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // 1. Prepare the Context
    // We format the history so the model understands the conversation context.
    const conversationHistory = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
      .join('\n');
    
    // Combine history with the new prompt
    const fullInput = conversationHistory 
      ? `${conversationHistory}\nUser: ${prompt}`
      : `User: ${prompt}`;

    // 2. Make the POST Request
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // This header is required to bypass the ngrok "Visit Site" warning page
        'ngrok-skip-browser-warning': 'true',
      },
      // The backend expects: class Query(BaseModel): text: str
      body: JSON.stringify({
        text: fullInput
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

    // 3. Handle Response
    // The backend returns: { "response": "..." }
    const data = await response.json();
    const aiText = data.response;

    if (!aiText) {
      throw new Error("Empty response received from server.");
    }

    // 4. Simulate Streaming (Typewriter Effect)
    // Since the backend returns the full text at once, we break it into chunks
    // and feed it to the UI with a delay to mimic the generation process.
    
    const chunkSize = 3; // Number of characters per chunk
    const delayMs = 15;  // Delay between chunks in milliseconds

    for (let i = 0; i < aiText.length; i += chunkSize) {
      const chunk = aiText.slice(i, i + chunkSize);
      onChunk(chunk);
      // Wait for a tiny bit to simulate typing
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return aiText;

  } catch (error) {
    console.error("API Connection Error:", error);
    throw error; // Re-throw to be handled by the UI
  }
};