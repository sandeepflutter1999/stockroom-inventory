import type { ReactNode } from "react";

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`badge ${["Low stock", "Pending"].includes(value) || value.endsWith(" left") ? "amber" : value === "Out of stock" ? "red" : "green"}`}
    >
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
