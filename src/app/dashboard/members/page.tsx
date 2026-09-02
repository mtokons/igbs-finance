"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus, Upload, Search } from "lucide-react";

interface Member {
  id: string;
  fullName: string;
  email: string | null;
  memberCode: string | null;
  monthlyFee: string;
  status: string;
  _count: { membershipPayments: number; courseEnrollments: number };
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", memberCode: "", monthlyFee: "25" });
  const [loading, setLoading] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  async function loadMembers() {
    const res = await fetch("/api/members");
    setMembers(await res.json());
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email || undefined,
        memberCode: form.memberCode || undefined,
        monthlyFee: parseFloat(form.monthlyFee),
      }),
    });
    setLoading(false);
    setShowForm(false);
    setForm({ fullName: "", email: "", memberCode: "", monthlyFee: "25" });
    loadMembers();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/members/import", { method: "POST", body: fd });
    const data = await res.json();
    setImportMsg(`${data.createdCount ?? 0} imported, ${data.updatedCount ?? 0} updated`);
    loadMembers();
  }

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.memberCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members Directory</h1>
          <p className="text-muted-foreground">{members.length} active registered members</p>
        </div>
        <div className="flex gap-2">
          <label>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
            <Button variant="outline" asChild>
              <span><Upload className="mr-2 h-4 w-4" />Bulk Import CSV</span>
            </Button>
          </label>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />Add Member
          </Button>
        </div>
      </div>

      {importMsg && <p className="text-sm text-green-700 font-medium">{importMsg}</p>}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add New Member</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <div><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
              <div><Label>Email Address</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Member Code / ID</Label><Input value={form.memberCode} onChange={(e) => setForm({ ...form, memberCode: e.target.value })} /></div>
              <div><Label>Monthly Fee (€)</Label><Input type="number" step="0.01" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} required /></div>
              <div className="md:col-span-2"><Button type="submit" disabled={loading}>Save Member</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search member by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled Courses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell>{m.memberCode ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(m.monthlyFee))}</TableCell>
                  <TableCell><Badge variant={m.status === "ACTIVE" ? "success" : "secondary"}>{m.status}</Badge></TableCell>
                  <TableCell>{m._count.courseEnrollments}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
