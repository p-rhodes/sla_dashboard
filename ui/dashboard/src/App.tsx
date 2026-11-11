import { useEffect, useMemo, useState } from "react"

type Status = "healthy" | "warning" | "down"

type Server = {
  id: string
  name: string
  cluster: "A" | "B" | "C"
  role: "Master" | "Slave"
  status: Status
  ip: string
  jobs: number
  cpu: number
  memory: number
  lastResponse: string
  uptime: string
}

type Cluster = {
  id: "A" | "B" | "C"
  location: string
  counts: Record<Status, number>
}

const STATUS_META: Record<Status, {
  label: string
  description: string
  empty: string
}> = {
  healthy: {
    label: "Healthy",
    description: "Accepting jobs",
    empty: "No healthy servers",
  },
  warning: {
    label: "Refusing jobs",
    description: "Online, not accepting work",
    empty: "No servers refusing jobs",
  },
  down: {
    label: "Not responding",
    description: "Ping timed out",
    empty: "No unresponsive servers",
  },
}

const CLUSTERS: Cluster[] = [
  {
    id: "A",
    location: "US East",
    counts: { healthy: 188, warning: 8, down: 4 },
  },
  {
    id: "B",
    location: "EU West",
    counts: { healthy: 193, warning: 5, down: 2 },
  },
  {
    id: "C",
    location: "Asia Pacific",
    counts: { healthy: 10, warning: 1, down: 1 },
  },
]

function makeServers(cluster: Cluster): Server[] {
  const servers: Server[] = []
  let index = 1
  ;(["healthy", "warning", "down"] as Status[]).forEach((status) => {
    for (let count = 0; count < cluster.counts[status]; count += 1) {
      const role = index === 1 ? "Master" : "Slave"
      const jobs =
        status === "healthy" ? (index * 7 + cluster.id.charCodeAt(0)) % 13 : 0
      const lastResponse =
        status === "down"
          ? `${4 + (index % 9)} min ago`
          : status === "warning"
            ? `${18 + (index % 35)} sec ago`
            : `${1 + (index % 8)} sec ago`

      servers.push({
        id: `${cluster.id.toLowerCase()}-${index}`,
        name: `${cluster.id.toLowerCase()}-node-${String(index).padStart(3, "0")}`,
        cluster: cluster.id,
        role,
        status,
        ip: `10.${cluster.id.charCodeAt(0) - 64}.${Math.floor(index / 255)}.${(index % 254) + 1}`,
        jobs,
        cpu: status === "down" ? 0 : 18 + ((index * 11) % 68),
        memory: status === "down" ? 0 : 31 + ((index * 7) % 57),
        lastResponse,
        uptime:
          status === "down"
            ? "Unavailable"
            : `${14 + (index % 71)}d ${index % 24}h`,
      })
      index += 1
    }
  })

  return servers
}

const SERVERS = CLUSTERS.flatMap(makeServers)

function ServerIcon({ role }: { role: Server["role"] }) {
  return (
    <svg
      aria-hidden="true"
      className="server-icon"
      viewBox="0 0 20 20"
      fill="none"
    >
      <rect x="3" y="3.5" width="14" height="5" rx="1.5" />
      <rect x="3" y="11.5" width="14" height="5" rx="1.5" />
      <circle cx="6" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="6" cy="14" r="0.8" fill="currentColor" stroke="none" />
      {role === "Master" && (
        <path d="M13 5.25h2M13 13.25h2" strokeWidth="1.3" />
      )}
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`chevron ${open ? "chevron-open" : ""}`}
      viewBox="0 0 16 16"
      fill="none"
    >
      <path d="m5.5 6.5 2.5 3 2.5-3" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  )
}

