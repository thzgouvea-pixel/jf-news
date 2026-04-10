import { BORDER, SANS } from '../lib/constants';

export default function Skeleton() {
  return (
    <div>
      {[...Array(4)].map(function(_, i) {
        return (
          <div key={i} style={{ padding: "22px 0", borderBottom: "1px solid " + BORDER, animation: "pulse 1.8s ease-in-out infinite", animationDelay: (i * .12) + "s" }}>
            <div style={{ height: 12, width: 70, background: "#f0f0f0", borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 16, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} />
          </div>
        );
      })}
    </div>
  );
}
