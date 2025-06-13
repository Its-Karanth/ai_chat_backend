import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatbotService } from "./services/chatbot";
import { connectDB } from "./config/database";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Initialize chatbot service
const chatbotService = new ChatbotService();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Received message:", message);
    const response = await chatbotService.chat(message);
    console.log("Generated response:", response);
    
    res.json({ response });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ 
      error: "I'm having trouble processing your message right now. Please try again in a moment." 
    });
  }
});

// Get chat history endpoint
app.get("/api/history", async (req, res) => {
  try {
    const history = await chatbotService.getChatHistory();
    res.json({ history });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Clear chat history endpoint
app.post("/api/clear", async (req, res) => {
  try {
    await chatbotService.clearHistory();
    res.json({ message: "Chat history cleared" });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Something went wrong. Please try again later." 
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}); 