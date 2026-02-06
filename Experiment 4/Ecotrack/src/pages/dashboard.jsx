import { logs } from "../data/logs";

const Dashboard = () => {
  const totalCarbon = logs.reduce((acc, log) => acc + log.carbon, 0);

  return (

    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-6">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🌍 Carbon Dashboard
        </h1>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Total Carbon Footprint</p>

          <p className="text-4xl font-extrabold text-emerald-600">
            {totalCarbon}
            <span className="text-lg font-medium text-gray-600 ml-2">
              kg CO₂
            </span>
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Track your environmental impact in real time 🌱
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
