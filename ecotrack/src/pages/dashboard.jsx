import { logs } from "../data/logs";

const Dashboard = () => {
  const totalCarbon = logs.reduce((sum, log) => sum + log.carbon, 0);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total Carbon Footprint: {totalCarbon} Kgs</p>

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            {log.activity} = {log.carbon} Kg
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
