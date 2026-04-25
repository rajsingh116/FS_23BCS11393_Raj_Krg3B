import React, { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email) {
      alert("Both fields are required!");
      return;
    }

    console.log("Patient Name:", name);
    console.log("Email:", email);

    setName("");
    setEmail("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Patient Form</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Patient Name:</label><br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button style={{ marginTop: "10px" }} type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default App;