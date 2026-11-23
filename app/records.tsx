import { Check, Clock3, Minus } from "lucide-react";
import type { ReactNode } from "react";

export function Badge({ value }: { value: string }) {
  const empty = value === "Out of stock";
  const pending =
    value === "Pending" || value === "Low stock" || value.endsWith(" left");
  const Icon = empty ? Minus : pending ? Clock3 : Check;
  const tone = empty ? "red" : pending ? "amber" : "green";

  return (
    <span className={`badge ${tone}`}>
      <Icon size={13} aria-hidden="true" />
      {value}
    </span>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">No matching records.</p>}
    </div>
  );
}
