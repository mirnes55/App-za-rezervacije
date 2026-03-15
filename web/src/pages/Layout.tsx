import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout, loading } = useAuth();

  return (
    <>
      <nav className="nav">
        <Link to="/">Restorani</Link>
        {user && (
          <>
            <Link to="/moje-rezervacije">Moje rezervacije</Link>
            {user.role === "VLASNIK" && <Link to="/dashboard">Dashboard</Link>}
            <span className="user">
              {user.ime} {user.prezime}
            </span>
            <button type="button" onClick={logout}>
              Odjava
            </button>
          </>
        )}
        {!loading && !user && (
          <>
            <Link to="/prijava">Prijava</Link>
            <Link to="/registracija">Registracija</Link>
          </>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
