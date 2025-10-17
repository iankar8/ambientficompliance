/**
 * Clearbit Client
 * Company enrichment and tech stack detection
 */

export interface ClearbitCompanyEnrichment {
  name: string;
  domain: string;
  description: string;
  category: {
    industry: string;
    sector: string;
  };
  metrics: {
    employees: number;
    employeesRange: string;
    estimatedAnnualRevenue: string;
    fiscalYearEnd: number;
  };
  tech: string[];
  linkedin: {
    handle: string;
  };
  twitter: {
    handle: string;
  };
  location: string;
  tags: string[];
}

export class ClearbitClient {
  private apiKey: string;
  private baseUrl = "https://company.clearbit.com/v2";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLEARBIT_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Clearbit API key required");
    }
  }

  /**
   * Enrich company by domain
   */
  async enrichCompany(domain: string): Promise<ClearbitCompanyEnrichment | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/companies/find?domain=${encodeURIComponent(domain)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Clearbit enrichment failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        name: data.name,
        domain: data.domain,
        description: data.description,
        category: {
          industry: data.category?.industry || "",
          sector: data.category?.sector || "",
        },
        metrics: {
          employees: data.metrics?.employees || 0,
          employeesRange: data.metrics?.employeesRange || "",
          estimatedAnnualRevenue: data.metrics?.estimatedAnnualRevenue || "",
          fiscalYearEnd: data.metrics?.fiscalYearEnd || 0,
        },
        tech: data.tech || [],
        linkedin: {
          handle: data.linkedin?.handle || "",
        },
        twitter: {
          handle: data.twitter?.handle || "",
        },
        location: data.location || "",
        tags: data.tags || [],
      };
    } catch (error) {
      console.error("Clearbit enrichment error:", error);
      return null;
    }
  }

  /**
   * Get tech stack for a domain
   */
  async getTechStack(domain: string): Promise<string[]> {
    const enrichment = await this.enrichCompany(domain);
    return enrichment?.tech || [];
  }
}

export function getClearbitClient(): ClearbitClient {
  return new ClearbitClient();
}
