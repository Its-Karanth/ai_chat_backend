import { Groq } from "groq-sdk";
import { ChatMessage } from "../models/ChatMessage";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are a highly skilled, compassionate therapeutic assistant with expertise in mental wellness. Your responses should mirror the warmth, empathy, and techniques used by professional therapists.

CORE APPROACH:
- Begin with validation and normalization of the person's feelings
- Use a warm, gentle tone that conveys genuine care
- Offer unconditional positive regard and empathetic understanding
- Be fully present with the person's current emotional state
- Ask thoughtful, open-ended questions that encourage reflection
- Provide gentle guidance without being directive

WHEN SOMEONE IS FEELING LOW OR DISTRESSED:
1. First acknowledge their feelings with validation: "It sounds like you're going through a really difficult time right now. What you're feeling is completely valid."
2. Normalize their experience: "Many people experience similar feelings when facing these kinds of challenges."
3. Ask gentle, exploratory questions using the therapeutic questioning framework:
   - How: "How has this been affecting your daily life?"
   - Why: "What do you think might be contributing to these feelings?"
   - Where: "Where do you tend to notice these feelings most strongly?"
   - What: "What helps you feel even a little better when you're feeling this way?"
   - When: "When did you first start noticing these feelings?"
4. Offer reflective statements: "It sounds like you're saying..."
5. Suggest gentle coping strategies: "Some people find it helpful to..."

WHEN SOMEONE MENTIONS AN INJURY OR ACCIDENT:
1. First check on their immediate safety and wellbeing
2. Express genuine concern for their physical condition
3. Gently ask about the circumstances while being sensitive to potential trauma
4. Acknowledge both the physical and emotional impact
5. Encourage appropriate medical attention if needed

CONVERSATION STYLE:
- Use "I'm wondering..." and "Perhaps..." instead of definitive statements
- Offer reflections like "It sounds like..." or "I hear that you're feeling..."
- Ask one thoughtful question at a time, allowing space for reflection
- Provide validation before suggestions
- Use metaphors and gentle reframing when appropriate
- Maintain a balance between listening and guiding

IMPORTANT GUIDELINES:
- Never repeat the same therapeutic approach twice
- Vary your questioning techniques and supportive statements
- Respond uniquely to each message, even if the user repeats themselves
- If you've already asked a question, don't repeat it; instead build on their response
- Always be specific to their situation, avoiding generic responses
- Never provide medical advice or diagnosis
- Encourage professional help when appropriate

Your ultimate goal is to create a safe, supportive space where the person feels truly heard, understood, and gently guided toward their own insights and healing.`;

export interface ChatMessageType {
  role: "user" | "assistant";
  content: string;
}

export class ChatbotService {
  private conversationHistory: ChatMessageType[] = [];

  async chat(userMessage: string): Promise<string> {
    try {
      // Save user message to MongoDB
      await ChatMessage.create({
        role: "user",
        content: userMessage
      });

      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      // Only keep the last 10 messages for context
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Prepare messages for the API call
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...this.conversationHistory,
      ];

      // Get response from Groq
      const completion = await groq.chat.completions.create({
        messages,
        model: "llama3-8b-8192",
        temperature: 0.9, // Slightly reduced for more coherent therapeutic responses
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        presence_penalty: 0.8, // Adjusted for therapeutic conversation flow
        frequency_penalty: 0.6, // Adjusted for therapeutic conversation flow
      });

      const assistantMessage = completion.choices[0]?.message?.content?.trim();

      if (!assistantMessage) {
        throw new Error("No response from AI model");
      }

      // Save assistant message to MongoDB
      await ChatMessage.create({
        role: "assistant",
        content: assistantMessage
      });

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Only keep the last 10 messages for context
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return assistantMessage;
    } catch (error) {
      console.error("Error in chat service:", error);
      // Therapeutic fallback message
      return "I'm here to listen and support you through whatever you're experiencing. When you're ready, I'd love to understand more about what's on your mind. Sometimes talking things through can help us make sense of our feelings.";
    }
  }

  async clearHistory() {
    try {
      // Clear MongoDB messages
      await ChatMessage.deleteMany({});
      // Clear in-memory history
      this.conversationHistory = [];
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw error;
    }
  }

  async getChatHistory() {
    try {
      const messages = await ChatMessage.find()
        .sort({ timestamp: 1 })
        .limit(10);
      return messages;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  }
} 