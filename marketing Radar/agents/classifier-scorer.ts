/**
 * Classifier-Scorer Agent
 * Uses cheap LLM + rules to classify signals and score them
 */

import { withRetry, RateLimiter } from "@/lib/retry";
import { getOpenRouterClient } from "@/lib/integrations/openrouter";

interface ClassifierInput {
  signals: Array<{ id: string; title: string; body: string; url: string }>;
}

interface ClassifierOutput {
  signal_type: "incident" | "hiring" | "vendor_churn" | "regulation" | "other";
  indicators: string[];
  confidence: number;
}

const CLASSIFIER_PROMPT = `Return JSON only:
{ "signal_type": "incident|hiring|vendor_churn|regulation|other",
  "indicators": ["chargebacks","refund abuse","ATO","card testing","bot traffic","triangulation","friendly fraud","policy drift"],
  "confidence": 0-1 }`;

const rateLimiter = new RateLimiter(5, 200); // Max 5 concurrent, 200ms between calls

export async function classifierScorer(input: ClassifierInput): Promise<any[]> {
  const { signals } = input;
  const scored = [];

  for (const signal of signals) {
    try {
      const classification = await rateLimiter.execute(() =>
        withRetry(
          () => classifySignal(signal.title, signal.body),
          {
            maxAttempts: 3,
            delayMs: 1000,
            onRetry: (error, attempt) => {
              console.warn(`Retry ${attempt} for signal ${signal.id}: ${error.message}`);
            },
          }
        )
      );
      
      const score = calculateScore(classification);

      scored.push({
        ...signal,
        signal_type: classification.signal_type,
        indicators: classification.indicators,
        confidence: classification.confidence,
        score,
      });

      // Note: Database update will be handled by API route
    } catch (error) {
      console.error(`Failed to classify signal ${signal.id}:`, error);
      // Add failed signal with default values
      scored.push({
        ...signal,
        signal_type: "other",
        indicators: [],
        confidence: 0,
        score: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return scored;
}

async function classifySignal(
  title: string,
  body: string
): Promise<ClassifierOutput> {
  const openrouter = getOpenRouterClient();

  const response = await openrouter.gpt35([
    { role: "system", content: CLASSIFIER_PROMPT },
    {
      role: "user",
      content: `Title: ${title}\n\nBody: ${body.substring(0, 2000)}`,
    },
  ], {
    temperature: 0.1,
    max_tokens: 200,
  });

  // Response is already a string from OpenRouter client
  try {
    return JSON.parse(response);
  } catch {
    return {
      signal_type: "other",
      indicators: [],
      confidence: 0,
    };
  }
}

function calculateScore(classification: ClassifierOutput): number {
  let score = 0;

  // Base score from confidence
  score += classification.confidence * 5;

  // Signal type multipliers
  const typeScores: Record<string, number> = {
    incident: 3,
    hiring: 2,
    vendor_churn: 2,
    regulation: 1,
    other: 0,
  };
  score += typeScores[classification.signal_type] || 0;

  // Indicator bonuses
  score += classification.indicators.length * 0.5;

  return Math.min(Math.round(score), 10);
}

