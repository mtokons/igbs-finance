"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Plus, Upload, Search, Edit, Trash2, Users } from "lucide-react";
import { useSession } from "next-auth/react";

interface Member {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  ibanLast4: string | null;
  memberCode: string | null;
  monthlyFee: string | number;
  status: string;
  notes: string | null;
  _count: { membershipPayments: number; courseEnrollments: number };
}

export default function MembersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrTreasurer = role === "ADMIN" || role === "TREASURER";

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", memberCode: "", monthlyFee: "25" });
  const [loading, setLoading] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  // Edit Member Modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    memberCode: "",
    monthlyFee: "25",
    status: "ACTIVE",
    notes: "",
  });

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
        phone: form.phone || undefined,
        memberCode: form.memberCode || undefined,
        monthlyFee: parseFloat(form.monthlyFee),
      }),
    });
    setLoading(false);
    setShowForm(false);
    setForm({ fullName: "", email: "", phone: "", memberCode: "", monthlyFee: "25" });
    loadMembers();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email || null,
          phone: editForm.phone || null,
          memberCode: editForm.memberCode || null,
          monthlyFee: parseFloat(editForm.monthlyFee),
          status: editForm.status,
          notes: editForm.notes || null,
        }),
      });

      if (res.ok) {
        setEditingMember(null);
        loadMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Are you sure you want to delete member "${member.fullName}"? This will delete associated payments and enrollments.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      if (res.ok) {
        loadMembers();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function startEditing(m: Member) {
    setEditingMember(m);
    setEditForm({
      fullName: m.fullName,
      email: m.email || "",
      phone: m.phone || "",
      memberCode: m.memberCode || "",
      monthlyFee: String(m.monthlyFee),
      status: m.status,
      notes: m.notes || "",
    });
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
      m.memberCode?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Members Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{members.length} registered IGBS community members</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrTreasurer && (
            <>
              <label className="flex-1 sm:flex-initial">
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto h-9 text-xs">
                  <span><Upload className="mr-1.5 h-3.5 w-3.5" />Import CSV</span>
                </Button>
              </label>
              <Button onClick={() => setShowForm(!showForm)} size="sm" className="flex-1 sm:flex-initial h-9 text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Member
              </Button>
            </>
          )}
        </div>
      </div>

      {importMsg && <p className="text-xs sm:text-sm text-green-700 font-medium p-2 bg-green-500/10 rounded-md border border-green-500/20">{importMsg}</p>}

      {showForm && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2"><CardTitle className="text-base sm:text-lg">Add New Member</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleCreate} className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-1"><Label className="text-xs">Full Name *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
              <div className="space-y-1"><Label className="text-xs">Email Address</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Member Code / ID</Label><Input value={form.memberCode} onChange={(e) => setForm({ ...form, memberCode: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Monthly Fee (€) *</Label><Input type="number" step="0.01" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} required /></div>
              <div className="md:col-span-2 pt-1 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={loading}>Save Member</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search member by name, code, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 text-xs sm:text-sm h-9" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courses</TableHead>
                {isAdminOrTreasurer && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-foreground">{m.fullName}</TableCell>
                  <TableCell>
                    {m.memberCode ? (
                      <Badge variant="outline" className="font-mono text-xs">{m.memberCode}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{m.email || "—"}</div>
                    {m.phone && <div className="text-[11px]">{m.phone}</div>}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">{formatCurrency(parseFloat(String(m.monthlyFee)))}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "ACTIVE" ? "success" : m.status === "SUSPENDED" ? "destructive" : "secondary"}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{m._count?.courseEnrollments || 0}</TableCell>
                  {isAdminOrTreasurer && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit Member"
                          onClick={() => startEditing(m)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete Member"
                          onClick={() => handleDelete(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No members found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-lg shadow-2xl border">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" /> Edit Member Details
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingMember(null)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">Update membership records for {editingMember.fullName}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2">
              <form onSubmit={handleUpdate} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Member Code / ID</Label>
                  <Input
                    value={editForm.memberCode}
                    onChange={(e) => setEditForm({ ...editForm, memberCode: e.target.value })}
                    className="text-xs sm:text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Dues (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.monthlyFee}
                    onChange={(e) => setEditForm({ ...editForm, monthlyFee: e.target.value })}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
