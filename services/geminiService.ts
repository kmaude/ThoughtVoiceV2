import { GoogleGenAI, Type } from "@google/genai";
import { Topic, DailyPrompt, GeneratedAssets, UserProfile, PromptStatus, Source } from "../types";
import { db } from "./database";

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using recommended Gemini 3 models based on task complexity
const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';

// Helper to extract sources from grounding metadata
const extractSources = (response: any): Source[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  return chunks
    .map((c: any) => c.web)
    .filter((w: any) => w)
    .map((w: any) => ({ title: w.title, uri: w.uri }));
};

export const geminiService = {
  // 0. Onboarding Agent
  analyzeUserExpertise: async (name: string, role: string, industry: string, website: string, description?: string) => {
    try {
      console.log("Starting Identity Analysis Agent...");
      const contextInput = website ? `Company Website: ${website}` : `Company Description: ${description}`;
      const currentYear = new Date().getFullYear();

      const researchPrompt = `
        Act as a Personal Brand Strategist. 
        Research the following executive profile:
        - Name: ${name}
        - Role: ${role}
        - Industry: ${industry}
        - ${contextInput}

        Your Goal: Identify the specific thought leadership niches this person should own in ${currentYear}.
        
        CRITICAL INSTRUCTION: Do NOT ask the user any questions. If data is missing (like a specific website), make an educated guess based on the 'Industry' and 'Role' provided.
        You must output definitive strategy topics, not questions.
      `;

      const researchResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: researchPrompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const researchData = researchResponse.text;
      const sources = extractSources(researchResponse);

      const formattingPrompt = `
        You are a data formatter. 
        Based on: ${researchData}
        Format the findings into a clean JSON object.
        If the input text contains questions, ignore them and generate generic 3-4 word topics based on the industry: ${industry}.
      `;

      const formattingResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: formattingPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              analysis: { type: Type.STRING }
            }
          }
        },
      });

      const result = JSON.parse(formattingResponse.text || '{"topics": [], "analysis": ""}');
      return { ...result, sources };

    } catch (error) {
      console.error("Identity Analysis failed:", error);
      return {
        topics: [`${industry} Trends`, `Leadership`, `${role} Insights`, "Innovation", "Future of Work"],
        analysis: "Standard industry pillars selected due to analysis timeout.",
        sources: []
      };
    }
  },

  // 1. Research Engine
  generateWeeklyTopics: async (profile: UserProfile): Promise<Topic[]> => {
    try {
      const pastContext = await db.getHistoricalContext();
      const currentYear = new Date().getFullYear();
      
      const researchPrompt = `
        Act as a senior executive researcher.
        Find top 5 specific developments or debates in ${profile.industry} relevant to ${currentYear}.
        Focus on: ${profile.expertise.join(', ')}.
        PAST CONTEXT: ${pastContext.substring(0, 1000)}...
        
        CRITICAL: Identify "POV-able" events where there is disagreement, a shift in consensus, or a common misconception. Avoid generic definitions.
      `;

      const researchResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: researchPrompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      
      const sources = extractSources(researchResponse);

      const synthesisPrompt = `
        Strategy Engine. Using: ${researchResponse.text}
        Generate 5 strategic topics for a ${profile.role} that allow for a strong point of view.
        Format as JSON Array.
      `;

      const synthesisResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: synthesisPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Strategic', 'Trending', 'Competitor Gap'] },
                relevanceScore: { type: Type.NUMBER }
              }
            }
          }
        }
      });
      
      const raw = JSON.parse(synthesisResponse.text || "[]");
      return raw.map((t: any, i: number) => ({ 
        ...t, 
        id: `topic-${Date.now()}-${i}`,
        sources: sources 
      }));
    } catch (error) {
      console.error("Research failed:", error);
      return [];
    }
  },

  // 2. Prompt Generator (ThoughtVoice Prompt Architect Architecture)
  generateDailyPrompt: async (profile: UserProfile, topic?: Topic, toneOverride?: string, focus?: string): Promise<DailyPrompt> => {
    try {
      const topicContext = topic ? `Focus on: ${topic.title} - ${topic.description}` : `Pick a significant shift or debate in ${profile.industry}.`;
      const focusInstruction = focus ? `Research Focus: ${focus}` : 'Research Focus: Strategic Industry Nuance';
      const currentYear = new Date().getFullYear();
      
      // Phase 1: Research Phase
      const researchPrompt = `
        Find a specific, recent observation or tension (last 12 months) related to: ${topicContext}
        ${focusInstruction}
        Targeting audience for: ${profile.name} (${profile.role}).
      `;

      const researchResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: researchPrompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      
      const sources = extractSources(researchResponse);
      const researchText = researchResponse.text;

      // Determine Tone based on Architect principles
      const toneStyle = toneOverride && toneOverride !== 'Use Profile Default' ? toneOverride : (profile.toneStyle || 'Professional');

      // Phase 2: Architect Strategy Phase
      const promptText = `
        Act as ThoughtVoice Prompt Architect. Your job is to ask a question that draws out how a senior leader thinks.
        
        LEADER PROFILE:
        - Name: ${profile.name}
        - Role: ${profile.role}
        - Industry: ${profile.industry}
        - Tone: ${toneStyle}
        - Context from Research: ${researchText}

        MANDATORY PROMPT DESIGN PRINCIPLES:
        1. POV First: Ask for judgment or interpretation of the research. Never ask for definitions or industry summaries.
        2. Assume Seniority: Write peer-to-peer. Avoid "Tell us about..." or cliches. 
        3. Reflective, Not Performative: Frame it as thinking out loud. Avoid mentioning "your audience" or "thought leadership".
        4. Safe Sharpness: Invite nuance. Frame it around misconceptions or what most people miss.
        5. Experience -> Insight Bridge: Bridge the research to their lived experience.
        6. Enable Thinking: Signal there is no right answer. Use softeners like "Even if this is still forming..." or "What comes to mind when...".
        7. One Idea: Ask ONE focused question. No compound questions.
        
        OUTPUT REQUIREMENTS:
        - The 'question' field must be the stand-alone prompt (1-3 sentences maximum).
        - Calm, human, and confident language.
        - No jargon.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO, // Using Pro for the Architect logic
        contents: promptText,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              context: { type: Type.STRING, description: "Internal context for the architect" },
              question: { type: Type.STRING, description: "The 1-3 sentence stand-alone prompt for the leader" },
              angleVideo: { type: Type.STRING },
              anglePost: { type: Type.STRING },
              reasoning: { type: Type.STRING, description: "Why this builds authority NOW" },
              supportingData: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      const prompt: DailyPrompt = {
        id: `prompt-${Date.now()}`,
        userId: profile.id,
        status: PromptStatus.PENDING_REVIEW,
        scheduledFor: "",
        sources: sources,
        ...data
      };
      
      db.savePrompt(prompt);
      
      return prompt;
    } catch (error) {
      console.error("Prompt architect error", error);
      const fallback: DailyPrompt = {
        id: 'error',
        userId: profile.id,
        status: PromptStatus.PENDING_REVIEW,
        scheduledFor: "",
        context: 'System unavailable',
        question: 'What is a belief you hold about your industry that most of your peers would disagree with?',
        angleVideo: 'Share a quick update.',
        anglePost: 'Write about your current focus.',
        reasoning: 'Fallback due to AI error',
        supportingData: 'N/A',
        keywords: ['General']
      };
      db.savePrompt(fallback);
      return fallback;
    }
  },

  // 3. The "Mega Pipeline"
  processContentPipeline: async (transcriptOrText: string, profile: UserProfile, contentType: 'AUDIO' | 'VIDEO'): Promise<GeneratedAssets> => {
    const platforms = profile.platforms.join(', ');
    const tone = profile.toneStyle || (profile.tone > 70 ? 'Professional & Authoritative' : 'Casual & Conversational');

    const prompt = `
      Act as a Content Ghostwriter for ${profile.name}, who is a ${profile.role}.
      Tone: ${tone}.
      
      Source Content: "${transcriptOrText}"
      
      Generate specific copy for these platforms: ${platforms}.
      1. Clean Script (formatted for readability)
      2. LinkedIn Post (Professional, storytelling hook)
      3. Twitter Thread (Punchy, thread format)
      4. Blog Outline (Structured)
      5. Email Newsletter (Personal connection)
      6. 3 Viral Hooks
      
      Output JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4096 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cleanScript: { type: Type.STRING },
              linkedInPost: { type: Type.STRING },
              twitterThread: { type: Type.ARRAY, items: { type: Type.STRING } },
              blogOutline: { type: Type.STRING },
              emailNewsletter: { type: Type.STRING },
              hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.warn("AI Pipeline Failed, using fallback mock data.", error);
      return {
        cleanScript: "Script generation unavailable.",
        linkedInPost: "Excited to share my latest thoughts on this topic. [AI generation pending]",
        twitterThread: ["Thread coming soon...", "Stay tuned."],
        blogOutline: "1. Introduction\n2. Key Point\n3. Conclusion",
        emailNewsletter: "Hi team, here is my latest update.",
        hooks: ["You won't believe this...", "The industry is changing...", "Here is what I learned."]
      };
    }
  },

  mockTranscribe: async (topicContext: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Write a 150-word raw transcript of an executive talking about: "${topicContext}". Natural speech with some filler words to sound authentic.`,
      });
      return response.text || "Error generating transcript.";
    } catch (e) {
      return "Transcript generation failed due to network error.";
    }
  }
};
