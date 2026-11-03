import { useEffect, useState } from "react";

import { useAppContext } from "./context/AppContext.jsx";

import {
  FineDrawer,
  ReviewModal,
} from "./components/FinePanels.jsx";

import { Layout } from "./components/Layout.jsx";

import {
  LoadingPage,
  Toast,
} from "./components/ui.jsx";

import { authService } from "./services/authService.js";
import { finesService } from "./services/finesService.js";

import { DashboardPage } from "./pages/DashboardPage.jsx";
import { FinesDetailsPage } from "./pages/FinesDetailsPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignUpPage } from "./pages/SignUpPage.jsx";

import { can } from "./services/permissions.js";

export default function App() {
  const [user, setUser] = useState(() =>
    authService.getCurrentUser()
  );

  const [authPage, setAuthPage] = useState("login");
  const [authNotice, setAuthNotice] = useState("");
  const [page, setPage] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navFilters, setNavFilters] = useState({});

  const {
    selectedFine,
    setSelectedFine,
    setFinesFilters,
  } = useAppContext();

  const [history, setHistory] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [toast, setToast] = useState(null);

  // Load one unfiltered source dataset. Each page applies its own filters,
  // so Fines Details filters cannot accidentally hide dashboard records.
  useEffect(() => {
    let active = true;

    if (!user) {
      setRecords([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    finesService
      .list({})
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch((error) => {
        console.error("Fines loading error:", error);
        if (active) {
          setToast({
            message: "Unable to load fine records. Please try again.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openFine = async (fine, review = false) => {
    setSelectedFine(fine);
    try {
      setHistory(await finesService.reviews(fine.fineId));
    } catch (error) {
      console.error("Fine review history error:", error);
      setHistory([]);
    }

    if (review && user && can(user.role, "fine:review")) {
      setReviewing(fine);
    }
  };

  const saveReview = async (request) => {
    if (!reviewing) return;

    if (!user || !can(user.role, "fine:review")) {
      throw new Error("unauthorized");
    }

    const updated = await finesService.review(reviewing.fineId, request);

    setRecords((all) =>
      all.map((fine) =>
        fine.fineId === updated.fineId ? updated : fine
      )
    );

    setSelectedFine(updated);
    setReviewing(null);
    setToast({ message: "Fine review saved successfully." });
  };

  const navigateFines = (filters) => {
    setNavFilters(filters);
    setFinesFilters(filters);
    setPage("fines");
  };

  const handleLogout = () => {
    authService.signOut();
    setUser(null);
    setRecords([]);
    setPage("dashboard");
    setSelectedFine(null);
    setHistory([]);
    setReviewing(null);
  };

  if (!user) {
    if (authPage === "signup") {
      return (
        <SignUpPage
          onSignIn={(message) => {
            setAuthNotice(message ?? "");
            setAuthPage("login");
          }}
        />
      );
    }

    return (
      <LoginPage
        notice={authNotice}
        onSignUp={() => {
          setAuthNotice("");
          setAuthPage("signup");
        }}
        onLogin={setUser}
      />
    );
  }

  return (
    <Layout
      page={page}
      user={user}
      onLogout={handleLogout}
      onNavigate={setPage}
    >
      {loading && !records.length ? (
        <LoadingPage />
      ) : page === "dashboard" ? (
        <DashboardPage
          records={records}
          onNavigateFines={navigateFines}
        />
      ) : (
        <FinesDetailsPage
          records={records}
          role={user.role}
          initialFilters={navFilters}
          onOpen={openFine}
        />
      )}

      {selectedFine && (
        <FineDrawer
          fine={selectedFine}
          role={user.role}
          history={history}
          onClose={() => setSelectedFine(null)}
          onReview={() => setReviewing(selectedFine)}
        />
      )}

      {reviewing && (
        <ReviewModal
          fine={reviewing}
          role={user.role}
          onClose={() => setReviewing(null)}
          onSave={saveReview}
        />
      )}

      {toast && (
        <Toast
          {...toast}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}
