import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4 px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
