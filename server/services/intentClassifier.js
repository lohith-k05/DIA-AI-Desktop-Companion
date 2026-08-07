export const INTENT_CATEGORIES = {
  GREETING_CASUAL: "greeting_casual",
  CONCEPT_EXPLANATION: "concept_explanation",
  TECHNICAL_QUESTION: "technical_question",
  CODING: "coding",
  DEBUGGING: "debugging",
  COMPARISON: "comparison",
  PLANNING: "planning",
  SUMMARIZATION: "summarization",
  BRAINSTORMING: "brainstorming",
  PERSONAL_PRODUCTIVITY: "personal_productivity",
  CAREER_GUIDANCE: "career_guidance",
  CREATIVE_WRITING: "creative_writing",
  DOCUMENT_QUESTION: "document_question",
  MEMORY_REQUEST: "memory_request",
  CLARIFICATION_NEEDED: "clarification_needed",
  GENERAL_QUESTION: "general_question",
  BROWSER_TASK: "browser_task",
};

export function classifyIntent(query = "", hasContext = false) {
  const text = query.trim().toLowerCase();
  
  // 0. Greetings and Casual Small Talk
  const casualPhrases = ['hi', 'hello', 'hey', 'heyy', 'whats up', "what's up", 'how are you', 'how are you doing', 'good morning', 'good evening', 'good night', 'thanks', 'thank you', 'bye', 'goodbye', 'nothing', "i'm tired", 'im tired', 'im bored', "i'm bored", 'who are you', 'tell me about you', 'tell me about yourself'];
  
  if (casualPhrases.includes(text) || text.length <= 4) {
    // If it's a known casual phrase or just a very short word (like "ok", "hi")
    // Note: We don't want to accidentally trap "why?" if they are asking a follow-up, but "why" is 3 chars.
    if (text === 'why' || text === 'why?' || text === 'how' || text === 'how?') {
       return {
        category: INTENT_CATEGORIES.CLARIFICATION_NEEDED,
        confidence: 0.9,
        directive: "The user is asking a short follow-up question ('why' or 'how'). Answer naturally and concisely based on the immediate context."
       };
    }
    
    return {
      category: INTENT_CATEGORIES.GREETING_CASUAL,
      confidence: 0.95,
      directive: "The user is making casual conversation, greeting, or sending a very short message. Respond as a friendly human companion in 1 to 2 short sentences. Do NOT give long explanations, do NOT use markdown formatting, and do NOT be formal."
    };
  }

  // 1. Ambiguity Detection
  if (
    text === "explain this better" ||
    text === "explain this better." ||
    text === "explain it better" ||
    text === "explain better" ||
    text === "elaborate" ||
    text === "tell me more" ||
    text === "can you clarify"
  ) {
    if (!hasContext) {
      return {
        category: INTENT_CATEGORIES.CLARIFICATION_NEEDED,
        confidence: 0.95,
        directive:
          "The user's query is brief or ambiguous and no prior context exists. Politely and casually ask what they would like explained.",
      };
    }
    return {
      category: INTENT_CATEGORIES.CONCEPT_EXPLANATION,
      confidence: 0.85,
      directive:
        "The user wants a deeper explanation of the previous subject. Provide a clearer, intuitive breakdown with a simple real-world analogy. Keep it conversational.",
    };
  }

  // 2. Comparison detection
  if (
    text.includes("difference between") ||
    text.includes("compare ") ||
    text.includes(" vs ") ||
    text.includes(" versus ") ||
    text.includes("pros and cons") ||
    text.includes("similarities and differences")
  ) {
    return {
      category: INTENT_CATEGORIES.COMPARISON,
      confidence: 0.92,
      directive:
        "The user is requesting a comparison. Provide an overview, followed by a clean Markdown comparison table, then explain specific trade-offs and recommended use-cases. Only do this if they asked for a detailed comparison.",
    };
  }

  // 3. Debugging / Error detection
  if (
    text.includes("error") ||
    text.includes("exception") ||
    text.includes("traceback") ||
    text.includes("fix this code") ||
    text.includes("why is this failing") ||
    text.includes("undefined is not") ||
    text.includes("cannot read properties") ||
    text.includes("nullpointer") ||
    text.includes("segfault") ||
    text.includes("bug in")
  ) {
    return {
      category: INTENT_CATEGORIES.DEBUGGING,
      confidence: 0.94,
      directive:
        "The user is troubleshooting a bug or error. Identify the root cause, provide corrected clean code, and briefly explain why it occurred.",
    };
  }

  // 4. Coding implementation
  if (
    text.includes("write a program") ||
    text.includes("write code") ||
    text.includes("implement a function") ||
    text.includes("create a script") ||
    text.includes("python code") ||
    text.includes("typescript code") ||
    text.includes("javascript code") ||
    text.includes("c++ code") ||
    text.includes("react component") ||
    text.includes("sql query") ||
    text.startsWith("how to code") ||
    text.startsWith("code for")
  ) {
    return {
      category: INTENT_CATEGORIES.CODING,
      confidence: 0.9,
      directive:
        "The user requests code. Provide a clean, well-commented code implementation in fenced code blocks and briefly explain the logic.",
    };
  }

  // 5. Concept explanation & Academic queries
  if (
    text.startsWith("explain ") ||
    text.startsWith("what is ") ||
    text.startsWith("what are ") ||
    text.startsWith("define ") ||
    text.includes("how does ") ||
    text.includes("theory of")
  ) {
    
    if (text.includes("in detail") || text.includes("exam") || text.includes("presentation")) {
       return {
         category: INTENT_CATEGORIES.CONCEPT_EXPLANATION,
         confidence: 0.88,
         directive:
           "The user is asking for a detailed formal explanation. Structure your response clearly with definition, mechanisms, and examples.",
       };
    }
    
    return {
      category: INTENT_CATEGORIES.CONCEPT_EXPLANATION,
      confidence: 0.88,
      directive:
        "The user is asking for a concept explanation. Provide a concise, clear, and natural explanation. Do not write a long essay unless requested.",
    };
  }

  // 6. Planning & Architecture / Workflow
  if (
    text.includes("suggest an ai-based workflow") ||
    text.includes("workflow for") ||
    text.includes("roadmap") ||
    text.includes("architecture for") ||
    text.includes("how should i design") ||
    text.includes("plan for") ||
    text.includes("step by step guide")
  ) {
    return {
      category: INTENT_CATEGORIES.PLANNING,
      confidence: 0.89,
      directive:
        "The user requests a system plan or workflow. Structure your response into logical phases or steps.",
    };
  }

  // 7. Summarization
  if (
    text.startsWith("summarize") ||
    text.includes("summary of") ||
    text.includes("tldr") ||
    text.includes("key takeaways")
  ) {
    return {
      category: INTENT_CATEGORIES.SUMMARIZATION,
      confidence: 0.92,
      directive:
        "The user requests a summary. Provide a concise executive summary followed by organized bullet points.",
    };
  }

  // 8. Brainstorming
  if (
    text.startsWith("brainstorm") ||
    text.includes("ideas for") ||
    text.includes("suggest some ideas") ||
    text.includes("creative ways to")
  ) {
    return {
      category: INTENT_CATEGORIES.BRAINSTORMING,
      confidence: 0.87,
      directive:
        "The user is brainstorming. Provide distinct, creative yet practical options.",
    };
  }

  // 9. Default General Question
  if (text.includes("youtube") || text.includes("google") || (text.includes("open") && text.includes("website")) || text.includes("search") || text.includes("go to ") || text.includes("read the page")) {
    return {
      category: INTENT_CATEGORIES.BROWSER_TASK,
      confidence: 0.85,
      directive: "The user wants to perform a browser automation task. You MUST respond ONLY with a JSON block. Format: `{\"tool\": \"browser_task\", \"arguments\": {\"prompt\": \"<the full user instruction>\"}}`. Do NOT add any other conversational text."
    };
  }
  
  return {
    category: INTENT_CATEGORIES.GENERAL_QUESTION,
    confidence: 0.7,
    directive:
      "Answer directly and naturally. Keep it concise (1-3 sentences) unless the user's question clearly requires a longer explanation. Be a friendly companion, not a formal lecturer.",
  };
}