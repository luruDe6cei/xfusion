export interface FileAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string | null;
  type?: string | null;
  mimetype?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  domain?: string | null;
  logo?: FileAsset | null;
  country?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
}

export interface Challenge {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  objective?: string | null;
  industry?: Industry | null;
  subIndustry?: Industry | null;
  keywords: string[];
  requiredExpertise: string[];
  requiredDeploymentTime?: string | null;
  rewardInformation?: string | null;
  status: string;
  viewsCount: number;
  sharesCount: number;
  averageMatchScore?: number | null;
  files?: FileAsset[];
  company: Company;
  createdAt: string;
}

export interface Solution {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  industry?: Industry | null;
  subIndustry?: Industry | null;
  keywords: string[];
  // Rendered by the real detail page. No `description` field exists upstream.
  implementationMethodology?: string | null;
  requiredResources?: string | null;
  previousImplementations?: string | null;
  timeToImplement?: string | null;
  estimatedCost?: string | null;
  status: string;
  viewsCount: number;
  company: Company;
  createdAt: string;
}
