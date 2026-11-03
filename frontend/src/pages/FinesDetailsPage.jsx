import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FilterX, MoreHorizontal } from "lucide-react";
import { Button, Card, EmptyState, SearchField, Select, StatusBadge } from "../components/ui.jsx";
import { exactMoney, filterFines, shortDate } from "../utils/fines.js";
import { useAppContext } from "../context/AppContext.jsx";

const emptyFilters = { search: "", status: undefined, customerId: undefined, reasons: [], fromDate: "", toDate: "" };

export function FinesDetailsPage({ records, role, initialFilters, onOpen }) {
  const { finesFilters, setFinesFilters } = useAppContext();
  const [draftFilters, setDraftFilters] = useState(() => ({ ...emptyFilters, ...initialFilters, ...finesFilters }));
  const [sort, setSort] = useState({ field: "fineDate", direction: "desc" });
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  // Build every filter option from the live records returned by the API.
  // Keep the option lists within the selected date window, but independent
  // of the other selected filters so users can change between them.
  const optionRecords = useMemo(
    () => filterFines(records, {
      fromDate: draftFilters.fromDate,
      toDate: draftFilters.toDate,
      status: undefined,
      customerId: undefined,
      reasons: [],
      search: "",
    }),
    [records, draftFilters.fromDate, draftFilters.toDate]
  );
  const statuses = [...new Set(optionRecords.map((fine) => fine.status).filter(Boolean))].sort();
  const customers = Array.from(
    new Map(optionRecords.filter((fine) => fine.customerId).map((fine) => [fine.customerId, fine.customerName]))
  ).sort((a, b) => String(a[1] || a[0]).localeCompare(String(b[1] || b[0])));
  const reasons = [...new Set(optionRecords.map((fine) => fine.reasonCategory).filter(Boolean))].sort();

  // Render the last applied filters, not unsubmitted draft selections.
  const filtered = useMemo(() => filterFines(records, finesFilters).sort((a, b) => {
    const result = sort.field === "fineAmount"
      ? Number(a.fineAmount) - Number(b.fineAmount)
      : String(a.fineDate ?? "").localeCompare(String(b.fineDate ?? ""));
    return sort.direction === "asc" ? result : -result;
  }), [records, finesFilters, sort]);

  const update = (partial) => setDraftFilters((current) => ({ ...current, ...partial }));
  const searchText = (draftFilters.search || "").trim().toLowerCase();
  const suggestions = searchText.length < 2 ? [] : records.filter((fine) =>
    [fine.fineId, fine.customerId, fine.customerName, fine.orderReference, fine.reasonCategory]
      .some((value) => String(value || "").toLowerCase().includes(searchText))
  ).slice(0, 7);
  const chooseSuggestion = (fine) => {
    const next = { ...draftFilters, search: fine.fineId };
    setDraftFilters(next);
    setFinesFilters(next);
    setSuggestionsOpen(false);
  };
  const applyFilters = () => setFinesFilters({ ...draftFilters });
  const clearFilters = () => {
    setDraftFilters(emptyFilters);
    setFinesFilters(emptyFilters);
  };
  const toggleSort = (field) => setSort((current) => ({
    field,
    direction: current.field === field && current.direction === "desc" ? "asc" : "desc",
  }));
  const SortIcon = ({ field }) => sort.field === field ? (sort.direction === "asc" ? <ArrowUp size={13}/> : <ArrowDown size={13}/>) : null;

  return <>
    <Card className="records-card sticky-filters records-filters">
      <div className="records-search search-suggest-wrap">
        <SearchField value={draftFilters.search ?? ""} onChange={(search) => { update({ search }); setSuggestionsOpen(true); }} placeholder="Search Fine ID, Customer ID, or Order Reference…"/>
        {suggestionsOpen && searchText.length >= 2 && (
          <div className="search-suggestions" role="listbox" aria-label="Matching fines">
            {suggestions.length ? suggestions.map((fine) => (
              <button type="button" key={fine.fineId} className="search-suggestion" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(fine)}>
                <span><strong>{fine.fineId}</strong><small>{fine.customerName} · {fine.customerId}</small></span>
                <span><strong>{fine.orderReference || "No order reference"}</strong><small>{fine.reasonCategory || "Uncategorised"}</small></span>
                <small className="suggestion-status">{fine.status}</small>
              </button>
            )) : <div className="search-no-suggestions">No matching fines found</div>}
          </div>
        )}
      </div>
      <div className="details-filters">
        <label className="field"><span>From date</span><input type="date" value={draftFilters.fromDate ?? ""} onChange={(e) => update({ fromDate: e.target.value || undefined })}/></label>
        <label className="field"><span>To date</span><input type="date" value={draftFilters.toDate ?? ""} onChange={(e) => update({ toDate: e.target.value || undefined })}/></label>
        <Select label="Status" value={draftFilters.status ?? ""} onChange={(e) => update({ status: e.target.value || undefined })}>
          <option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>}
        </Select>
        <Select label="Customer" value={draftFilters.customerId ?? ""} onChange={(e) => update({ customerId: e.target.value || undefined })}>
          <option value="">All customers</option>{customers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
        <Select label="Fine reason" value={draftFilters.reasons?.[0] ?? ""} onChange={(e) => update({ reasons: e.target.value ? [e.target.value] : [] })}>
          <option value="">All reasons</option>{reasons.map((reason) => <option key={reason}>{reason}</option>)}
        </Select>
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="ghost" onClick={clearFilters}><FilterX size={16}/> Clear all</Button>
      </div>
    </Card>
    <Card className="records-card table-card">
      <div className="table-toolbar"><span>{filtered.length.toLocaleString()} records</span></div>
      {!filtered.length ? <EmptyState action={<Button onClick={clearFilters}>Clear filters</Button>}/> : <div className="table-wrap main-table all-records-scroll">
        <table>
          <thead><tr>
            <th>Fine ID</th><th>Customer ID</th><th>Order reference</th>
            <th><button onClick={() => toggleSort("fineDate")}>Fine date <SortIcon field="fineDate"/></button></th>
            <th className="amount-center"><button onClick={() => toggleSort("fineAmount")}>Fine amount <SortIcon field="fineAmount"/></button></th>
            <th>Fine reason</th><th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>{filtered.map((fine) => <tr key={fine.fineId}>
            <td><button className="table-link" onClick={() => onOpen(fine)}>{fine.fineId}</button></td>
            <td>{fine.customerId}<small>{fine.customerName}</small></td>
            <td>{fine.orderReference}</td>
            <td className="date-cell">{shortDate(fine.fineDate)}</td>
            <td className="amount-center"><strong>{exactMoney(fine.fineAmount)}</strong></td>
            <td><span className="truncate" title={fine.reasonCategory}>{fine.reasonCategory}</span></td>
            <td><StatusBadge status={fine.status}/></td>
            <td className="date-cell">{shortDate(fine.updatedAt)}</td>
            <td><div className="row-actions">{role === "Admin" || role === "Super User"
              ? <Button variant="secondary" onClick={() => onOpen(fine, true)}>Review</Button>
              : <button className="icon-btn" onClick={() => onOpen(fine)} aria-label={`View ${fine.fineId}`}><MoreHorizontal size={18}/></button>}</div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </Card>
  </>;
}
