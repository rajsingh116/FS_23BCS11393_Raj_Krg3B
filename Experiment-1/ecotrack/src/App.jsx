import React from "react";
import Header from "./components/Header";
import Dashboard from "./pages/dashboard";
import {Logs,LowCarbon} from "./pages/Logs";

const App = () => {
  return (
    <>
      <Header title="Ecotrack-experiment-1" />

      <main style={{ padding: "1rem" }}>
        <Dashboard />
        <Logs />
        <LowCarbon />
      </main>
    </>
  );
};

export default App;
