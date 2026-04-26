import api from "./api";

export interface DisplayConfig {
  widgets: DisplayWidget[];
  refreshInterval?: number;
}

export interface DisplayWidget {
  type: "gauge" | "parameter_cards" | "live_chart" | "status_board";
  parameter?: string;      // for gauge (single param)
  parameters?: string[];   // for cards, chart, status_board (multi param)
}

export interface CustomDisplay {
  id: string;
  slug: string;
  title: string;
  description?: string;
  deviceId: string;
  config: DisplayConfig;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    id: string;
    name: string;
    location: string;
    latitude?: string;
    longitude?: string;
    status?: string;
  };
  creator?: {
    id?: string;
    fullName: string;
    email?: string;
  };
}

/**
 * List all custom displays (authenticated)
 */
export async function listDisplays(): Promise<CustomDisplay[]> {
  const { data } = await api.get("/displays");
  return data.data;
}

/**
 * Get a display by slug (public, no auth)
 */
export async function getDisplayBySlug(slug: string): Promise<CustomDisplay> {
  const { data } = await api.get(`/displays/${slug}/public`);
  return data.data;
}

/**
 * Create a new custom display
 */
export async function createDisplay(payload: {
  title: string;
  description?: string;
  deviceId: string;
  config: DisplayConfig;
  slug: string;
  isPublic?: boolean;
}): Promise<CustomDisplay> {
  const { data } = await api.post("/displays", payload);
  return data.data;
}

/**
 * Update an existing display
 */
export async function updateDisplay(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    deviceId: string;
    config: DisplayConfig;
    slug: string;
    isPublic: boolean;
  }>
): Promise<CustomDisplay> {
  const { data } = await api.put(`/displays/${id}`, payload);
  return data.data;
}

/**
 * Delete a display
 */
export async function deleteDisplay(id: string): Promise<void> {
  await api.delete(`/displays/${id}`);
}
