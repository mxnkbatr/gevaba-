import React from "react";

export default function SkeletonCard() {
  return (
    <div className="card mb-4" style={{ padding: "16px", display: "flex", gap: "14px" }}>
      <div className="skeleton" style={{ width: "72px", height: "72px", borderRadius: "22px", flexShrink: 0 }}></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="skeleton" style={{ height: "17px", width: "60%", borderRadius: "6px" }}></div>
        <div className="skeleton" style={{ height: "12px", width: "40%", borderRadius: "6px" }}></div>
        <div className="skeleton" style={{ height: "10px", width: "80%", borderRadius: "6px", marginTop: "4px" }}></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
        <div className="skeleton" style={{ height: "20px", width: "52px", borderRadius: "6px" }}></div>
        <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "16px" }}></div>
      </div>
    </div>
  );
}

export function SkeletonMonkList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ padding: "0 16px", display: "flex", gap: "12px", overflow: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: "166px", height: "240px", borderRadius: "20px", flexShrink: 0 }} />
      ))}
    </div>
  );
}

export function SkeletonBlogList({ count = 1 }: { count?: number }) {
  return (
    <div style={{ margin: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "20px" }} />
      ))}
    </div>
  );
}
