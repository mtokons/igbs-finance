"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings & System Overview</h1>
        <p className="text-muted-foreground">IGBS e.V. Association configuration, role access, and audit log tracking</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Association Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Organization:</strong> Islamische Gemeinschaft für Bildung und Soziales e.V.</p>
            <p><strong>Location:</strong> Hamburg (VR 25109)</p>
            <p><strong>Default Currency:</strong> EUR (€)</p>
            <p><strong>Region & Compliance:</strong> Germany West Central (EU GDPR Compliant)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> System Transaction Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <strong className="text-green-700">Income Categories:</strong>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline">Membership Dues</Badge>
                <Badge variant="outline">Course Fee</Badge>
                <Badge variant="outline">Donations / Zakat / Sadaqah</Badge>
                <Badge variant="outline">Other Income</Badge>
              </div>
            </div>
            <div className="pt-2">
              <strong className="text-red-700">Expense Categories:</strong>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline">Teacher Honorarium / Salary</Badge>
                <Badge variant="outline">Events</Badge>
                <Badge variant="outline">Rent & Utilities</Badge>
                <Badge variant="outline">Office & Software</Badge>
                <Badge variant="outline">Other Expenses</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
