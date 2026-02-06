import { Routes, Route, Navigate } from "react-router-dom";
import AddressGeneratorPage from "./pages/AddressGeneratorPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/address-generator" />} />
      <Route path="/address-generator" element={<AddressGeneratorPage />} />
    </Routes>
  );
}
