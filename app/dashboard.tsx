import {
  CircleAlert,
  ClipboardList,
  Package,
  ShoppingCart,
} from "lucide-react";
import {
  money,
  orderTotal,
  stockStatus,
  type Item,
  type Order,
} from "./inventory";
import { Badge } from "./records";

export function DashboardSummary({
  items,
  sales,
  purchases,
}: {
  items: Item[];
  sales: Order[];
  purchases: Order[];
}) {
  const low = items.filter((item) => stockStatus(item) !== "In stock");
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const metrics = [
    {
      name: "Units in stock",
      value: count,
      detail: `${items.length} tracked SKUs`,
      icon: Package,
      color: "violet",
    },
    {
      name: "Sales revenue",
      value: money(orderTotal(sales)),
      detail: `${sales.length} completed orders`,
      icon: ShoppingCart,
      color: "mint",
    },
    {
      name: "Purchase orders",
      value: purchases.length,
      detail: `${purchases.filter((order) => order.status === "Pending").length} awaiting receipt`,
      icon: ClipboardList,
      color: "blue",
    },
    {
      name: "Stock alerts",
      value: low.length,
      detail: "At or below minimum",
      icon: CircleAlert,
      color: "orange",
    },
  ];

  return (
    <>
      <div className="metrics">
        {metrics.map(({ name, value, detail, icon: Icon, color }) => (
          <article className="card metric" key={name}>
            <div className={`icon-tile ${color}`}>
              <Icon size={19} />
            </div>
            <p>{name}</p>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>

      <div className="overview">
        <section className="card">
          <div className="panel-heading">
            <div>
              <h2>Stock by category</h2>
              <p>Units on hand across the catalog</p>
            </div>
            <Package size={19} />
          </div>
          <div className="bars">
            {[...new Set(items.map((item) => item.category))].map(
              (category) => {
                const units = items
                  .filter((item) => item.category === category)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div className="bar-group" key={category}>
                    <div>
                      <span>{category}</span>
                      <strong>{units} units</strong>
                    </div>
                    <div className="track">
                      <div
                        style={{
                          width: `${count ? (units / count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>
        <section className="card">
          <div className="panel-heading">
            <div>
              <h2>Low stock alerts</h2>
              <p>Items that need replenishment</p>
            </div>
            <span className="alert-count">{low.length} items</span>
          </div>
          <div className="alert-list">
            {low.length ? (
              low.map((item) => (
                <div className="alert-row" key={item.sku}>
                  <span className="icon-tile orange">
                    <Package size={16} />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.sku} · Min {item.minimum}
                    </small>
                  </div>
                  <Badge
                    value={
                      item.quantity ? `${item.quantity} left` : "Out of stock"
                    }
                  />
                </div>
              ))
            ) : (
              <p className="empty">All items are above their minimum levels.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
