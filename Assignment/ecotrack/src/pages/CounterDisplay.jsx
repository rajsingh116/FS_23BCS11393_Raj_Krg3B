import React from "react";

const CounterDisplay = React.memo(({ count, goal }) => {
  const progress = Math.min((count / goal) * 100, 100);

  return (
    <div style={styles.container}>
      <h3 style={styles.text}>
        {count} / {goal} glasses completed
      </h3>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
          }}
        />
      </div>

      {count >= goal && (
        <p style={styles.goalMessage}>🎉 Goal Reached!</p>
      )}
    </div>
  );
});

const styles = {
  container: {
    marginBottom: "1rem",
    textAlign: "center",
  },
  text: {
    marginBottom: "0.5rem",
    fontWeight: "600",
  },
  progressBar: {
    width: "100%",
    height: "10px",
    backgroundColor: "#e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  goalMessage: {
    marginTop: "0.6rem",
    color: "green",
    fontWeight: "600",
  },
};

export default CounterDisplay;