export type Item = {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
  price: number;
};
export type Order = {
  id: string;
  kind: "Sale" | "Purchase";
  party: string;
  sku: string;
  quantity: number;
  rate: number;
  date: string;
  receivedAt?: string;
  status: "Completed" | "Pending" | "Received";
};
export type Inventory = { items: Item[]; orders: Order[] };
export type OrderInput = Pick<
  Order,
  "kind" | "party" | "sku" | "quantity" | "rate"
>;

export const seed: Inventory = {
  items: [
    {
      sku: "DSK-001",
      name: "LED Desk Lamp, 7 W",
      category: "Lighting",
      quantity: 42,
      minimum: 10,
      price: 1290,
    },
    {
      sku: "DSK-002",
      name: "Three-Tier A4 Document Tray",
      category: "Accessories",
      quantity: 8,
      minimum: 12,
      price: 649,
    },
    {
      sku: "DSK-003",
      name: "Aluminium Laptop Stand, 11–16 in",
      category: "Accessories",
      quantity: 31,
      minimum: 8,
      price: 1390,
    },
    {
      sku: "DSK-004",
      name: "Desk Mat, 60 × 30 cm",
      category: "Accessories",
      quantity: 5,
      minimum: 10,
      price: 499,
    },
    {
      sku: "DSK-005",
      name: "Mesh Task Chair",
      category: "Furniture",
      quantity: 16,
      minimum: 5,
      price: 5490,
    },
    {
      sku: "DSK-006",
      name: "Cable Ties, Pack of 10",
      category: "Cable management",
      quantity: 0,
      minimum: 6,
      price: 149,
    },
  ],
  orders: [
    {
      id: "SO-1048",
      kind: "Sale",
      party: "Brar & Associates",
      sku: "DSK-001",
      quantity: 4,
      rate: 1290,
      date: "2026-11-23T04:30:00.000Z",
      status: "Completed",
    },
    {
      id: "PO-1047",
      kind: "Purchase",
      party: "Malwa Computer Accessories",
      sku: "DSK-003",
      quantity: 12,
      rate: 850,
      date: "2026-11-22T05:30:00.000Z",
      receivedAt: "2026-11-23T04:00:00.000Z",
      status: "Received",
    },
    {
      id: "SO-1046",
      kind: "Sale",
      party: "Chandigarh Design Office",
      sku: "DSK-004",
      quantity: 6,
      rate: 499,
      date: "2026-11-21T06:30:00.000Z",
      status: "Completed",
    },
    {
      id: "PO-1045",
      kind: "Purchase",
      party: "Ludhiana Stationery Wholesale",
      sku: "DSK-002",
      quantity: 24,
      rate: 410,
      date: "2026-11-20T06:30:00.000Z",
      status: "Pending",
    },
    {
      id: "SO-1044",
      kind: "Sale",
      party: "Sector 34 Training Centre",
      sku: "DSK-005",
      quantity: 2,
      rate: 5490,
      date: "2026-11-19T06:30:00.000Z",
      status: "Completed",
    },
    {
      id: "PO-1043",
      kind: "Purchase",
      party: "Ludhiana Stationery Wholesale",
      sku: "DSK-006",
      quantity: 30,
      rate: 82,
      date: "2026-11-18T06:30:00.000Z",
      status: "Pending",
    },
  ],
};

export const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));

export function stockStatus(item: Item) {
  if (item.quantity === 0) return "Out of stock";
  return item.quantity <= item.minimum ? "Low stock" : "In stock";
}

export function createOrder(
  data: Inventory,
  input: OrderInput,
  date: string,
): Inventory {
  const item = data.items.find(({ sku }) => sku === input.sku);
  if (!item || !input.party.trim())
    throw new Error("Choose an item and enter a name.");
  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity < 1 ||
    !Number.isFinite(input.rate) ||
    input.rate < 0
  ) {
    throw new Error("Enter a positive whole quantity and a valid unit price.");
  }
  if (input.kind === "Sale" && input.quantity > item.quantity) {
    throw new Error(
      `Only ${item.quantity} units of ${item.name} are available.`,
    );
  }
  const sequence =
    Math.max(
      1048,
      ...data.orders.map((order) => Number(order.id.split("-")[1])),
    ) + 1;
  const order: Order = {
    ...input,
    party: input.party.trim(),
    id: `${input.kind === "Sale" ? "SO" : "PO"}-${sequence}`,
    date,
    status: input.kind === "Sale" ? "Completed" : "Pending",
  };
  return {
    items:
      order.kind === "Sale"
        ? data.items.map((row) =>
            row.sku === order.sku
              ? { ...row, quantity: row.quantity - order.quantity }
              : row,
          )
        : data.items,
    orders: [order, ...data.orders],
  };
}

export function receiveOrder(
  data: Inventory,
  id: string,
  date: string,
): Inventory {
  const order = data.orders.find((row) => row.id === id);
  if (!order || order.kind !== "Purchase" || order.status !== "Pending")
    return data;
  return {
    items: data.items.map((item) =>
      item.sku === order.sku
        ? { ...item, quantity: item.quantity + order.quantity }
        : item,
    ),
    orders: data.orders.map((row) =>
      row.id === id ? { ...row, status: "Received", receivedAt: date } : row,
    ),
  };
}

export function orderTotal(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.quantity * order.rate, 0);
}
