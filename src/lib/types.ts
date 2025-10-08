export type Item = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  photo_url: string | null;
  location_found: string | null;
  date_found: string; // ISO date
  status: 'listed' | 'claimed';
  created_at: string;
};

export type Claim = {
  id: number;
  item_id: number;
  claimant_name: string;
  claimant_email: string;
  proof: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};
