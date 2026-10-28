export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface AssistantResponse {
  reply: string;
  error?: string;
  disclaimer?: string;
}

export async function askAiAssistant(
  message: string,
  history: ChatMessage[] = [],
  courseContext?: string
): Promise<AssistantResponse> {
  try {
    const response = await fetch('/api/gemini/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map((h) => ({ role: h.role, text: h.text })),
        courseContext,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      reply: data.reply || 'No answer received from assistant.',
      disclaimer: data.disclaimer,
    };
  } catch (error: any) {
    console.error('Error contacting AI Assistant:', error);
    return {
      reply:
        'I am unable to answer right now due to a network connection issue. Please check your connection and try again.',
      error: error.message || 'Network error',
    };
  }
}
