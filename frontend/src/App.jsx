import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredDispatches =
  statusFilter === "ALL"
    ? dispatches
    : dispatches.filter(
        (dispatch) => dispatch.status === statusFilter
      );

  // Calculate counts for each status
  const newCount = dispatches.filter(
      (dispatch) => dispatch.status === "NEW"
    ).length;

  const dispatchedCount = dispatches.filter(
      (dispatch) => dispatch.status === "DISPATCHED"
    ).length;

  const completedCount = dispatches.filter(
      (dispatch) => dispatch.status === "COMPLETED"
    ).length;

  // Function to fetch dispatches from the backend
  const fetchDispatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dispatches");

      if (!response.ok) {
        throw new Error("Failed to load dispatches");
      }

      const data = await response.json();

      setDispatches(data.dispatches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to update the status of a dispatch
  const updateStatus = async (id, status) => {
  try {
    const response = await fetch(`/api/dispatches/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update dispatch status");
    }

    await fetchDispatches();
  } catch (err) {
    setError(err.message);
  }
};

  useEffect(() => {
    fetchDispatches();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Zach Plumbing</h1>
          <p>Dispatch Dashboard</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="dashboard">
        <section className="dashboard-heading">
          <div>
            <h2>Emergency Dispatches</h2>
            <p>Manage incoming plumbing service calls.</p>
          </div>

          <button onClick={fetchDispatches} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Dispatches"}
          </button>

        </section>

        {/* Summary cards for each status */}

        <section className="summary-grid">
          <div className="summary-card">
            <span>New</span>
            <strong>{newCount}</strong>
          </div>

          <div className="summary-card">
            <span>Dispatched</span>
            <strong>{dispatchedCount}</strong>
          </div>

          <div className="summary-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </section>

        <section className="filter-bar">
          {["ALL", "NEW", "DISPATCHED", "COMPLETED"].map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </section>

        <section className="dispatch-panel">
          {loading && (
            <div className="state-message">
              <div className="spinner"></div>
              <p>Loading dispatches...</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-message error-state">
              <strong>Unable to load dispatches</strong>
              <p>{error}</p>

              <button onClick={fetchDispatches}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && dispatches.length === 0 && (
            <p>No dispatches found.</p>
          )}

          {!loading &&
            !error &&
            dispatches.length > 0 &&
            filteredDispatches.length === 0 && (
              <p>No dispatches match this filter.</p>
            )}

          {!loading && !error && dispatches.length > 0 && (
            <div className="dispatch-list">
              {filteredDispatches.map((dispatch) => (
                <article className="dispatch-card" key={dispatch.id}>
                  <div className="dispatch-card-header">
                    <div>
                      <h3>{dispatch.customer_name}</h3>
                      <span>{dispatch.id}</span>

                      {/* Format the created_at timestamp to a more readable format */}
                      <p className="dispatch-time">
                        {new Date(dispatch.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span
                      className={`status-badge status-${dispatch.status.toLowerCase()}`}
                    >
                      {dispatch.status}
                    </span>
                  </div>

                  <div className="dispatch-details">
                    <div>
                      <strong>Phone</strong>
                      <p>{dispatch.phone_number}</p>
                    </div>

                    <div>
                      <strong>Emergency</strong>
                      <p>{dispatch.emergency_issue}</p>
                    </div>
                  </div>
                <div className="dispatch-actions">
                  {dispatch.status === "NEW" && (
                    <button onClick={() => updateStatus(dispatch.id, "DISPATCHED")}>
                      Mark Dispatched
                    </button>
                  )}

                  {dispatch.status === "DISPATCHED" && (
                    <button onClick={() => updateStatus(dispatch.id, "COMPLETED")}>
                      Mark Completed
                    </button>
                  )}

                    {dispatch.status === "COMPLETED" && (
                      <span className="completed-label">Completed</span>
                    )}
                </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;