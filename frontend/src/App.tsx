import { Link, Route, Routes } from "react-router-dom";

import { EditorPage } from "./pages/EditorPage";
import { UploadPage } from "./pages/UploadPage";
import { VerifyPage } from "./pages/VerifyPage";

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">XML Template Mapper</Link>
        <nav>
          <Link to="/">Create</Link>
          <Link to="/verify">Verify</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Routes>
      </main>
    </div>
  );
}
