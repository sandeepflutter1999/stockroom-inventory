"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  LayoutDashboard,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import {
  createOrder,
  dateLabel,
  money,
  orderTotal,
  receiveOrder,
  seed,
  stockStatus,
  type Inventory,
  type Order,
} from "./inventory";

import { Badge, Table } from "./records";
import { DashboardSummary } from "./dashboard";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Sales", icon: ShoppingCart },
  { name: "Purchases", icon: ClipboardList },
  { name: "Stock", icon: Boxes },
  { name: "Reports", icon: ChartNoAxesCombined },
] as const;
type Section = (typeof navigation)[number]["name"];
type Report = "Stock" | "Sales" | "Purchases";
const descriptions: Record<Section, string> = {
  Dashboard: "A live overview of your inventory and order activity.",
  Sales: "Track customer orders and record new sales.",
  Purchases: "Manage supplier orders and receive incoming stock.",
  Stock: "Monitor quantities, reorder levels, and stock movement.",
  Reports: "Review and export inventory, sales, and purchase data.",
};
const storageKey = "stockroom-inventory-v2";

function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (value: string | number) => {
    const safe =
      typeof value === "string" && /^[\s]*[=+@-]/.test(value)
        ? "'" + value
        : String(value);
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const [data, setData] = useState(seed);
  const [section, setSection] = useState<Section>("Dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [report, setReport] = useState<Report>("Stock");
  const [history, setHistory] = useState(false);
  const [modal, setModal] = useState<Order["kind"] | null>(null);
  const [sku, setSku] = useState(seed.items[0].sku);
  const [rate, setRate] = useState(seed.items[0].price);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modal && dialogRef.current && !dialogRef.current.open)
      dialogRef.current.showModal();
  }, [modal]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setData(JSON.parse(saved));
    } catch {
      setNotice("Saved inventory could not be loaded.");
    }
    setReady(true);

    function syncInventory(event: StorageEvent) {
      if (event.key !== storageKey) return;
      try {
        setData(event.newValue ? JSON.parse(event.newValue) : seed);
      } catch {
        setNotice("Saved inventory could not be loaded.");
      }
    }

    window.addEventListener("storage", syncInventory);
    return () => window.removeEventListener("storage", syncInventory);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function commit(update: (latest: Inventory) => Inventory) {
    function save() {
      const saved = localStorage.getItem(storageKey);
      const latest = saved ? (JSON.parse(saved) as Inventory) : seed;
      const next = update(latest);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setData(next);
      return next !== latest;
    }

    return navigator.locks ? navigator.locks.request(storageKey, save) : save();
  }

  function navigate(next: Section) {
    setSection(next);
    setQuery("");
    setFilter("All");
    setHistory(false);
  }

  function openOrder(kind: Order["kind"]) {
    setSku(data.items[0].sku);
    setRate(data.items[0].price);
    setError("");
    setModal(kind);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || !ready || saving) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await commit((latest) =>
        createOrder(
          latest,
          {
            kind: modal,
            sku,
            rate,
            party: String(form.get("party")),
            quantity: Number(form.get("quantity")),
          },
          new Date().toISOString(),
        ),
      );
      setModal(null);
      setNotice(
        modal === "Sale"
          ? "Sale recorded. Stock updated."
          : "Purchase order created.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save the order.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function receive(id: string) {
    try {
      const changed = await commit((latest) =>
        receiveOrder(latest, id, new Date().toISOString()),
      );
      setNotice(
        changed
          ? `${id} received. Stock updated.`
          : `${id} was already received.`,
      );
    } catch {
      setNotice("Could not save the receipt.");
    }
  }

  const matches = (...values: string[]) =>
    values.join(" ").toLowerCase().includes(query.trim().toLowerCase());
  const itemName = (id: string) =>
    data.items.find((item) => item.sku === id)?.name ?? id;
  const orderMatches = (order: Order) =>
    matches(
      order.id,
      order.party,
      order.sku,
      itemName(order.sku),
      order.status,
    );
  const sales = data.orders.filter((order) => order.kind === "Sale");
  const purchases = data.orders.filter((order) => order.kind === "Purchase");

  const active = section === "Reports" ? report : section;
  const orders = (active === "Sales" ? sales : purchases).filter(
    (order) =>
      orderMatches(order) && (filter === "All" || filter === order.status),
  );
  const items = data.items.filter(
    (item) =>
      matches(item.name, item.sku, item.category) &&
      (filter === "All" || filter === stockStatus(item)),
  );
  const movementDate = (order: Order) => order.receivedAt ?? order.date;
  const movements = data.orders
    .filter(
      (order) =>
        order.status !== "Pending" &&
        orderMatches(order) &&
        (filter === "All" || filter === order.kind),
    )
    .sort((left, right) =>
      movementDate(right).localeCompare(movementDate(left)),
    );
  const recent = data.orders
    .filter(orderMatches)
    .sort((left, right) =>
      movementDate(right).localeCompare(movementDate(left)),
    )
    .slice(0, 5);

  const orderHeaders = [
    "Order",
    active === "Sales" ? "Customer" : "Supplier",
    "Item",
    "Qty",
    "Amount",
    "Ordered",
    "Status",
  ];
  const stockHeaders = [
    "Item",
    "SKU",
    "Category",
    "On hand",
    "Minimum",
    "Unit price",
    "Status",
  ];
  const orderValues = (order: Order) => [
    order.id,
    order.party,
    itemName(order.sku),
    order.quantity,
    order.quantity * order.rate,
    dateLabel(order.date),
    order.status,
  ];
  const stockValues = (item: (typeof items)[number]) => [
    item.name,
    item.sku,
    item.category,
    item.quantity,
    item.minimum,
    item.price,
    stockStatus(item),
  ];
  const filterOptions =
    section === "Dashboard"
      ? []
      : active === "Stock"
        ? history
          ? ["Sale", "Purchase"]
          : ["In stock", "Low stock", "Out of stock"]
        : active === "Purchases"
          ? ["Pending", "Received"]
          : ["Completed"];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">
            <Boxes size={22} />
          </span>
          <span>
            Stockroom<small>Inventory workspace</small>
          </span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => navigate(name)}
              aria-current={section === name ? "page" : undefined}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
        </nav>
        <div className="workspace">
          <span className="avatar">S</span>
          <span>
            Office Supplies<small>Demo workspace</small>
          </span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>{section}</strong>
          </span>
          <span className="demo">
            <span /> Sample data
          </span>
        </header>
        <div className="content" key={section}>
          <div className="page-heading">
            <div>
              <h1>
                {section === "Dashboard" ? "Inventory overview" : section}
              </h1>
              <p>{descriptions[section]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(section === "Dashboard" || section === "Purchases") && (
                <button
                  className={section === "Purchases" ? "primary" : "secondary"}
                  disabled={!ready}
                  onClick={() => openOrder("Purchase")}
                >
                  <Plus size={17} /> New purchase
                </button>
              )}
              {(section === "Dashboard" || section === "Sales") && (
                <button
                  className="primary"
                  disabled={!ready}
                  onClick={() => openOrder("Sale")}
                >
                  <Plus size={17} /> New sale
                </button>
              )}
              {section === "Reports" && (
                <button
                  className="primary"
                  onClick={() =>
                    exportCsv(
                      report.toLowerCase(),
                      report === "Stock" ? stockHeaders : orderHeaders,
                      report === "Stock"
                        ? items.map(stockValues)
                        : orders.map(orderValues),
                    )
                  }
                >
                  <Download size={17} /> Export CSV
                </button>
              )}
            </div>
          </div>

          {section === "Dashboard" && (
            <DashboardSummary
              items={data.items}
              sales={sales}
              purchases={purchases}
            />
          )}

          {section === "Reports" && (
            <div className="tabs" aria-label="Report type">
              {(["Stock", "Sales", "Purchases"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={report === value}
                  onClick={() => {
                    setReport(value);
                    setFilter("All");
                    setQuery("");
                  }}
                >
                  {value} report
                </button>
              ))}
            </div>
          )}
          {section === "Stock" && (
            <div className="tabs" aria-label="Stock view">
              {["Items", "Stock history"].map((label, index) => (
                <button
                  key={label}
                  aria-pressed={history === Boolean(index)}
                  onClick={() => {
                    setHistory(Boolean(index));
                    setFilter("All");
                    setQuery("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {section === "Reports" && (
            <div className="report-summary">
              <span>
                {active === "Stock"
                  ? `${items.length} items`
                  : `${orders.length} orders`}
              </span>
              <strong>
                {active === "Stock"
                  ? money(
                      items.reduce(
                        (sum, item) => sum + item.quantity * item.price,
                        0,
                      ),
                    )
                  : money(orderTotal(orders))}
              </strong>
              <span>
                {active === "Stock" ? "Retail stock value" : "Order total"}
              </span>
            </div>
          )}

          <section className="card records">
            <div className="panel-heading records-heading">
              <div>
                <h2>
                  {section === "Dashboard"
                    ? "Recent activity"
                    : history
                      ? "Stock movement"
                      : active === "Stock"
                        ? "Inventory items"
                        : active === "Sales"
                          ? "Sales orders"
                          : "Purchase orders"}
                </h2>
                <p>
                  {section === "Dashboard"
                    ? "Latest sales and supplier orders"
                    : history
                      ? "Completed sales and received purchases"
                      : "Search and filter your records"}
                </p>
              </div>
              <div className="tools">
                <label className="search">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search records…"
                    aria-label="Search records"
                  />
                </label>
                {filterOptions.length > 0 && (
                  <select
                    aria-label="Filter records"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option value="All">
                      All {history ? "types" : "statuses"}
                    </option>
                    {filterOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {section === "Dashboard" ? (
              <Table
                headers={[
                  "Activity",
                  "Customer / supplier",
                  "Date",
                  "Amount",
                  "Status",
                ]}
                rows={recent.map((order) => ({
                  key: order.id,
                  cells: [
                    <span key="activity" className="activity">
                      <span
                        className={`icon-tile ${order.kind === "Sale" ? "violet" : "mint"}`}
                      >
                        {order.kind === "Sale" ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownLeft size={16} />
                        )}
                      </span>
                      <span>
                        <strong>{order.id}</strong>
                        <small>{order.kind}</small>
                      </span>
                    </span>,
                    order.party,
                    dateLabel(movementDate(order)),
                    money(order.rate * order.quantity),
                    <Badge key="status" value={order.status} />,
                  ],
                }))}
              />
            ) : active === "Stock" && history ? (
              <Table
                headers={[
                  "Reference",
                  "Item",
                  "Movement",
                  "Quantity change",
                  "Date",
                ]}
                rows={movements.map((order) => ({
                  key: order.id,
                  cells: [
                    order.id,
                    itemName(order.sku),
                    order.kind,
                    `${order.kind === "Sale" ? "−" : "+"}${order.quantity}`,
                    dateLabel(movementDate(order)),
                  ],
                }))}
              />
            ) : active === "Stock" ? (
              <Table
                headers={stockHeaders}
                rows={items.map((item) => ({
                  key: item.sku,
                  cells: [
                    <strong key="name">{item.name}</strong>,
                    item.sku,
                    item.category,
                    item.quantity,
                    item.minimum,
                    money(item.price),
                    <Badge key="status" value={stockStatus(item)} />,
                  ],
                }))}
              />
            ) : (
              <Table
                headers={[
                  ...orderHeaders,
                  ...(section === "Purchases" ? ["Action"] : []),
                ]}
                rows={orders.map((order) => ({
                  key: order.id,
                  cells: [
                    <strong key="id">{order.id}</strong>,
                    order.party,
                    itemName(order.sku),
                    order.quantity,
                    money(order.rate * order.quantity),
                    dateLabel(order.date),
                    <Badge key="status" value={order.status} />,
                    ...(section === "Purchases"
                      ? [
                          order.status === "Pending" ? (
                            <button
                              key="receive"
                              className="secondary compact"
                              disabled={!ready}
                              onClick={() => receive(order.id)}
                            >
                              Receive
                            </button>
                          ) : (
                            "—"
                          ),
                        ]
                      : []),
                  ],
                }))}
              />
            )}
          </section>
        </div>
      </main>

      {modal && (
        <dialog
          ref={dialogRef}
          className="dialog"
          aria-labelledby="order-title"
          onCancel={() => setModal(null)}
        >
          <form className="card dialog-content" onSubmit={submitOrder}>
            <div className="flex justify-between gap-4">
              <div>
                <h2 id="order-title">New {modal.toLowerCase()}</h2>
                <p>
                  {modal === "Sale"
                    ? "Stock updates when you record the sale."
                    : "Stock updates when you receive the order."}
                </p>
              </div>
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={() => setModal(null)}
              >
                <X size={21} />
              </button>
            </div>
            <label>
              {modal === "Sale" ? "Customer" : "Supplier"}
              <input name="party" autoFocus required maxLength={100} />
            </label>
            <label>
              Item
              <select
                value={sku}
                onChange={(event) => {
                  setSku(event.target.value);
                  setRate(
                    data.items.find((item) => item.sku === event.target.value)!
                      .price,
                  );
                }}
              >
                {data.items.map((item) => (
                  <option key={item.sku} value={item.sku}>
                    {item.name} · {item.quantity} available
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                Quantity
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  max={
                    modal === "Sale"
                      ? data.items.find((item) => item.sku === sku)?.quantity
                      : 1000000
                  }
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                Unit price (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={Number.isNaN(rate) ? "" : rate}
                  onChange={(event) => setRate(event.target.valueAsNumber)}
                  required
                />
              </label>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className="primary" type="submit" disabled={saving}>
                {modal === "Sale" ? "Record sale" : "Create purchase"}
              </button>
            </div>
          </form>
        </dialog>
      )}
      {notice && (
        <div className="toast" role="status">
          <Activity size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}
