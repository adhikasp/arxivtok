import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
      <>
          <Router
              root={(props) => (
                  <>
                      <Suspense>
                          {props.children}

                          <Toaster
                              position="bottom-center"
                              closeButton
                              richColors
                          />
                      </Suspense>
                  </>
              )}
          >
              <FileRoutes />
          </Router>
      </>
  );
}
