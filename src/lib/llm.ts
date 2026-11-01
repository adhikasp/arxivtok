const MODEL_NAME = "openai/gpt-6-luna";
const REASONING_EFFORT = "high";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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
      return "Rewrite this academic paper abstract for a professional software engineer. Use technical terminology and focus on implementation details and methodologies. Highlight potential on implication on building tech products or services, if any.";
    case "kids":
      return "Rewrite this academic paper abstract for children under 10 years old. Use very simple language, fun analogies, and avoid all technical terms. Make it engaging and relatable to a child's everyday experiences.";
    case "researcher":
      return "Rewrite this academic paper abstract for a researcher in an adjacent field. Maintain technical rigor but provide additional context for field-specific terminology. Focus on methodological insights and potential cross-disciplinary applications.";
    case "executive":
      return "Rewrite this academic paper abstract for a executive or decision-maker. Focus on business implications, practical applications, and potential to turn into a business opportunity.";
    case "visual":
      return "Rewrite this academic paper abstract with a focus on visual and spatial explanations. Use descriptive language that creates mental images, spatial relationships, and visual metaphors to explain the concepts.";
    default:
      return "Rewrite this academic paper abstract in plain English that is easy to understand for layman. Keep the main points and findings, but make it more accessible to an average person without any background in the field.";
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
    const personaPrompt = getPersonaPrompt(persona);
    const prompt = `You are given an academic paper abstract:

<abstract>
${abstract}
</abstract>

${personaPrompt}
Reply directly with the content, do not include preamble like "Here is the simplified abstract" or anything else.

Use 200 word or less.
`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "ArxivTok",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        reasoning: { effort: REASONING_EFFORT },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const simplifiedAbstract: string | undefined = data.choices?.[0]?.message?.content?.trim();
    if (!simplifiedAbstract) {
      throw new Error("OpenRouter returned an empty completion");
    }
    
    // Store in cache
    abstractCache.set(cacheKey, simplifiedAbstract);
    
    return simplifiedAbstract;
  } catch (error) {
    console.error("Error simplifying abstract with OpenRouter:", error);
    // Return original abstract if processing fails
    return abstract;
  }
} 