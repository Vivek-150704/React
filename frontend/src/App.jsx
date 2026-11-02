import { useEffect, useState } from "react";

import { useAppContext } from "./context/AppContext.jsx";

import {
  FineDrawer,
  ExportModal,
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

import { shortDate } from "./utils/fines.js";
import { can } from "./services/permissions.js";

export default function App() {
  const [user, setUser] = useState(() =>
    authService.getCurrentUser()
  );

  const [authPage, setAuthPage] =
    useState("login");

  const [authNotice, setAuthNotice] =
    useState("");

  const [page, setPage] =
    useState("dashboard");

  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [navFilters, setNavFilters] =
    useState({});

  const {
    selectedFine,
    setSelectedFine,
    finesFilters,
  } = useAppContext();

  const [history, setHistory] =
    useState([]);

  const [reviewing, setReviewing] =
    useState(null);

  const [exportState, setExportState] =
    useState(null);

  const [toast, setToast] =
    useState(null);

  useEffect(() => {
    let active = true;

    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    finesService
      .list(finesFilters)
      .then((data) => {
        if (active) {
          setRecords(data);
        }
      })
      .catch((error) => {
        console.error(
          "Fines loading error:",
          error
        );

        if (active) {
          setToast({
            message:
              "Unable to load fine records. Please try again.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, finesFilters]);

  useEffect(() => {
  let active = true;

  if (!user) {
    return;
  }

  finesService
    .list(finesFilters)
    .then((data) => {
      if (active) {
        setRecords(data);
      }
    })
    .catch(console.error);

  return () => {
    active = false;
  };
}, [user, finesFilters]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = async () => {
    setLoading(true);

    try {
      const data =
        await finesService.refresh(
          finesFilters
        );

      setRecords(data);

      setToast({
        message:
          "Fine records refreshed successfully.",
      });
    } catch (error) {
      console.error(
        "Refresh error:",
        error
      );

      setToast({
        message:
          "Unable to load fine records.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const openFine = (
    fine,
    review = false
  ) => {
    setSelectedFine(fine);

    if (
      review &&
      user &&
      can(
        user.role,
        "fine:review"
      )
    ) {
      setReviewing(fine);
    }
  };

  const saveReview = async (
    request
  ) => {
    if (!reviewing) return;

    if (
      !user ||
      !can(
        user.role,
        "fine:review"
      )
    ) {
      throw new Error(
        "unauthorized"
      );
    }

    const updated =
      await finesService.review(
        reviewing.fineId,
        request
      );

    setRecords((all) =>
      all.map((fine) =>
        fine.fineId ===
        updated.fineId
          ? updated
          : fine
      )
    );

    setSelectedFine(updated);

    setReviewing(null);

    setToast({
      message:
        "Fine review saved successfully.",
    });
  };

  const navigateFines = (
    filters
  ) => {
    setNavFilters(filters);
    setPage("fines");
  };

  const exportWorkbook =
    async () => {
      if (!exportState)
        return;

      try {
        const XLSX =
          await import(
            "xlsx"
          );

        const rows =
          exportState.records.map(
            (fine) => ({
              "Fine ID":
                fine.fineId,
              "Customer ID":
                fine.customerId,
              Customer:
                fine.customerName,
              "Order Reference":
                fine.orderReference,
              "Fine Date":
                fine.fineDate
                  ? new Date(
                      fine.fineDate
                    )
                  : "",
              "Fine Amount":
                fine.fineAmount,
              Currency:
                fine.currencyCode,
              "Fine Reason":
                fine.reasonCategory,
              Status:
                fine.status,
            })
          );

        const sheet =
          XLSX.utils.json_to_sheet(
            rows
          );

        const book =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          book,
          sheet,
          "Fine Records"
        );

        XLSX.writeFile(
          book,
          `fines_export_${new Date()
            .toISOString()
            .slice(
              0,
              10
            )}.xlsx`
        );

        setExportState(null);

        setToast({
          message:
            "Export completed successfully.",
        });
      } catch (error) {
        console.error(error);

        setToast({
          message:
            "Export failed.",
          type:
            "error",
        });
      }
    };

  const handleLogout =
    () => {
      authService.signOut();

      setUser(null);

      setRecords([]);

      setPage(
        "dashboard"
      );

      setSelectedFine(
        null
      );

      setHistory([]);

      setReviewing(
        null
      );

      setExportState(
        null
      );
    };

  if (!user) {
    if (
      authPage ===
      "signup"
    ) {
      return (
        <SignUpPage
          onSignIn={(
            message
          ) => {
            setAuthNotice(
              message ??
                ""
            );

            setAuthPage(
              "login"
            );
          }}
        />
      );
    }

    return (
      <LoginPage
        notice={
          authNotice
        }
        onSignUp={() => {
          setAuthNotice(
            ""
          );

          setAuthPage(
            "signup"
          );
        }}
        onLogin={
          setUser
        }
      />
    );
  }

  return (
    <Layout
      page={page}
      user={user}
      onLogout={
        handleLogout
      }
      onNavigate={
        setPage
      }
    >
      {loading &&
      !records.length ? (
        <LoadingPage />
      ) : page ===
        "dashboard" ? (
        <DashboardPage
          records={
            records
          }
          onNavigateFines={
            navigateFines
          }
        />
      ) : (
        <FinesDetailsPage
          records={
            records
          }
          role={
            user.role
          }
          initialFilters={
            navFilters
          }
          onOpen={
            openFine
          }
          onRefresh={
            refresh
          }
          onExport={(
            fines,
            filters
          ) =>
            setExportState(
              {
                records:
                  fines,
                filters,
              }
            )
          }
        />
      )}

      {selectedFine && (
        <FineDrawer
          fine={
            selectedFine
          }
          role={
            user.role
          }
          history={
            history
          }
          onClose={() =>
            setSelectedFine(
              null
            )
          }
          onReview={() =>
            setReviewing(
              selectedFine
            )
          }
        />
      )}

      {reviewing && (
        <ReviewModal
          fine={
            reviewing
          }
          role={
            user.role
          }
          onClose={() =>
            setReviewing(
              null
            )
          }
          onSave={
            saveReview
          }
        />
      )}

      {exportState && (
        <ExportModal
          count={
            exportState
              .records
              .length
          }
          filters={
            exportState.filters
          }
          onClose={() =>
            setExportState(
              null
            )
          }
          onExport={
            exportWorkbook
          }
        />
      )}

      {toast && (
        <Toast
          {...toast}
          onClose={() =>
            setToast(
              null
            )
          }
        />
      )}
    </Layout>
  );
}

