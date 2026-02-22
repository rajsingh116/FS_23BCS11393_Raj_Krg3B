import React, { useState } from "react";
import "./tracker.css";

function Tracker() {
  const [activities, setActivities] = useState([]);
  const [input, setInput] = useState("");

  const addActivity = () => {
    if (input.trim() === "") return;
    setActivities([...activities, input]);
    setInput("");
  };

  const deleteActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setActivities(updated);
  };

  return (
    <div className="tracker-card">
      <h2>🌿 EcoTrack</h2>

      <div className="input-row">
        <input
          type="text"
          placeholder="Enter eco activity..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={addActivity}>Add</button>
      </div>

      <p className="count">Total Activities: {activities.length}</p>

      <ul>
        {activities.map((act, index) => (
          <li key={index}>
            {act}
            <button
              className="delete-btn"
              onClick={() => deleteActivity(index)}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tracker;