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
      <table role="table">
        <thead role="rowgroup">
          <tr role="row">
            {headers.map((header) => (
              <th key={header} scope="col" role="columnheader">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={row.key} role="row">
              {row.cells.map((cell, index) => (
                <td key={index} role="cell">
                  <span className="record-cell-label" aria-hidden="true">
                    {headers[index]}
                  </span>
                  <div className="record-cell-value">{cell}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">No matching records.</p>}
    </div>
  );
}
