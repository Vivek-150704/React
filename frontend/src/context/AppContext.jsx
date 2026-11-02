import {
  createContext,
  useContext,
  useState,
} from "react";

const AppContext = createContext(null);

const dashboardDefaults = {
  status: undefined,
  customerId: undefined,
  reasons: [],
  fromDate: "",
  toDate: "",
};

const finesDefaults = {
  search: "",
  status: undefined,
  customerId: undefined,
  reasons: [],
  fromDate: "",
  toDate: "",
};

export function AppProvider({
  children,
}) {
  const [
    dashboardFilters,
    setDashboardFilters,
  ] = useState(
    dashboardDefaults
  );

  const [
    finesFilters,
    setFinesFilters,
  ] = useState(
    finesDefaults
  );

  const [
    selectedFine,
    setSelectedFine,
  ] = useState(null);

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [
    finesData,
    setFinesData,
  ] = useState([]);

  const resetDashboardFilters =
    () => {
      setDashboardFilters(
        dashboardDefaults
      );
    };

  const resetFinesFilters =
    () => {
      setFinesFilters(
        finesDefaults
      );
    };

  return (
    <AppContext.Provider
      value={{
        dashboardFilters,
        setDashboardFilters,

        finesFilters,
        setFinesFilters,

        selectedFine,
        setSelectedFine,

        dashboardData,
        setDashboardData,

        finesData,
        setFinesData,

        resetDashboardFilters,
        resetFinesFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider"
    );
  }

  return context;
}