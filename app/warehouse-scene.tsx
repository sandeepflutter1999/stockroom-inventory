const cartons = [
  { x: -75, y: 23, z: -15, color: "blue" },
  { x: -25, y: 23, z: -15, color: "paper" },
  { x: 26, y: 23, z: -15, color: "blue" },
  { x: -75, y: -29, z: -15, color: "paper" },
  { x: -25, y: -29, z: -15, color: "blue" },
  { x: 26, y: -29, z: -15, color: "paper" },
  { x: 26, y: -81, z: -15, color: "blue" },
  { x: -25, y: -81, z: -15, color: "paper" },
  { x: 66, y: 70, z: 69, color: "paper" },
  { x: 17, y: 70, z: 83, color: "blue" },
] as const;

export function WarehouseScene() {
  return (
    <div className="warehouse-visual" aria-hidden="true">
      <div className="warehouse-stage">
        <div className="warehouse-floor" />
        {[-82, 83].map((x) =>
          [-40, 40].map((z) => (
            <div
              className="warehouse-post"
              key={`${x}-${z}`}
              style={{ transform: `translate3d(${x}px, 0, ${z}px)` }}
            />
          )),
        )}
        {[-56, -4, 48].map((y) => (
          <div
            className="warehouse-shelf"
            key={y}
            style={{ transform: `translateY(${y}px) rotateX(90deg)` }}
          />
        ))}
        {cartons.map(({ x, y, z, color }) => (
          <div
            className={`warehouse-carton warehouse-carton-${color}`}
            key={`${x}-${y}-${z}`}
            style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}
          >
            <span className="carton-front" />
            <span className="carton-right" />
            <span className="carton-left" />
            <span className="carton-top" />
            <span className="carton-bottom" />
            <span className="carton-back" />
          </div>
        ))}
      </div>
    </div>
  );
}
