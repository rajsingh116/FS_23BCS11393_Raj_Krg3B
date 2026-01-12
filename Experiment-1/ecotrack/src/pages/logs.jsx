import { logs } from "../data/logs";

export const Logs = () => {
  const highcarbon = logs.filter(log => log.carbon > 4);

  return (
    <div>
      <h2>Daily Logs (High Carbon)</h2>

      <ul>
        {highcarbon.map(log => (
          <li
            key={log.id}
            style={{ color: "red" }} 
          >
            {log.activity} = {log.carbon} Kg
          </li>
        ))}
      </ul>
    </div>
  );
};

export const LowCarbon = () => {
  const lowcarbon = logs.filter(log => log.carbon < 3 && log.carbon>0);

  return (
    <div>
      <h2>Low Carbon Logs</h2>

      <ul>
        {lowcarbon.map(log => (
          <li
            key={log.id}
            style={{ color: "lightgreen" }} 
          >
            {log.activity} = {log.carbon} Kg
          </li>
        ))}
      </ul>
    </div>
  );
};
