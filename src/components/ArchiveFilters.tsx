import { Search } from "lucide-react";
import { EVENT_TYPES, type EventType } from "@/data";
import { SUIT } from "./SuitBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ArchiveFiltersProps {
  type: EventType | "All";
  search: string;
  onTypeChange: (type: EventType | "All") => void;
  onSearchChange: (search: string) => void;
}

export default function ArchiveFilters({
  type,
  search,
  onTypeChange,
  onSearchChange,
}: ArchiveFiltersProps) {
  return (
    <div className="mx-auto mt-6 grid w-[90%] gap-3 sm:grid-cols-[1fr_14rem]">
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          aria-label="Search past events"
          placeholder="Search past events — options, panel, Jane Street…"
          className="w-full pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        value={type}
        onValueChange={(value) => onTypeChange(value as EventType | "All")}
      >
        <SelectTrigger className="w-full" aria-label="Filter by type">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All types</SelectItem>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {/* The filter speaks the same visual language as the badges. */}
              <span data-suit={t} className="mr-1.5 text-[var(--suit)]" aria-hidden="true">
                {SUIT[t]}
              </span>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
