import {
  AlertCircle,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  FileText,
  RotateCcw,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "../context/AppContext.jsx";

import {
  ReasonsChart,
  StatusAmountChart,
  StatusDistribution,
  TrendChart,
} from "../components/charts.jsx";

import {
  Button,
  Card,
  EmptyState,
  Select,
} from "../components/ui.jsx";

import { reasons } from "../data/mockData.js";

import {
  filterFines,
  last12Months,
  money,
} from "../utils/fines.js";

import {
  dashboardService,
} from "../services/dashboardService.js";

export function DashboardPage({
  records,
  onNavigateFines,
}) {
  const defaults = {
    ...last12Months(),
    status: undefined,
    customerId: undefined,
    reasons: [],
  };

  const {
    dashboardFilters,
    setDashboardFilters,
  } = useAppContext();

  const filters = dashboardFilters;

  const [
    draftFilters,
    setDraftFilters,
  ] = useState(dashboardFilters);

  const [datePreset, setDatePreset] =
    useState("12");

  const [kpis, setKpis] = useState({
    totalFines: 0,
    totalAmount: 0,
    pendingCases: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const data =
          await dashboardService.kpis();

        setKpis(data);
      } catch (error) {
        console.error(
          "Dashboard KPI error:",
          error
        );
      }
    };

    loadKpis();
  }, []);

  useEffect(() => {
    setDraftFilters(dashboardFilters);
  }, [dashboardFilters]);

  const applyFilters = () => {
    setDashboardFilters({
      ...draftFilters,
    });
  };

  const resetFilters = () => {
    setDraftFilters(defaults);

    setDashboardFilters(defaults);

    setDatePreset("12");
  };

  const filtered = useMemo(
    () =>
      filterFines(
        records,
        filters
      ),
    [records, filters]
  );

  const customers = Array.from(
    new Map(
      records.map((f) => [
        f.customerId,
        f.customerName,
      ])
    )
  );

  const updatePreset = (
    preset
  ) => {
    const to = new Date();

    const from =
      new Date();

    if (preset === "30") {
      from.setDate(
        from.getDate() - 30
      );
    } else if (
      preset === "90"
    ) {
      from.setDate(
        from.getDate() - 90
      );
    } else if (
      preset === "year"
    ) {
      from.setMonth(0, 1);
    } else {
      from.setFullYear(
        from.getFullYear() - 1
      );
    }

    setDraftFilters(
      (current) => ({
        ...current,
        fromDate:
          from
            .toISOString()
            .slice(0, 10),
        toDate:
          to
            .toISOString()
            .slice(0, 10),
      })
    );
  };

  return (
    <>
      <Card className="filter-bar sticky-filters">
        <Select
          label="Fine date"
          value={datePreset}
          onChange={(e) => {
            setDatePreset(
              e.target.value
            );

            updatePreset(
              e.target.value
            );
          }}
        >
          <option value="30">
            Last 30 days
          </option>

          <option value="90">
            Last 90 days
          </option>

          <option value="12">
            Last 12 months
          </option>

          <option value="year">
            This year
          </option>
        </Select>

        <Select
          label="Status"
          value={
            draftFilters.status ??
            ""
          }
          onChange={(e) =>
            setDraftFilters({
              ...draftFilters,
              status:
                e.target.value ||
                undefined,
            })
          }
        >
          <option value="">
            All statuses
          </option>

          <option>
            Valid
          </option>

          <option>
            Invalid
          </option>

          <option>
            Pending
          </option>
        </Select>

        <Select
          label="Customer"
          value={
            draftFilters.customerId ??
            ""
          }
          onChange={(e) =>
            setDraftFilters({
              ...draftFilters,
              customerId:
                e.target.value ||
                undefined,
            })
          }
        >
          <option value="">
            All customers
          </option>

          {customers.map(
            ([id, name]) => (
              <option
                key={id}
                value={id}
              >
                {name}
              </option>
            )
          )}
        </Select>

        <Select
          label="Fine reason"
          value={
            draftFilters.reasons[0] ??
            ""
          }
          onChange={(e) =>
            setDraftFilters({
              ...draftFilters,
              reasons:
                e.target.value
                  ? [
                      e.target
                        .value,
                    ]
                  : [],
            })
          }
        >
          <option value="">
            All reasons
          </option>

          {reasons.map(
            (reason) => (
              <option
                key={reason}
              >
                {reason}
              </option>
            )
          )}
        </Select>

        <Button
          onClick={
            applyFilters
          }
        >
          Apply Filters
        </Button>

        <Button
          variant="ghost"
          className="reset"
          onClick={
            resetFilters
          }
        >
          <RotateCcw size={16} />
          Reset
        </Button>
      </Card>

      <div className="kpi-grid">
        <Kpi
          icon={<FileText />}
          label="Total Fines"
          value={(
            kpis.totalFines ??
            0
          ).toLocaleString()}
          detail="Fine cases in the selected period"
        />

        <Kpi
          icon={
            <CircleDollarSign />
          }
          label="Total Fine Amount"
          value={money(
            kpis.totalAmount ?? 0
          )}
          detail="Gross recorded amount · USD"
        />

        <button
          className="kpi-button"
          onClick={() =>
            onNavigateFines({
              ...filters,
              status:
                "Pending",
            })
          }
        >
          <Kpi
            icon={<Clock3 />}
            label="Pending Cases"
            value={(
              kpis.pendingCases ??
              0
            ).toLocaleString()}
            detail="Awaiting manual review"
            arrow
          />
        </button>

        <Kpi
          icon={
            <AlertCircle />
          }
          label="Pending Amount"
          value={money(
            kpis.pendingAmount ??
              0
          )}
          detail="Amount associated with unresolved cases"
        />
      </div>

      {!filtered.length ? (
        <Card>
          <EmptyState
            action={
              <Button
                onClick={
                  resetFilters
                }
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="chart-grid">
          <StatusDistribution
            records={filtered}
          />

          <StatusAmountChart
            records={filtered}
          />

          <ReasonsChart
            records={filtered}
            onSelect={(
              reason
            ) =>
              onNavigateFines(
                {
                  ...filters,
                  reasons: [
                    reason,
                  ],
                }
              )
            }
          />

          <TrendChart
            records={filtered}
          />
        </div>
      )}
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  detail,
  arrow,
}) {
  return (
    <Card className="kpi">
      <div className="kpi-top">
        <span>{icon}</span>

        {arrow && (
          <ArrowRight size={17} />
        )}
      </div>

      <p>{label}</p>

      <strong>{value}</strong>

      <small>{detail}</small>
    </Card>
  );
}