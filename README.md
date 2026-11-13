# MindDocs AI

> Chat with your documents.

MindDocs AI is an AI-powered document analysis and conversational Q&A application that allows users to upload documents, analyze their contents with Google Gemini, ask questions, generate study material, take interactive quizzes, and export conversations.

## Key Features

- **Document Analysis**: Upload PDF documents to receive executive summaries, key topics, and important concepts powered by Gemini Files API.
- **Conversational Q&A**: Ask targeted questions with precise, grounded answers and reliable page citations (`[SOURCE: Page X]`).
- **Follow-up Actions**: Direct action pills under every response to explain simpler, provide concrete examples, go deeper into technical nuances, or prompt follow-ups.
- **Interactive Quiz Mode**: Generate structured multiple-choice quizzes with custom question count, difficulty levels, grounded explanations, and review scores.
- **Export Options**: Export full conversations, structured study notes, and quiz reviews into clean PDF, Markdown (`.md`), or Plain Text (`.txt`) files.
- **Session History**: Fast access to past document conversations with local caching.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, jsPDF
- **Backend**: Node.js, Express, Multer, Google Gen AI SDK (`@google/genai`)
