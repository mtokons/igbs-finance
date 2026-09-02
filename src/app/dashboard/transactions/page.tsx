"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Upload, CheckCircle2, ArrowLeftRight, Search, AlertCircle } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"all" | "unmatched" | "import">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [matchType, setMatchType] = useState<string>("membership");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [importMessage, setImportMessage] = useState<string>("");

  async function loadData() {
    const [txRes, memRes, crsRes, enrRes, tchRes, evtRes] = await Promise.all([
      fetch("/api/transactions?limit=100"),
      fetch("/api/members"),
      fetch("/api/courses"),
      fetch("/api/enrollments"),
      fetch("/api/teachers"),
      fetch("/api/events"),
    ]);

    setTransactions(await txRes.json());
    setMembers(await memRes.json());
    setCourses(await crsRes.json());
    setEnrollments(await enrRes.json());
    setTeachers(await tchRes.json());
    setEvents(await evtRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transactions/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImportMessage(data.message);
        loadData();
      } else {
        setImportMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportMessage(`Upload Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmMatch() {
    if (!selectedTx) return;

    const payload: any = {
      transactionId: selectedTx.id,
      targetType: matchType,
    };

    if (matchType === "membership") payload.memberId = selectedEntityId;
    if (matchType === "course") payload.enrollmentId = selectedEntityId;
    if (matchType === "salary") payload.teacherId = selectedEntityId;
    if (matchType === "event") payload.eventId = selectedEntityId;

    const res = await fetch("/api/transactions/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSelectedTx(null);
      loadData();
    }
  }

  const filteredTx = transactions.filter((tx) => {
    const matchesTab = activeTab === "unmatched" ? tx.reconciliationStatus === "UNMATCHED" || tx.reconciliationStatus === "SUGGESTED" : true;
    const matchesStatus = statusFilter === "ALL" ? true : tx.reconciliationStatus === statusFilter;
    const matchesSearch =
      !search ||
      tx.counterparty?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.amount).includes(search);
    return matchesTab && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions & Reconciliation</h1>
          <p className="text-muted-foreground">Manage bank entries, import CSV statements, and reconcile with dues or expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "all" ? "default" : "outline"} onClick={() => setActiveTab("all")}>
            All Transactions
          </Button>
          <Button variant={activeTab === "unmatched" ? "default" : "outline"} onClick={() => setActiveTab("unmatched")}>
            <AlertCircle className="mr-2 h-4 w-4" /> Unmatched Queue
          </Button>
          <Button variant={activeTab === "import" ? "default" : "outline"} onClick={() => setActiveTab("import")}>
            <Upload className="mr-2 h-4 w-4" /> Upload CSV
          </Button>
        </div>
      </div>

      {activeTab === "import" && (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle>Import Bank Statement (CSV / MT940)</CardTitle>
            <CardDescription>
              Supports German bank formats (Sparkasse, Hamburger Volksbank, Postbank, N26, CAMT.053). Duplicates are automatically detected via SHA-256 hash.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-8 border border-dashed rounded-lg bg-accent/20">
              <label className="cursor-pointer text-center space-y-2">
                <Upload className="mx-auto h-10 w-10 text-primary animate-bounce" />
                <span className="block text-sm font-medium">Click here to select a CSV bank export file</span>
                <span className="block text-xs text-muted-foreground">Supported Formats: .csv, .txt</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {uploading && <p className="text-sm text-muted-foreground animate-pulse">Processing file and deduplicating records...</p>}
            {importMessage && <div className="p-3 bg-muted rounded text-sm font-medium text-primary">{importMessage}</div>}
          </CardContent>
        </Card>
      )}

      {(activeTab === "all" || activeTab === "unmatched") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search counterparty or reference..." className="pl-8 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="UNMATCHED">Unmatched</SelectItem>
                  <SelectItem value="SUGGESTED">Suggested</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="IGNORED">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Counterparty / Partner</TableHead>
                  <TableHead>Reference / Purpose</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reconciliation</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map((tx) => {
                  const isPositive = Number(tx.amount) >= 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(tx.bookingDate)}</TableCell>
                      <TableCell className="font-medium text-sm">{tx.counterparty || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{tx.reference || "—"}</TableCell>
                      <TableCell className={`font-semibold whitespace-nowrap ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Number(tx.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.reconciliationStatus === "MATCHED" ? "success" : tx.reconciliationStatus === "SUGGESTED" ? "warning" : "secondary"}>
                          {tx.reconciliationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedTx(tx)}>
                          <ArrowLeftRight className="mr-1 h-3 w-3" /> Reconcile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTx.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTx && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg shadow-xl border">
            <CardHeader>
              <CardTitle>Reconcile Transaction</CardTitle>
              <CardDescription>
                {selectedTx.counterparty || "Bank Entry"} ({formatCurrency(Number(selectedTx.amount))})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded text-xs space-y-1">
                <p><strong>Reference:</strong> {selectedTx.reference || "None"}</p>
                <p><strong>Date:</strong> {formatDate(selectedTx.bookingDate)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reconciliation Type:</label>
                <Select value={matchType} onValueChange={setMatchType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership">Membership Dues</SelectItem>
                    <SelectItem value="course">Madrasha Course Fee</SelectItem>
                    <SelectItem value="salary">Teacher Honorarium / Salary</SelectItem>
                    <SelectItem value="event">Event Expense/Income</SelectItem>
                    <SelectItem value="ignore">Mark as Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {matchType === "membership" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Member:</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger><SelectValue placeholder="Choose member..." /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName} ({formatCurrency(Number(m.monthlyFee))}/month)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {matchType === "course" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Student's Course Fee:</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger><SelectValue placeholder="Choose student enrollment..." /></SelectTrigger>
                    <SelectContent>
                      {enrollments.map((en) => (
                        <SelectItem key={en.id} value={en.id}>
                          {en.studentCode ? `${en.studentCode} · ` : ""}{en.studentName} — {en.courseName} ({formatCurrency(Number(en.expectedAmount))})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {enrollments.length === 0 && (
                    <p className="text-xs text-muted-foreground">No student enrollments yet — enroll students under Madrasha Courses first.</p>
                  )}
                </div>
              )}

              {matchType === "salary" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Teacher:</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger><SelectValue placeholder="Choose teacher..." /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} (Default: {formatCurrency(Number(t.defaultSalary))})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {matchType === "event" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Event:</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger><SelectValue placeholder="Choose event..." /></SelectTrigger>
                    <SelectContent>
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          {ev.title} ({formatDate(ev.eventDate)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTx(null)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmMatch}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Save Reconciliation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
