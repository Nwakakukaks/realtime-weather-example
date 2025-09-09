// Stream-related types
export interface StreamData {
  id: string;
  output_playback_id: string;
  whip_url: string;
}

export interface AlertState {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  id: number;
}
