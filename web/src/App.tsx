import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./pages/Layout";
import ListaRestorana from "./pages/ListaRestorana";
import DetaljiRestorana from "./pages/DetaljiRestorana";
import Login from "./pages/Login";
import Registracija from "./pages/Registracija";
import MojeRezervacije from "./pages/MojeRezervacije";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ListaRestorana />} />
            <Route path="restoran/:id" element={<DetaljiRestorana />} />
            <Route path="prijava" element={<Login />} />
            <Route path="registracija" element={<Registracija />} />
            <Route path="moje-rezervacije" element={<MojeRezervacije />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