function ServerDetails({
  server,
  onClose,
}: {
  server: Server
  onClose: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const status = STATUS_META[server.status]

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside
        className="details-panel"
        aria-labelledby="details-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="details-header">
          <div>
            <div className="eyebrow">
              Cluster {server.cluster} · {server.role}
            </div>
            <h2 id="details-title">{server.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={`status-callout status-callout-${server.status}`}>
          <span className={`status-dot status-dot-${server.status}`} />
          <div>
            <strong>{status.label}</strong>
            <span>{status.description}</span>
          </div>
        </div>

        <section className="detail-section">
          <h3>Node information</h3>
          <dl className="detail-list">
            <div>
              <dt>IP address</dt>
              <dd>{server.ip}</dd>
            </div>
            <div>
              <dt>Last response</dt>
              <dd>{server.lastResponse}</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>{server.uptime}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{server.role}</dd>
            </div>
          </dl>
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <h3>Current jobs</h3>
            <span className="job-count">{server.jobs}</span>
          </div>
          {server.jobs > 0 ? (
            <div className="job-list">
              {Array.from({ length: Math.min(server.jobs, 4) }, (_, index) => (
                <div className="job-row" key={index}>
                  <div>
                    <strong>JOB-{8492 + server.id.length * 13 + index}</strong>
                    <span>Data processing</span>
                  </div>
                  <span className="job-state">Running</span>
                </div>
              ))}
              {server.jobs > 4 && (
                <div className="more-jobs">+ {server.jobs - 4} more jobs</div>
              )}
            </div>
          ) : (
            <div className="empty-state">No jobs are currently assigned.</div>
          )}
        </section>

        <section className="detail-section">
          <h3>Resource usage</h3>
          <div className="metrics">
            <div className="metric">
              <div>
                <span>CPU</span>
                <strong>{server.cpu}%</strong>
              </div>
              <div className="metric-track">
                <span style={{ width: `${server.cpu}%` }} />
              </div>
            </div>
            <div className="metric">
              <div>
                <span>Memory</span>
                <strong>{server.memory}%</strong>
              </div>
              <div className="metric-track">
                <span style={{ width: `${server.memory}%` }} />
              </div>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}

function StatusGroup({
  cluster,
  status,
  open,
  onToggle,
  onSelect,
}: {
  cluster: Cluster
  status: Status
  open: boolean
  onToggle: () => void
  onSelect: (server: Server) => void
}) {
  const servers = useMemo(
    () =>
      SERVERS.filter(
        (server) => server.cluster === cluster.id && server.status === status,
      ),
    [cluster.id, status],
  )
  const meta = STATUS_META[status]
  const listId = `${cluster.id}-${status}-servers`

  return (
    <div
      className={`status-group status-group-${status} ${open ? "is-open" : ""}`}
    >
      <button
        className="status-summary"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className={`status-light status-light-${status}`}>
          <span />
        </span>
        <span className="status-copy">
          <span className="status-title">{meta.label}</span>
          <span className="status-description">{meta.description}</span>
        </span>
        <strong className="status-count">{servers.length}</strong>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="server-list" id={listId}>
          {servers.length ? (
            servers.map((server) => (
              <button
                type="button"
                className="server-row"
                key={server.id}
                onClick={() => onSelect(server)}
              >
                <span className="server-node">
                  <ServerIcon role={server.role} />
                </span>
                <span className="server-name">
                  <strong>{server.name}</strong>
                  <span>
                    {server.role} · {server.ip}
                  </span>
                </span>
                {server.jobs > 0 && (
                  <span className="server-jobs">{server.jobs} jobs</span>
                )}
                <span className="row-arrow">›</span>
              </button>
            ))
          ) : (
            <div className="empty-state">{meta.empty}</div>
          )}
        </div>
      )}
    </div>
  )
}

function ClusterCard({
  cluster,
  expanded,
  onToggle,
  onSelect,
}: {
  cluster: Cluster
  expanded: Status | null
  onToggle: (status: Status) => void
  onSelect: (server: Server) => void
}) {
  const total = Object.values(cluster.counts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const availability = ((cluster.counts.healthy / total) * 100).toFixed(1)

  return (
    <article className="cluster-card">
      <header className="cluster-header">
        <div>
          <div className="cluster-label">Cluster</div>
          <h2>{cluster.id}</h2>
          <span>{cluster.location}</span>
        </div>
        <div className="availability">
          <strong>{availability}%</strong>
          <span>available</span>
        </div>
      </header>

      <div className="cluster-meta">
        <span>{total} servers</span>
        <span className="meta-divider" />
        <span>1 master</span>
      </div>

      <div className="status-stack">
        {(["healthy", "warning", "down"] as Status[]).map((status) => (
          <StatusGroup
            key={status}
            cluster={cluster}
            status={status}
            open={expanded === status}
            onToggle={() => onToggle(status)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </article>
  )
}

export default function App() {
  const [expanded, setExpanded] = useState<Record<string, Status | null>>({
    A: null,
    B: null,
    C: null,
  })
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)

  const totals = CLUSTERS.reduce(
    (acc, cluster) => ({
      healthy: acc.healthy + cluster.counts.healthy,
      warning: acc.warning + cluster.counts.warning,
      down: acc.down + cluster.counts.down,
    }),
    { healthy: 0, warning: 0, down: 0 },
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <span>SLA Dashboard</span>
        </div>
        <div className="environment">
          <span className="live-pulse" />
          Production
        </div>
      </header>

      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">Infrastructure overview</div>
            <h1>Server health</h1>
            <p>Live status across all production clusters.</p>
          </div>
          <div className="last-updated">
            <span>Last updated</span>
            <strong>just now</strong>
          </div>
        </div>

        <section className="overview" aria-label="Fleet summary">
          <div className="overview-total">
            <strong>{SERVERS.length}</strong>
            <span>Total servers</span>
          </div>
          <div className="overview-stat">
            <span className="mini-dot mini-dot-healthy" />
            <div>
              <strong>{totals.healthy}</strong>
              <span>Healthy</span>
            </div>
          </div>
          <div className="overview-stat">
            <span className="mini-dot mini-dot-warning" />
            <div>
              <strong>{totals.warning}</strong>
              <span>Refusing jobs</span>
            </div>
          </div>
          <div className="overview-stat">
            <span className="mini-dot mini-dot-down" />
            <div>
              <strong>{totals.down}</strong>
              <span>Not responding</span>
            </div>
          </div>
          <div className="fleet-health">
            <div>
              <span>Fleet health</span>
              <strong>
                {((totals.healthy / SERVERS.length) * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="health-track">
              <span
                style={{
                  width: `${(totals.healthy / SERVERS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="cluster-grid" aria-label="Server clusters">
          {CLUSTERS.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              expanded={expanded[cluster.id]}
              onToggle={(status) =>
                setExpanded((current) => ({
                  ...current,
                  [cluster.id]: current[cluster.id] === status ? null : status,
                }))
              }
              onSelect={setSelectedServer}
            />
          ))}
        </section>
      </main>

      <footer>
        <span>Auto-refreshes every 30 seconds</span>
        <span>Monitoring 3 clusters</span>
      </footer>

      {selectedServer && (
        <ServerDetails
          server={selectedServer}
          onClose={() => setSelectedServer(null)}
        />
      )}
    </div>
  )
}
