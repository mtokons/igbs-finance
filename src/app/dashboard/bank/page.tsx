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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Bank Integration &amp; API Sync</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Manage automated PSD2 bank account feeds via GoCardless and FIRST API v1.0 queries</p>
      </div>

      {syncMsg && (
        <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-md text-xs sm:text-sm font-medium text-primary flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{syncMsg}</span>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* FYRST Import / Export Card */}
        <Card className="md:col-span-2 border-primary/30 shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" /> FYRST Import &amp; Export
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">CSV / PERIODISCH</Badge>
            </div>
            <CardDescription className="text-xs">
              Umsätze aus FYRST Business Banking als CSV exportieren und hier importieren – ohne Bank-Zugangsdaten.
              Einnahmen und Ausgaben werden automatisch dedupliziert und zugeordnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            <ol className="text-xs sm:text-sm text-muted-foreground list-decimal list-inside space-y-1 bg-muted/30 p-3 rounded-md">
              <li>In FYRST: <strong>Finanzübersicht → Umsätze</strong> öffnen und Zeitraum wählen.</li>
              <li>Auf <strong>Export</strong> klicken und Format <strong>CSV</strong> herunterladen.</li>
              <li>Die CSV-Datei unten hochladen. Dubletten werden automatisch übersprungen.</li>
            </ol>

            {fyrstMsg && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-xs sm:text-sm font-medium text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{fyrstMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <label className="inline-flex w-full sm:w-auto">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFyrstImport}
                  disabled={importing}
                />
                <span
                  className={`inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer h-9 sm:h-10 ${importing ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <Upload className="mr-2 h-4 w-4" /> {importing ? "Importiere..." : "FYRST CSV importieren"}
                </span>
              </label>
              <Button variant="outline" asChild size="sm" className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                <a href="/api/reports/export?format=xlsx&type=yearly">
                  <Download className="mr-2 h-4 w-4" /> Daten exportieren (Excel)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GoCardless Card */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Landmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" /> GoCardless PSD2 Sync
              </CardTitle>
              <Badge variant={bankConnection?.status === "LINKED" ? "success" : "secondary"} className="text-[10px]">
                {bankConnection?.status || "NOT LINKED"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Official PSD2 aggregator API for German banks (Sparkasse, Volksbank, Deutsche Bank, N26).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            {bankConnection ? (
              <div className="space-y-1.5 text-xs sm:text-sm">
                <p><strong>Bank Name:</strong> {bankConnection.institutionName || "IGBS Main Account"}</p>
                <p><strong>IBAN:</strong> {bankConnection.iban || "DE** **** **** **** 2510"}</p>
                {bankConnection.lastSyncAt && <p><strong>Last Sync:</strong> {formatDate(bankConnection.lastSyncAt)}</p>}
                {bankConnection.consentExpires && <p><strong>Consent Expires:</strong> {formatDate(bankConnection.consentExpires)}</p>}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No bank account linked via GoCardless AISP.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button onClick={handleSyncGoCardless} size="sm" className="w-full sm:w-auto text-xs h-9">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync Now
              </Button>
              <Button variant="outline" asChild size="sm" className="w-full sm:w-auto text-xs h-9">
                <a href="/api/bank/gocardless">
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Connect / Renew Consent
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FIRST API Card */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" /> FIRST API v1.0
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">PUBLIC API</Badge>
            </div>
            <CardDescription className="text-xs">
              Query public organization database records from api.first.org.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search team or query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadFirstApiTeams(searchQuery)}
                className="text-xs sm:text-sm h-9"
              />
              <Button variant="secondary" size="sm" className="text-xs h-9" onClick={() => loadFirstApiTeams(searchQuery)}>Search</Button>
            </div>

            <Button className="w-full text-xs h-9" variant="outline" size="sm" onClick={() => handleSyncFirstApi()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Import Selected FIRST API Entries
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FIRST API Teams Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Public FIRST API Database</CardTitle>
          <CardDescription className="text-xs">Feed from https://api.first.org/data/v1/teams</CardDescription>
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
