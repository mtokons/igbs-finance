"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, RefreshCw, ShieldCheck, Globe, CheckCircle2, Upload, Download, FileSpreadsheet } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BankPage() {
  const [bankConnection, setBankConnection] = useState<any | null>(null);
  const [firstApiTeams, setFirstApiTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [fyrstMsg, setFyrstMsg] = useState("");

  async function loadBankStatus() {
    const res = await fetch("/api/bank/gocardless");
    if (res.ok) {
      const data = await res.json();
      setBankConnection(data.connection || null);
    }
  }

  async function loadFirstApiTeams(query = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/bank/first-api?country=DE${query ? `&q=${encodeURIComponent(query)}` : ""}`);
      const data = await res.json();
      if (data.success) {
        setFirstApiTeams(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBankStatus();
    loadFirstApiTeams();
  }, []);

  async function handleSyncGoCardless() {
    setSyncMsg("Syncing transactions with GoCardless Bank API...");
    const res = await fetch("/api/bank/sync", { method: "POST" });
    const data = await res.json();
    setSyncMsg(data.message || "GoCardless sync completed.");
    loadBankStatus();
  }

  async function handleSyncFirstApi(teamId?: string) {
    setSyncMsg("Fetching records from FIRST API v1.0...");
    const res = await fetch("/api/bank/first-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIds: teamId ? [teamId] : undefined }),
    });
    const data = await res.json();
    setSyncMsg(data.message || "FIRST API Data Sync completed.");
  }

  async function handleFyrstImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setFyrstMsg("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "FYRST");

    try {
      const res = await fetch("/api/transactions/import", { method: "POST", body: formData });
      const data = await res.json();
      setFyrstMsg(res.ok ? data.message : `Fehler: ${data.error}`);
    } catch (err: any) {
      setFyrstMsg(`Upload-Fehler: ${err.message}`);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bank Integration & API Sync</h1>
        <p className="text-muted-foreground">Manage automated PSD2 bank account feeds via GoCardless and FIRST API v1.0 queries</p>
      </div>

      {syncMsg && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium text-primary flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {syncMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* FYRST Import / Export Card */}
        <Card className="md:col-span-2 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> FYRST Import &amp; Export
              </CardTitle>
              <Badge variant="outline">CSV / PERIODISCH</Badge>
            </div>
            <CardDescription>
              Umsätze aus FYRST Business Banking als CSV exportieren und hier importieren – ohne Bank-Zugangsdaten.
              Einnahmen und Ausgaben werden automatisch dedupliziert und zugeordnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>In FYRST: <strong>Finanzübersicht → Umsätze</strong> öffnen und Zeitraum wählen.</li>
              <li>Auf <strong>Export</strong> klicken und Format <strong>CSV</strong> herunterladen.</li>
              <li>Die CSV-Datei unten hochladen. Dubletten werden automatisch übersprungen.</li>
            </ol>

            {fyrstMsg && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {fyrstMsg}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFyrstImport}
                  disabled={importing}
                />
                <span
                  className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer ${importing ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <Upload className="mr-2 h-4 w-4" /> {importing ? "Importiere..." : "FYRST CSV importieren"}
                </span>
              </label>
              <Button variant="outline" asChild>
                <a href="/api/reports/export?format=xlsx&type=yearly">
                  <Download className="mr-2 h-4 w-4" /> Daten exportieren (Excel)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GoCardless Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" /> GoCardless PSD2 Sync
              </CardTitle>
              <Badge variant={bankConnection?.status === "LINKED" ? "success" : "secondary"}>
                {bankConnection?.status || "NOT LINKED"}
              </Badge>
            </div>
            <CardDescription>
              Official PSD2 aggregator API for German banks (Sparkasse, Volksbank, Deutsche Bank, N26).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankConnection ? (
              <div className="space-y-2 text-sm">
                <p><strong>Bank Name:</strong> {bankConnection.institutionName || "IGBS Main Account"}</p>
                <p><strong>IBAN:</strong> {bankConnection.iban || "DE** **** **** **** 2510"}</p>
                {bankConnection.lastSyncAt && <p><strong>Last Sync:</strong> {formatDate(bankConnection.lastSyncAt)}</p>}
                {bankConnection.consentExpires && <p><strong>Consent Expires:</strong> {formatDate(bankConnection.consentExpires)}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bank account linked via GoCardless AISP.</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSyncGoCardless}>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync Now
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/bank/gocardless">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Connect / Renew Consent
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FIRST API Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> FIRST API v1.0 Integration
              </CardTitle>
              <Badge variant="outline">PUBLIC API</Badge>
            </div>
            <CardDescription>
              Direct query interface to fetch public CSIRT/organization database records from https://api.first.org/data/v1/teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search team or bank query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadFirstApiTeams(searchQuery)}
              />
              <Button variant="secondary" onClick={() => loadFirstApiTeams(searchQuery)}>Search</Button>
            </div>

            <Button className="w-full" variant="outline" onClick={() => handleSyncFirstApi()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Import Selected FIRST API Entries
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FIRST API Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Public FIRST API Organization & Team Database</CardTitle>
          <CardDescription>Live database feed from https://api.first.org/data/v1/teams</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Organization / Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Region / Host</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 animate-pulse">
                    Querying FIRST API v1.0...
                  </TableCell>
                </TableRow>
              ) : (
                firstApiTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-mono text-xs">{team.id}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.country}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{team.host || team.region || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleSyncFirstApi(team.id)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Create Entry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
