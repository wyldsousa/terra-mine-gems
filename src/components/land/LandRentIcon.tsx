import { cn } from "@/lib/utils";

/** Land Rent's shared mark: a location pin over virtual property boundaries. */
export function LandRentIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("land-rent-icon h-6 w-6 shrink-0", className)}>
    <path d="m5 34 19-9 19 9-19 10L5 34Z" className="land-rent-icon-lot" />
    <path d="m14 30 19 9M24 25v19m-10-5 19-9" className="land-rent-icon-lines" />
    <path d="M36 17c0 9-12 19-12 19S12 26 12 17a12 12 0 1 1 24 0Z" className="land-rent-icon-pin" />
    <circle cx="24" cy="17" r="5" className="land-rent-icon-center" />
  </svg>;
}