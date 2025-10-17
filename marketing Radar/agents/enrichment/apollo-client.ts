/**
 * Apollo.io Client
 * Company and contact enrichment
 */

export interface ApolloCompanyEnrichment {
  name: string;
  domain: string;
  industry: string;
  employee_count: number;
  revenue_range: string;
  technologies: string[];
  linkedin_url: string;
  founded_year: number;
  headquarters: {
    city: string;
    state: string;
    country: string;
  };
}

export interface ApolloContactSearch {
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedin_url: string;
  email_status: "verified" | "guessed" | "unavailable";
  confidence: number;
}

export class ApolloClient {
  private apiKey: string;
  private baseUrl = "https://api.apollo.io/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Apollo API key required");
    }
  }

  /**
   * Enrich company data by domain
   */
  async enrichCompany(domain: string): Promise<ApolloCompanyEnrichment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/enrich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        console.warn(`Apollo company enrichment failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const org = data.organization;

      return {
        name: org.name,
        domain: org.primary_domain,
        industry: org.industry,
        employee_count: org.estimated_num_employees,
        revenue_range: org.estimated_annual_revenue,
        technologies: org.technologies || [],
        linkedin_url: org.linkedin_url,
        founded_year: org.founded_year,
        headquarters: {
          city: org.city,
          state: org.state,
          country: org.country,
        },
      };
    } catch (error) {
      console.error("Apollo company enrichment error:", error);
      return null;
    }
  }

  /**
   * Search for contacts by company and title
   */
  async searchContacts(params: {
    domain: string;
    titles: string[];
    limit?: number;
  }): Promise<ApolloContactSearch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          organization_domains: [params.domain],
          person_titles: params.titles,
          page: 1,
          per_page: params.limit || 10,
        }),
      });

      if (!response.ok) {
        console.warn(`Apollo contact search failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      return data.people.map((person: any) => ({
        name: person.name,
        title: person.title,
        email: person.email,
        phone: person.phone_numbers?.[0]?.sanitized_number,
        linkedin_url: person.linkedin_url,
        email_status: person.email_status,
        confidence: person.email_status === "verified" ? 1.0 : 0.7,
      }));
    } catch (error) {
      console.error("Apollo contact search error:", error);
      return [];
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(email: string): Promise<{
    valid: boolean;
    status: string;
    confidence: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/emailer_campaigns/email_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return { valid: false, status: "unknown", confidence: 0 };
      }

      const data = await response.json();
      
      return {
        valid: data.email_status === "verified",
        status: data.email_status,
        confidence: data.email_status === "verified" ? 1.0 : 0.5,
      };
    } catch (error) {
      console.error("Apollo email verification error:", error);
      return { valid: false, status: "error", confidence: 0 };
    }
  }
}

export function getApolloClient(): ApolloClient {
  return new ApolloClient();
}
