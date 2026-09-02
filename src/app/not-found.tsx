import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-muted/30">
      <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-2">Seite nicht gefunden</h2>
      <p className="text-muted-foreground mb-6">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
      <Button asChild>
        <Link href="/dashboard">Zurück zum Dashboard</Link>
      </Button>
    </div>
  );
}
