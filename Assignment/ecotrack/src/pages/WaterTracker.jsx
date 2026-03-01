import { useState, useEffect, useCallback } from "react";
import CounterDisplay from "./CounterDisplay";

const WaterTracker = () => {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(8);
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved value
  useEffect(() => {
    const saved = localStorage.getItem("waterCount");
    if (saved) setCount(Number(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("waterCount", count);
  }, [count]);

  const addWater = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const removeWater = useCallback(() => {
    setCount((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const reset = () => {
    setCount(0);
  };

  const fetchTip = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://api.adviceslip.com/advice");
      const data = await res.json();
      setTip(data.slip.advice);
    } catch {
      setError("Failed to fetch tip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>💧 Daily Water Tracker</h2>

        <CounterDisplay count={count} goal={goal} />

        <div style={styles.buttonGroup}>
          <button style={styles.primaryBtn} onClick={addWater}>
            + Add
          </button>
          <button style={styles.secondaryBtn} onClick={removeWater}>
            − Remove
          </button>
          <button style={styles.resetBtn} onClick={reset}>
            Reset
          </button>
        </div>

        <div style={styles.goalSection}>
          <label style={{ fontWeight: "500" }}>Set Daily Goal:</label>
          <input
            type="number"
            value={goal}
            min="1"
            onChange={(e) => setGoal(Number(e.target.value))}
            style={styles.input}
          />
        </div>

        <button style={styles.tipBtn} onClick={fetchTip}>
          Get Health Tip
        </button>

        {loading && <p style={styles.info}>Loading...</p>}
        {error && <p style={styles.error}>{error}</p>}
        {tip && (
          <p style={styles.tip}>
            <strong>Today’s Health Tip:</strong> {tip}
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "90vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.2rem",
  },
  primaryBtn: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "0.5rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryBtn: {
    backgroundColor: "#64748b",
    color: "white",
    border: "none",
    padding: "0.5rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  resetBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.5rem 0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  goalSection: {
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    width: "60px",
    padding: "4px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  tipBtn: {
    width: "100%",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "0.6rem",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "0.8rem",
  },
  info: {
    color: "#2563eb",
    fontSize: "0.9rem",
  },
  error: {
    color: "red",
    fontSize: "0.9rem",
  },
  tip: {
    backgroundColor: "#f0fdf4",
    padding: "0.6rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
};

export default WaterTracker;