import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";

const dashboardLayout = () => {
  return (
    <>
      <h3>Dashboard </h3>

      <nav>
        <Link to="summary"> summary </Link>
        <Link to="analytics"> analytics </Link>
      </nav>
      <Outlet />
    </>
  );
};
export default dashboardLayout;
