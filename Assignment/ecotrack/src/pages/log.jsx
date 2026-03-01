import { logs } from "../data/logs.js";

const Log = () => {
  const filteredLogs = logs.filter((log) => log.carbon > 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0fdf4",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#065f46",
              marginBottom: "0.4rem",
            }}
          >
            Activity Logs
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#047857",
            }}
          >
            Detailed breakdown of activities with carbon impact 
          </p>
        </div>

        {/* Logs Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.9rem 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {/* Activity */}
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  color: "#1f2933",
                }}
              >
                {log.activity}
              </span>

              {/* Carbon Badge */}
              <span
                style={{
                  padding: "0.3rem 0.9rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  backgroundColor:
                    log.carbon > 6
                      ? "#fee2e2"
                      : log.carbon > 3
                      ? "#fef3c7"
                      : "#dcfce7",
                  color:
                    log.carbon > 6
                      ? "#dc2626"
                      : log.carbon > 3
                      ? "#d97706"
                      : "#15803d",
                }}
              >
                {log.carbon} kg CO₂
              </span>
            </div>
          ))}
        </div>

        {/* Footer Hint */}
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: "#6b7280",
          }}
        >
          Tip: Prefer low-carbon activities like cycling and public transport to
          reduce emissions 
        </p>
      </div>
    </div>
  );
};

export default Log;
