import { AppItem, Report, SubmissionData } from '../types';

// Get API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Timeout helper to prevent hanging requests
const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error("Operation timed out. Please check your internet connection or try again.")), ms)
        )
    ]);
};

// Helper to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};

export const getApps = async (): Promise<AppItem[]> => {
  try {
    // Public endpoint - only returns approved apps
    return await withTimeout(apiRequest<AppItem[]>('/api/apps'), 30000);
  } catch (err) {
    console.error("Error fetching apps:", err);
    throw err;
  }
};

// Get all apps including unapproved (for admin)
export const getAllApps = async (): Promise<AppItem[]> => {
  try {
    return await withTimeout(apiRequest<AppItem[]>('/api/apps/all'), 30000);
  } catch (err) {
    console.error("Error fetching all apps:", err);
    throw err;
  }
};

export const addApp = async (data: SubmissionData): Promise<AppItem> => {
  try {
    return await withTimeout(
      apiRequest<AppItem>('/api/apps', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      30000
    );
  } catch (err) {
    console.error("Error adding app:", err);
    throw err;
  }
};

export const updateApp = async (id: string, data: Partial<AppItem>): Promise<void> => {
  try {
    await withTimeout(
      apiRequest<void>(`/api/apps/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      30000
    );
  } catch (err) {
    console.error("Error updating app:", err);
    throw err;
  }
};

export const deleteApp = async (id: string): Promise<void> => {
  try {
    await withTimeout(
      apiRequest<void>(`/api/apps/${id}`, {
        method: 'DELETE',
      }),
      30000
    );
  } catch (err) {
    console.error("Error deleting app:", err);
    throw err;
  }
};

export const incrementAppClicks = async (id: string, _currentClicks: number): Promise<void> => {
  try {
    // Fire and forget, no timeout needed usually, but good practice to catch
    await apiRequest<void>(`/api/apps/${id}/clicks`, {
      method: 'PATCH',
    });
  } catch (e) {
    console.warn("Failed to increment clicks", e);
  }
};

// --- Reports ---

export const getReports = async (): Promise<Report[]> => {
  try {
    return await withTimeout(apiRequest<Report[]>('/api/reports'), 30000);
  } catch (err) {
    console.error("Error fetching reports:", err);
    return []; // Return empty on error to allow app to load
  }
};

export const addReport = async (app: AppItem, reasons: string[]): Promise<Report> => {
  try {
    return await withTimeout(
      apiRequest<Report>('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          appId: app.id,
          appName: app.name,
          reasons,
        }),
      }),
      30000
    );
  } catch (err) {
    console.error("Error adding report:", err);
    throw err;
  }
};

export const deleteReport = async (id: string): Promise<void> => {
  try {
    await withTimeout(
      apiRequest<void>(`/api/reports/${id}`, {
        method: 'DELETE',
      }),
      30000
    );
  } catch (err) {
    console.error("Error deleting report:", err);
    throw err;
  }
};

export const deleteReportsForApp = async (appId: string): Promise<void> => {
  try {
    await withTimeout(
      apiRequest<void>(`/api/reports/app/${appId}`, {
        method: 'DELETE',
      }),
      30000
    );
  } catch (err) {
    console.error("Error deleting reports for app:", err);
    throw err;
  }
};

// Approve or reject an app
export const approveApp = async (id: string, approved: boolean): Promise<AppItem> => {
  try {
    return await withTimeout(
      apiRequest<AppItem>(`/api/apps/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approved }),
      }),
      30000
    );
  } catch (err) {
    console.error("Error approving app:", err);
    throw err;
  }
};