"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, PieChart } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: "", eventDate: "", budget: "500", notes: "" });
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  async function loadEvents() {
    const res = await fetch("/api/events");
    setEvents(await res.json());
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        eventDate: form.eventDate || new Date().toISOString(),
        budget: parseFloat(form.budget),
        notes: form.notes || undefined,
      }),
    });
    setShowAddForm(false);
    setForm({ title: "", eventDate: "", budget: "500", notes: "" });
    loadEvents();
  }

  async function viewEventDetail(id: string) {
    const res = await fetch(`/api/events/${id}`);
    setSelectedEvent(await res.json());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monthly Events</h1>
          <p className="text-muted-foreground">Plan association events, track budgets, and link income/expense transactions</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Create New Event</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="grid gap-4 md:grid-cols-2">
              <div><Label>Event Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Event Date</Label><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required /></div>
              <div><Label>Allocated Budget (€)</Label><Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required /></div>
              <div><Label>Notes / Location</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="md:col-span-2"><Button type="submit">Save Event</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {events.map((ev) => {
          let totalSpentOrEarned = 0;
          ev.transactions?.forEach((t: any) => {
            totalSpentOrEarned += Number(t.bankTransaction?.amount || 0);
          });
          const budget = Number(ev.budget);

          return (
            <Card key={ev.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> {ev.title}
                  </CardTitle>
                  <Badge variant="outline">{formatDate(ev.eventDate)}</Badge>
                </div>
                <CardDescription>{ev.notes || "No notes"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Planned Budget:</span>
                  <span className="font-semibold">{formatCurrency(budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual (Bank Entries):</span>
                  <span className={`font-semibold ${totalSpentOrEarned >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalSpentOrEarned)}
                  </span>
                </div>
                <Button variant="outline" className="w-full" onClick={() => viewEventDetail(ev.id)}>
                  <PieChart className="mr-2 h-4 w-4" /> Financial Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl shadow-xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedEvent.title} — Linked Transactions</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>✕</Button>
              </CardTitle>
              <CardDescription>Budget: {formatCurrency(Number(selectedEvent.budget))}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Counterparty / Reference</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEvent.transactions?.map((et: any) => {
                    const amt = Number(et.bankTransaction?.amount || 0);
                    return (
                      <TableRow key={et.id}>
                        <TableCell>{formatDate(et.bankTransaction?.bookingDate)}</TableCell>
                        <TableCell>{et.bankTransaction?.counterparty || et.bankTransaction?.reference}</TableCell>
                        <TableCell className={`font-semibold ${amt >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(amt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!selectedEvent.transactions || selectedEvent.transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                        No linked transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
