import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLogs } from "../store/logSlice";

const Log = () => {
  const dispatch = useDispatch();

  const data = useSelector((state) => state.logs.data);
  const status = useSelector((state) => state.logs.status);
  const error = useSelector((state) => state.logs.error);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchLogs());
    }
  }, [dispatch, status]);

  if (status === "loading") {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (status === "failed") {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  const filteredLogs = data.filter((log) => log.carbon > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🌱 Activity Logs
        </h1>

        <ul className="space-y-4">
          {filteredLogs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:shadow-md transition"
            >
              <span className="text-gray-700 font-medium">
                {log.activity}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  log.carbon >= 4
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {log.carbon} kg CO₂
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Log;
