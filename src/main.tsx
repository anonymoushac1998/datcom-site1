import { StrictMode, Suspense, lazy } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

const AdminApp = lazy(() => import("./admin/AdminApp.tsx"))
const isAdmin = location.pathname.replace(/\/+$/, "") === "/admin" || location.pathname.startsWith("/admin/")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
