import { logs } from "../data/logs";

const Dashboard = () => {
  const totalCarbon = logs.reduce((acc, log) => acc + log.carbon, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0fdf4",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            marginBottom: "1.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#065f46",
              marginBottom: "0.4rem",
            }}
          >
            Carbon Dashboard
          </h1>
          <p
            style={{
              color: "#047857",
              fontSize: "0.95rem",
            }}
          >
            Overview of your daily environmental impact 
          </p>
        </div>

        {/* Stats Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "2rem",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "0.4rem",
              }}
            >
              Total Carbon Footprint
            </p>

            <p
              style={{
                fontSize: "3rem",
                fontWeight: "800",
                color: "#16a34a",
              }}
            >
              {totalCarbon}
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginLeft: "0.5rem",
                }}
              >
                kg CO₂
              </span>
            </p>
          </div>

          {/* Visual Indicator */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background:
                totalCarbon > 15
                  ? "#fee2e2"
                  : totalCarbon > 8
                    ? "#fef3c7"
                    : "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "700",
              color:
                totalCarbon > 15
                  ? "#dc2626"
                  : totalCarbon > 8
                    ? "#d97706"
                    : "#15803d",
            }}
          >
            {totalCarbon > 15
              ? "High"
              : totalCarbon > 8
                ? "Medium"
                : "Low"}
          </div>
        </div>

        {/* Footer Note */}
        <p
          style={{
            marginTop: "1.2rem",
            fontSize: "0.85rem",
            color: "#6b7280",
          }}
        >
          Tip: Reduce travel emissions and switch to renewable energy to lower
          your footprint
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
