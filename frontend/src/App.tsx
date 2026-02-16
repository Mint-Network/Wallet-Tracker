import { Routes, Route, Navigate } from "react-router-dom";
import AddressGeneratorPage from "./pages/AddressGeneratorPage";
import { DevToolsIndicator } from "./components/DevToolsIndicator";

export default function App() {
  return (
    <div className="app-container">
      <DevToolsIndicator />
      <Routes>
        <Route path="/" element={<Navigate to="/address-generator" />} />
        <Route path="/address-generator" element={<AddressGeneratorPage />} />
      </Routes>
    </div>
  );
}
