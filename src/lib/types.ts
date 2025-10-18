// src/lib/types.ts

export type ItemStatus = 'pending' | 'listed' | 'claimed' | 'rejected'; 

export type Item = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  photo_url: string | null;          // primary image URL
  location_found: string | null;
  date_found: string;                // ISO date
  status: ItemStatus;                // ← use the wider union
  created_at: string;
};

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export type Claim = {
  id: number;
  item_id: number;
  claimant_name: string;
  claimant_email: string;
  proof: string | null;
  status: ClaimStatus;
  created_at: string;
};