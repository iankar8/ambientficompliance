/**
 * Evidence-Collector Agent
 * Captures screenshots and HAR files using Browserbase for incident evidence
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface EvidenceCollectorInput {
  incidents: Array<{
    id: string;
    company_name: string;
    url: string;
    evidence_type: "checkout" | "login" | "homepage" | "custom";
    custom_selectors?: string[];
  }>;
}

interface EvidenceResult {
  incident_id: string;
  screenshots: string[]; // URLs to stored screenshots
  har_file?: string; // URL to HAR file
  metadata: {
    captured_at: string;
    page_title: string;
    viewport: { width: number; height: number };
  };
}

export async function evidenceCollector(
  input: EvidenceCollectorInput
): Promise<EvidenceResult[]> {
  const { incidents } = input;
  const results: EvidenceResult[] = [];

  for (const incident of incidents) {
    try {
      const evidence = await captureEvidence(incident);
      results.push(evidence);

      // Store in database
      await storeEvidence(incident.id, evidence);
    } catch (error) {
      console.error(`Failed to collect evidence for ${incident.company_name}:`, error);
    }
  }

  return results;
}

async function captureEvidence(incident: {
  id: string;
  company_name: string;
  url: string;
  evidence_type: string;
  custom_selectors?: string[];
}): Promise<EvidenceResult> {
  const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
  const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

  if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
    throw new Error("Browserbase credentials not configured");
  }

  // Create a browser session
  const sessionResponse = await fetch("https://www.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      "x-bb-api-key": BROWSERBASE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        viewport: { width: 1920, height: 1080 },
      },
    }),
  });

  const session = await sessionResponse.json();
  const sessionId = session.id;

  try {
    // Navigate and capture
    const captureResponse = await fetch(
      `https://www.browserbase.com/v1/sessions/${sessionId}/actions`,
      {
        method: "POST",
        headers: {
          "x-bb-api-key": BROWSERBASE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actions: [
            { type: "navigate", url: incident.url },
            { type: "wait", duration: 3000 },
            { type: "screenshot", fullPage: true },
            { type: "exportHAR" },
          ],
        }),
      }
    );

    const captureData = await captureResponse.json();

    // Get screenshot and HAR URLs
    const screenshots = captureData.screenshots || [];
    const harFile = captureData.harFile;

    return {
      incident_id: incident.id,
      screenshots,
      har_file: harFile,
      metadata: {
        captured_at: new Date().toISOString(),
        page_title: captureData.pageTitle || "",
        viewport: { width: 1920, height: 1080 },
      },
    };
  } finally {
    // Clean up session
    await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "x-bb-api-key": BROWSERBASE_API_KEY,
      },
    });
  }
}

async function storeEvidence(
  incidentId: string,
  evidence: EvidenceResult
): Promise<void> {
  const supabase = getSupabaseServerClient();

  await supabase.from("evidence").insert({
    signal_id: incidentId,
    screenshots: evidence.screenshots,
    har_file: evidence.har_file,
    captured_at: evidence.metadata.captured_at,
    page_title: evidence.metadata.page_title,
    viewport: evidence.metadata.viewport,
  });

  // Update signal with evidence flag
  await supabase
    .from("signals")
    .update({
      has_evidence: true,
      status: "EVIDENCE_COLLECTED",
    })
    .eq("id", incidentId);
}
