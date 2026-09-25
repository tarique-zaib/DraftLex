export interface DashboardHearing {
  id: string;
  matterId: string;
  matterTitle: string;
  clientName: string;
  court: string;
  hearingDate: string;
  stage: string;
}

export interface DashboardStats {
  clients: number;
  activeMatters: number;
  hearings: number;
  documents: number;
}

export interface DashboardResponse {
  today: DashboardHearing[];
  upcoming: DashboardHearing[];
  stats: DashboardStats;
}