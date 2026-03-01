import { logs } from "../data/logs";
import { useDispatch } from "react-redux";
import {useEffect} from "react";


export const Logs = () => {
  const dispatch = useDispatch();
  const {data, status, error} = useSelector((state) => state.logs);
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchLogs());
    }
  }, [status, dispatch]);
  if (status === 'loading') {
    return <div>Loading...</div>;
  } else if (status === 'failed') {
    return <div>Error: {error}</div>;
  }
  const highcarbon = data.filter(log => log.carbon > 4);

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
  const lowcarbon = data.filter(log => log.carbon < 3 && log.carbon > 0);

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
