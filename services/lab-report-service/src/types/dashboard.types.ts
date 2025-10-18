/**
 * Lab Dashboard API Response Types
 *
 * Use these types for TypeScript/React frontend integration
 */

/**
 * Additional statistics for the lab dashboard
 */
export interface DashboardAdditionalStats {
  /** Number of tests currently being processed */
  inProgressTests: number;
  /** Number of tests that failed processing */
  failedTests: number;
  /** Number of high priority tests (pending or in-progress) */
  highPriorityTests: number;
  /** Total number of all samples (all statuses) */
  totalSamples: number;
}

/**
 * Main dashboard statistics data
 */
export interface DashboardStats {
  /** Lab ID */
  labId: string;
  /** Number of pending tests waiting to be processed */
  pendingTests: number;
  /** Number of tests completed today */
  completedToday: number;
  /** Total number of completed reports (historical) */
  totalReports: number;
  /** Number of urgent tests (pending or in-progress) */
  urgentTests: number;
  /** Additional useful statistics */
  additionalStats: DashboardAdditionalStats;
  /** Timestamp when the statistics were generated */
  timestamp: string;
}

/**
 * Success response from the dashboard API
 */
export interface DashboardStatsResponse {
  success: true;
  data: DashboardStats;
  message: string;
}

/**
 * Error response from the dashboard API
 */
export interface DashboardStatsErrorResponse {
  success: false;
  message: string;
  debug?: {
    requestedLabId?: string;
    userLabId?: string;
    userRole?: string;
  };
}

/**
 * Lab sample status values
 */
export type LabSampleStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed";

/**
 * Lab sample priority values
 */
export type LabSamplePriority = "low" | "normal" | "high" | "urgent";

/**
 * Dashboard card configuration for UI
 */
export interface DashboardCard {
  id: string;
  title: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

/**
 * Helper function to map dashboard stats to card configurations
 */
export const mapStatsToCards = (stats: DashboardStats): DashboardCard[] => [
  {
    id: "pending",
    title: "Pending Tests",
    value: stats.pendingTests,
    icon: "🕒",
    color: "#FFA500",
    description: "Tests waiting to be processed",
  },
  {
    id: "completed",
    title: "Completed Today",
    value: stats.completedToday,
    icon: "✅",
    color: "#4CAF50",
    description: "Tests completed today",
  },
  {
    id: "total",
    title: "Total Reports",
    value: stats.totalReports,
    icon: "📄",
    color: "#2196F3",
    description: "All-time completed reports",
  },
  {
    id: "urgent",
    title: "Urgent Tests",
    value: stats.urgentTests,
    icon: "⚠️",
    color: "#F44336",
    description: "Requires immediate attention",
  },
];

/**
 * API service class for dashboard endpoints
 */
export class LabDashboardAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  /**
   * Fetch dashboard statistics for the authenticated lab
   */
  async getOwnDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(
      `${this.baseURL}/api/lab-workflow/lab/dashboard/stats`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error: DashboardStatsErrorResponse = await response.json();
      throw new Error(error.message);
    }

    const result: DashboardStatsResponse = await response.json();
    return result.data;
  }

  /**
   * Fetch dashboard statistics for a specific lab (admin only)
   */
  async getLabDashboardStats(labId: string): Promise<DashboardStats> {
    const response = await fetch(
      `${this.baseURL}/api/lab-workflow/lab/${labId}/dashboard/stats`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error: DashboardStatsErrorResponse = await response.json();
      throw new Error(error.message);
    }

    const result: DashboardStatsResponse = await response.json();
    return result.data;
  }
}

/**
 * React Hook example for using the dashboard API
 *
 * Usage:
 * ```tsx
 * const { stats, loading, error, refresh } = useLabDashboard();
 * ```
 */
export interface UseLabDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Example implementation (requires React)
// export const useLabDashboard = (
//   baseURL: string,
//   token: string
// ): UseLabDashboardReturn => {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//
//   const api = useMemo(() => new LabDashboardAPI(baseURL, token), [baseURL, token]);
//
//   const fetchStats = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await api.getOwnDashboardStats();
//       setStats(data);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to fetch dashboard stats");
//     } finally {
//       setLoading(false);
//     }
//   }, [api]);
//
//   useEffect(() => {
//     fetchStats();
//   }, [fetchStats]);
//
//   return { stats, loading, error, refresh: fetchStats };
// };
