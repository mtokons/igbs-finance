import { prisma } from "@/lib/db";

export interface FirstApiTeam {
  id: string;
  name: string;
  country: string;
  region?: string;
  description?: string;
  host?: string;
}

export interface FirstApiResponse {
  status: string;
  statusCode: number;
  total: number;
  data: FirstApiTeam[];
}

/**
 * Fetches public team / organization database records from FIRST API v1.0
 * Endpoint: https://api.first.org/data/v1/teams
 */
export async function fetchFirstApiTeams(query?: string, country: string = "DE"): Promise<FirstApiTeam[]> {
  try {
    const url = new URL("https://api.first.org/data/v1/teams");
    if (country) url.searchParams.set("country", country);
    if (query) url.searchParams.set("q", query);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`FIRST API responded with status ${res.status}`);
    }

    const rawData = await res.json();
    const teams: FirstApiTeam[] = [];

    if (rawData && rawData.data) {
      if (Array.isArray(rawData.data)) {
        rawData.data.forEach((item: any, idx: number) => {
          teams.push({
            id: item.id || item.team_id || `first-team-${idx}`,
            name: item.team || item.name || "Unknown Organization",
            country: item.country || "DE",
            region: item.region || item.state,
            description: item.description,
            host: item.host,
          });
        });
      } else if (typeof rawData.data === "object") {
        Object.entries(rawData.data).forEach(([key, item]: [string, any]) => {
          teams.push({
            id: key,
            name: item.team || item.name || key,
            country: item.country || "DE",
            region: item.region || item.state,
            description: item.description,
            host: item.host,
          });
        });
      }
    }

    return teams;
  } catch (error) {
    console.error("Failed to fetch from FIRST API:", error);
    return [];
  }
}

/**
 * Creates bank transaction entries for selected external bank/team records fetched from FIRST API
 */
export async function syncFirstApiAsTransactions(selectedTeamIds?: string[]): Promise<{ added: number }> {
  const teams = await fetchFirstApiTeams();
  const filtered = selectedTeamIds
    ? teams.filter((t) => selectedTeamIds.includes(t.id))
    : teams.slice(0, 10);

  let added = 0;
  for (const team of filtered) {
    const externalId = `FIRST_API_${team.id}`;
    const existing = await prisma.bankTransaction.findFirst({
      where: { externalId },
    });

    if (!existing) {
      await prisma.bankTransaction.create({
        data: {
          externalId,
          bookingDate: new Date(),
          valueDate: new Date(),
          amount: 50.0,
          counterparty: team.name,
          reference: `FIRST API Sync - ${team.id} (${team.country})`,
          source: "GOCARDLESS",
          reconciliationStatus: "UNMATCHED",
          notes: `Synced from FIRST API v1.0. Host: ${team.host || "N/A"}`,
        },
      });
      added++;
    }
  }

  return { added };
}
