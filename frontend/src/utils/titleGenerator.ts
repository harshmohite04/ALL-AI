// Simple fallback title generator
const generateSimpleTitle = (message: string): string => {
  try {
    if (!message) return 'New Chat';
    
    // If message is too short, use it as is
    if (message.length <= 30) {
      return message;
    }

    // Try to extract a meaningful title from the message
    const firstSentenceMatch = message.match(/^(.+?)[.!?\n]/);
    if (firstSentenceMatch && firstSentenceMatch[1].length >= 10) {
      return firstSentenceMatch[1].substring(0, 50);
    }

    // If no good sentence break found, take first few meaningful words
    const words = message.trim().split(/\s+/).filter(Boolean);
    return words.length > 0 ? words.slice(0, 8).join(' ') : 'New Chat';
  } catch (error) {
    console.error('Error in simple title generation:', error);
    return 'New Chat';
  }
};

export const generateTitleFromMessage = async (message: string): Promise<string> => {
  return generateSimpleTitle(message);
};

// This function needs to be set from App.tsx to ensure we use the correct base URL
let chatUrlFunction: (path: string) => string = (path) => path;

export const setChatUrlFunction = (fn: (path: string) => string) => {
  chatUrlFunction = fn;
};

export const generateTitleFromMessages = async (messages: { role: string; content: string }[], token?: string): Promise<string> => {
  if (!messages || messages.length === 0) {
    return 'New Chat';
  }

  // If no token is provided, use the simple title generator
  if (!token) {
    const userMessage = messages.find(m => m.role === 'user');
    return generateSimpleTitle(userMessage?.content || messages[0]?.content || '');
  }

  try {
    const response = await fetch(chatUrlFunction('/generate-title'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: 'gpt-3.5-turbo' // Default model, can be customized
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Title generation failed:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    return data.title || generateSimpleTitle(messages[0]?.content || '');
  } catch (error) {
    console.error('Error generating LLM title, falling back to simple title:', error);
    const userMessage = messages.find(m => m.role === 'user');
    return generateSimpleTitle(userMessage?.content || messages[0]?.content || '');
  }
};
