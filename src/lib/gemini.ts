import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

// Initialize Gemini API with environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Cache for storing simplified abstracts
const abstractCache = new Map<string, string>();

// Define persona types
export type Persona = "college" | "professional" | "default" | "kids" | "researcher" | "executive" | "visual";

// Get persona prompt based on type
function getPersonaPrompt(persona: Persona): string {
  switch (persona) {
    case "college":
      return "Rewrite this academic paper abstract for a college student in that field of study. Use appropriate terminology but explain complex concepts clearly.";
    case "professional":
      return "Rewrite this academic paper abstract for a professional software engineer or researcher. Use technical terminology and focus on implementation details and methodologies.";
    case "kids":
      return "Rewrite this academic paper abstract for children under 10 years old. Use very simple language, fun analogies, and avoid all technical terms. Make it engaging and relatable to a child's everyday experiences.";
    case "researcher":
      return "Rewrite this academic paper abstract for a researcher in an adjacent field. Maintain technical rigor but provide additional context for field-specific terminology. Focus on methodological insights and potential cross-disciplinary applications.";
    case "executive":
      return "Rewrite this academic paper abstract for a busy executive or decision-maker. Focus on business implications, practical applications, and potential impact. Be concise and highlight the most important takeaways in a structured format.";
    case "visual":
      return "Rewrite this academic paper abstract with a focus on visual and spatial explanations. Use descriptive language that creates mental images, spatial relationships, and visual metaphors to explain the concepts.";
    default:
      return "Rewrite this academic paper abstract in plain English that is easy to understand. Keep the main points and findings, but make it more accessible to a general audience.";
  }
}

export async function simplifyAbstract(abstract: string, persona: Persona = "default"): Promise<string> {
  // Create a cache key that includes the persona
  const cacheKey = `${persona}:${abstract}`;
  
  // Check if result is in cache
  const cachedResult = abstractCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const personaPrompt = getPersonaPrompt(persona);
    const prompt = `You are given an academic paper abstract:

<abstract>
${abstract}
</abstract>

${personaPrompt}
Reply directly with the content, do not include preamble like "Here is the simplified abstract" or anything else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const simplifiedAbstract = response.text();
    
    // Store in cache
    abstractCache.set(cacheKey, simplifiedAbstract);
    
    return simplifiedAbstract;
  } catch (error) {
    console.error("Error simplifying abstract with Gemini:", error);
    // Return original abstract if processing fails
    return abstract;
  }
} 