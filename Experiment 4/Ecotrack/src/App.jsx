import { useState, useMemo, useCallback } from "react";

function expensiveCalculation(num) {
  console.log("Calculating...");
  for (let i = 0; i < 1e9; i++) {} // heavy computation
  return num * 2;
}

function App() {
  const [count, setCount] = useState(0);
  const [dark, setDark] = useState(false);

  const total = useMemo(() => {
    return expensiveCalculation(count);
  }, [count]);

  const handleIncrement = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${dark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 w-96 text-center">
        <h1 className="text-2xl font-bold mb-6">
          React.memo + useMemo + useCallback
        </h1>

        <button
          onClick={() => setDark(!dark)}
          className="mb-4 px-4 py-2 rounded-lg font-medium transition
          bg-indigo-500 text-white hover:bg-indigo-600"
        >
          Toggle Theme
        </button>

        <div className="space-y-2 text-lg">
          <p>
            Count: <span className="font-semibold">{count}</span>
          </p>
          <p>
            Total: <span className="font-semibold">{total}</span>
          </p>
          <p>
            Theme:{" "}
            <span className="font-semibold">
              {dark ? "Dark" : "Light"}
            </span>
          </p>
        </div>

        <button
          onClick={handleIncrement}
          className="mt-6 w-full px-4 py-2 rounded-lg font-semibold
          bg-green-500 text-white hover:bg-green-600 transition"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default App;
