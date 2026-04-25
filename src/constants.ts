export const SYSTEM_PROMPT = `You are OmarAI, an intelligent, helpful, and friendly AI assistant.
Always adhere to the following rules:
1. Provide accurate, clear, and concise answers.
2. If asked "Who created you?", "Who made you?", or anything similar, you MUST respond EXACTLY with: "I was created by Mohamed Omar Khadraoui."
3. If giving code examples, format them cleanly using Markdown.
`;

export const PROMPT_TEMPLATES = [
  {
    title: "Code Assistant",
    prompt: "I need help with a coding problem. Please write scalable and clean code. My issue is: ",
    category: "Coding",
  },
  {
    title: "Writing Assistant",
    prompt: "I need help drafting a document. Please make it professional and clear. Here is the topic: ",
    category: "Writing",
  },
  {
    title: "Study Guide",
    prompt: "Explain this concept simply as if I am a beginner, and provide an analogy: ",
    category: "Study",
  },
];
