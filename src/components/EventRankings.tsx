import type { Ranking } from "@/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface EventRankingsProps {
  rankings: Ranking[];
}

/** Final standings for a competition. */
export default function EventRankings({ rankings }: EventRankingsProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((entry) => (
            <TableRow key={entry.rank}>
              <TableCell className="font-medium tabular-nums">
                {entry.rank}
              </TableCell>
              <TableCell>{entry.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.score.toFixed(5)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
