/**
 * PhantomBuster Client
 * LinkedIn scraping and automation
 */

export interface PhantomBusterConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface LinkedInProfileData {
  name: string;
  headline: string;
  location: string;
  company: string;
  title: string;
  profileUrl: string;
  email?: string;
  phone?: string;
  connections: number;
  about: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
  skills: string[];
}

export interface LinkedInSearchResult {
  name: string;
  title: string;
  company: string;
  location: string;
  profileUrl: string;
  connectionDegree: string;
}

export class PhantomBusterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: PhantomBusterConfig) {
    this.apiKey = config?.apiKey || process.env.PHANTOMBUSTER_API_KEY || "";
    this.baseUrl = config?.baseUrl || "https://api.phantombuster.com/api/v2";

    if (!this.apiKey) {
      throw new Error("PhantomBuster API key required");
    }
  }

  /**
   * Launch a LinkedIn profile scraper phantom
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfileData | null> {
    try {
      // Launch the phantom
      const launchResponse = await fetch(`${this.baseUrl}/agents/launch`, {
        method: "POST",
        headers: {
          "X-Phantombuster-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: process.env.PHANTOMBUSTER_LINKEDIN_PROFILE_SCRAPER_ID,
          argument: {
            profileUrls: [profileUrl],
          },
        }),
      });

      if (!launchResponse.ok) {
        console.warn(`PhantomBuster launch failed: ${launchResponse.status}`);
        return null;
      }

      const launchData = await launchResponse.json();
      const containerId = launchData.containerId;

      // Wait for completion (poll every 5 seconds, max 2 minutes)
      const result = await this.waitForCompletion(containerId, 120000, 5000);
      
      if (!result) return null;

      return this.parseLinkedInProfile(result);
    } catch (error) {
      console.error("PhantomBuster profile scrape error:", error);
      return null;
    }
  }

  /**
   * Search LinkedIn Sales Navigator
   */
  async searchLinkedInSalesNav(params: {
    keywords?: string;
    company?: string;
    title?: string;
    location?: string;
    limit?: number;
  }): Promise<LinkedInSearchResult[]> {
    try {
      const launchResponse = await fetch(`${this.baseUrl}/agents/launch`, {
        method: "POST",
        headers: {
          "X-Phantombuster-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: process.env.PHANTOMBUSTER_LINKEDIN_SEARCH_ID,
          argument: {
            searches: [
              {
                keywords: params.keywords || "",
                company: params.company || "",
                title: params.title || "",
                location: params.location || "",
              },
            ],
            numberOfResultsPerSearch: params.limit || 100,
          },
        }),
      });

      if (!launchResponse.ok) {
        console.warn(`PhantomBuster search failed: ${launchResponse.status}`);
        return [];
      }

      const launchData = await launchResponse.json();
      const containerId = launchData.containerId;

      const result = await this.waitForCompletion(containerId, 180000, 5000);
      
      if (!result) return [];

      return this.parseSearchResults(result);
    } catch (error) {
      console.error("PhantomBuster search error:", error);
      return [];
    }
  }

  /**
   * Extract email from LinkedIn profile using PhantomBuster
   */
  async extractEmailFromLinkedIn(profileUrl: string): Promise<string | null> {
    try {
      const launchResponse = await fetch(`${this.baseUrl}/agents/launch`, {
        method: "POST",
        headers: {
          "X-Phantombuster-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: process.env.PHANTOMBUSTER_EMAIL_EXTRACTOR_ID,
          argument: {
            profileUrls: [profileUrl],
          },
        }),
      });

      if (!launchResponse.ok) return null;

      const launchData = await launchResponse.json();
      const result = await this.waitForCompletion(launchData.containerId, 60000, 3000);

      return result?.email || null;
    } catch (error) {
      console.error("PhantomBuster email extraction error:", error);
      return null;
    }
  }

  /**
   * Get agent output/result
   */
  private async getAgentOutput(containerId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/containers/fetch-output?id=${containerId}`, {
      headers: {
        "X-Phantombuster-Key": this.apiKey,
      },
    });

    if (!response.ok) return null;

    return await response.json();
  }

  /**
   * Wait for phantom completion
   */
  private async waitForCompletion(
    containerId: string,
    maxWaitMs: number = 120000,
    pollIntervalMs: number = 5000
  ): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const statusResponse = await fetch(`${this.baseUrl}/containers/fetch?id=${containerId}`, {
        headers: {
          "X-Phantombuster-Key": this.apiKey,
        },
      });

      if (!statusResponse.ok) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        continue;
      }

      const status = await statusResponse.json();

      if (status.status === "finished") {
        return await this.getAgentOutput(containerId);
      }

      if (status.status === "error") {
        console.error("PhantomBuster agent error:", status.error);
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    console.warn("PhantomBuster agent timeout");
    return null;
  }

  /**
   * Parse LinkedIn profile data
   */
  private parseLinkedInProfile(data: any): LinkedInProfileData {
    return {
      name: data.name || "",
      headline: data.headline || "",
      location: data.location || "",
      company: data.company || "",
      title: data.title || "",
      profileUrl: data.profileUrl || "",
      email: data.email,
      phone: data.phone,
      connections: data.connections || 0,
      about: data.about || "",
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || [],
    };
  }

  /**
   * Parse search results
   */
  private parseSearchResults(data: any): LinkedInSearchResult[] {
    if (!Array.isArray(data)) return [];

    return data.map((result) => ({
      name: result.name || "",
      title: result.title || "",
      company: result.company || "",
      location: result.location || "",
      profileUrl: result.profileUrl || "",
      connectionDegree: result.connectionDegree || "",
    }));
  }
}

export function getPhantomBusterClient(): PhantomBusterClient {
  return new PhantomBusterClient();
}
