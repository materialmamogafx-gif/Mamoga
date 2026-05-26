import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client tool
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is required to power Skaymo.");
  }
  aiInstance = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  return aiInstance;
}

// AI Chatbot route focusing on Forex mentoring advice & system configurations
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array." });
    }

    // Initialize client safely
    const ai = getGeminiClient();

    // Map incoming message list into Gemini content standard format
    // Let's frame the chat context and system instruction
    const systemPrompt = `You are "Skaymo", an elite, sleek Forex training and market analysis AI assistant for Mamoga Traders.
Your tone is professional, sophisticated, and highly structured (use clear, concise bullet points where appropriate).
The Brand is "Mamoga Traders", founded with a commitment to teach high-probability, risk-managed, rule-based algorithmic and psychological trading strategies (focusing on discipline over gambling).

KEY SERVICES & VALUES to mention if asked:
1. Beginner Mentorship: R1500 Once Off. Includes Forex basics, risk management structure, trading psychology, market order layouts, and lifetime live guidance.
2. Strategy Package: R700. Includes refined strategy breakdown, entry confirmation schemas, risk management sheet, and trading model.
- YouTube Channel: https://www.youtube.com/@MamogaTraders
- Join the Free WhatsApp Group here: https://chat.whatsapp.com/BcU6iDHB2eD2ZiSTBkZfPS?mode=gi_t
- Contact WhatsApp directly: +27614871133 (https://wa.me/27614871133) or Email: materialmamogafx@gmail.com

IMPORTANT CRITICAL INSTRUCTION:
You ONLY answer Forex, financial market, trading discipline, portfolio risk, and Mamoga Traders services questions.
If the question is unrelated to trading, forex, markets, or Mamoga Traders (e.g. asking a coding, general trivia, recipe, or general history question), you must reply with a friendly but firm response like:
"I am Skaymo, the specialized AI trading advisor for Mamoga Traders. I only answer forex and trading-related topics to keep our focus locked on market mastery. Feel free to ask me about risk management, market structure, or our premium mentorship packages!"`;

    // Format conversational items
    const formattedContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Generate output with gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I was unable to retrieve a response from the trading model. Please try again.";
    return res.json({ reply: replyText });

  } catch (error: any) {
    console.error("Gemini route error:", error);
    return res.status(500).json({
      error: error.message || "An exception occurred while processing Skaymo's calculations."
    });
  }
});

async function startServer() {
  // Vite dev server mounting or static dist assets serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mamoga Traders App] Server running at http://localhost:${PORT}`);
  });
}

startServer();
