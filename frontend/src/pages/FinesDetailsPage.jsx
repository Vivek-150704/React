import { useEffect } from "react";
import { ArrowDown, ArrowUp, FilterX, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card, EmptyState, SearchField, Select, StatusBadge, } from "../components/ui.jsx";
import { exactMoney, shortDate } from "../utils/fines.js";
import {
  useAppContext,
} from "../context/AppContext.jsx";

export function FinesDetailsPage({ records, role, initialFilters, onOpen }) {
    const {
    finesFilters,
    setFinesFilters,
} = useAppContext();

const [draftFilters, setDraftFilters] = useState(
    Object.keys(finesFilters).length
        ? finesFilters
        : {
              reasons: [],
              ...initialFilters,
          }
);

useEffect(() => {
  if (initialFilters) {
    setDraftFilters((current) => ({
      ...current,
      ...initialFilters,
    }));
  }
}, [initialFilters]);

const filters =
  Object.keys(finesFilters).length
    ? finesFilters
    : {
        reasons: [],
        ...initialFilters,
      };
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState({
        field: "fineDate",
        direction: "desc",
    });
    const customers = Array.from(new Map(records.map((f) => [f.customerId, f.customerName])));
    const reasons = [...new Set(records.map((fine) => fine.reasonCategory).filter(Boolean))].sort();
    const filtered = useMemo(
  () =>
    [...records].sort((a, b) => {
      const result =
        sort.field === "fineAmount"
          ? a.fineAmount - b.fineAmount
          : a.fineDate.localeCompare(
              b.fineDate
            );

      return sort.direction === "asc"
        ? result
        : -result;
    }),
  [records, sort]
);
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, maxPage);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const update = (partial) => {
    setDraftFilters((f) => ({
        ...f,
        ...partial,
    }));

    setPage(1);
};
    const clearFilters = () => {

    const defaults = {
        search: "",
        status: undefined,
        customerId: undefined,
        reasons: [],
        fromDate: "",
        toDate: "",
    };

    setDraftFilters(defaults);

    setFinesFilters(defaults);

    setPage(1);
};
    const toggleSort = (field) => setSort((s) => ({
        field,
        direction: s.field === field && s.direction === "desc" ? "asc" : "desc",
    }));
    const SortIcon = ({ field }) => sort.field === field ? (sort.direction === "asc" ? (<ArrowUp size={13}/>) : (<ArrowDown size={13}/>)) : null;
    return (<>
      <Card className="records-card sticky-filters records-filters">
        <div className="records-search">
          <SearchField value={draftFilters.search ?? ""} onChange={(search) => update({ search })} placeholder="Search Fine ID, Customer ID, or Order Reference…"/>

        </div>
        <div className="details-filters">
          <label className="field">
            <span>From date</span>
            <input type="date" value={draftFilters.fromDate ?? ""} onChange={(e) => update({ fromDate: e.target.value || undefined })}/>
          </label>
          <label className="field">
            <span>To date</span>
            <input type="date" value={draftFilters.toDate ?? ""} onChange={(e) => update({ toDate: e.target.value || undefined })}/>
          </label>
          <Select label="Status" value={draftFilters.status ?? ""} onChange={(e) => update({
            status: e.target.value || undefined,
        })}>
            <option value="">All statuses</option>
            <option>Valid</option>
            <option>Invalid</option>
            <option>Pending</option>
          </Select>
          <Select label="Customer" value={draftFilters.customerId ?? ""} onChange={(e) => update({ customerId: e.target.value || undefined })}>
            <option value="">All customers</option>
            {customers.map(([id, name]) => (<option key={id} value={id}>
                {name}
              </option>))}
          </Select>
          <Select label="Fine reason" value={draftFilters.reasons[0] ?? ""} onChange={(e) => update({ reasons: e.target.value ? [e.target.value] : [] })}>
            <option value="">All reasons</option>
            {reasons.map((reason) => (<option key={reason}>{reason}</option>))}
          </Select>
          <Button
  onClick={() => {
    setFinesFilters({
      ...draftFilters,
    });

    setPage(1);
  }}
>
  Apply Filters
</Button>
          <Button variant="ghost" onClick={clearFilters}>
            <FilterX size={16}/>
            Clear all
          </Button>
        </div>
        {(draftFilters.status ||
            draftFilters.customerId ||
            draftFilters.reasons.length > 0 ||
            draftFilters.search) && (<div className="filter-chips">
            <span>Active filters:</span>
            {draftFilters.status && (<button onClick={() => update({ status: undefined })}>
                Status: {draftFilters.status} ×
              </button>)}
            {draftFilters.customerId && (<button onClick={() => update({ customerId: undefined })}>
                Customer: {draftFilters.customerId} ×
              </button>)}
            {draftFilters.reasons.map((reason) => (<button key={reason} onClick={() => update({ reasons: [] })}>
                {reason} ×
              </button>))}
            {draftFilters.search && (<button onClick={() => update({ search: "" })}>
                Search: “{draftFilters.search}” ×
              </button>)}
          </div>)}
      </Card>
      <Card className="records-card table-card">
        <div className="table-toolbar">
          <span>{filtered.length.toLocaleString()} results</span>
          <label>
            Rows per page{" "}
            <select value={pageSize} onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
        }}>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </label>
        </div>
        {!filtered.length ? (<EmptyState action={<Button onClick={clearFilters}>
                Clear filters
              </Button>}/>) : (<div className="table-wrap main-table">
            <table>
              <thead>
                <tr>
                  <th>Fine ID</th>
                  <th>Customer ID</th>
                  <th>Order reference</th>
                  <th>
                    <button onClick={() => toggleSort("fineDate")}>
                      Fine date <SortIcon field="fineDate"/>
                    </button>
                  </th>
                  <th className="numeric">
                    <button onClick={() => toggleSort("fineAmount")}>
                      Fine amount <SortIcon field="fineAmount"/>
                    </button>
                  </th>
                  <th>Currency</th>
                  <th>Fine reason</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((fine) => (<tr key={fine.fineId}>
                    <td>
                      <button className="table-link" onClick={() => onOpen(fine)}>
                        {fine.fineId}
                      </button>
                    </td>
                    <td>
                      {fine.customerId}
                      <small>{fine.customerName}</small>
                    </td>
                    <td>{fine.orderReference}</td>
                    <td>{shortDate(fine.fineDate)}</td>
                    <td className="numeric">
                      <strong>{exactMoney(fine.fineAmount)}</strong>
                    </td>
                    <td>{fine.currencyCode}</td>
                    <td>
                      <span className="truncate" title={fine.reasonCategory}>
                        {fine.reasonCategory}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={fine.status}/>
                    </td>
                    <td>{shortDate(fine.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        {(role === "Admin" || role === "Super User") ? (<Button variant="secondary" onClick={() => onOpen(fine, true)}>
                            Review
                          </Button>) : (<button className="icon-btn" onClick={() => onOpen(fine)} aria-label={`View ${fine.fineId}`}>
                            <MoreHorizontal size={18}/>
                          </button>)}
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
        <div className="pagination">
          <span>
            Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filtered.length)} of{" "}
            {filtered.length} records
          </span>
          <div>
            <Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </Button>
            <span>
              Page {currentPage} of {maxPage}
            </span>
            <Button variant="secondary" disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </>);
}
