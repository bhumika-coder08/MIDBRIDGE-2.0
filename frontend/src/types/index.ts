export type UserRole = 'USER' | 'ADMIN' | 'AUTHORITY' | 'UNIVERSITY' | 'VERIFIER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  profile?: Profile | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  nationality: string;
  current_country: string;
  destination_country: string;
  purpose: string;
  education_level?: string;
  intended_course?: string;
  institution?: string;
  travel_date?: string;
  preferred_language?: string;
}

export interface Country {
  code: string;
  name: string;
  region: string;
  flag_emoji: string;
  cover_image: string;
  popular_purposes: string[];
  summary: string;
  processing_time_weeks: number;
  currency?: string;
  language?: string;
}

export interface CountrySection {
  category: string;
  title: string;
  content: string;
  source_organization: string;
  source_url: string;
  last_checked: string;
}

export interface Journey {
  id: string;
  user_id: string;
  from_country: string;
  to_country: string;
  purpose: string;
  current_stage_number: number;
  current_stage_name: string;
  readiness_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyStage {
  id: string;
  journey_id: string;
  stage_number: number;
  stage_name: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_ATTENTION';
  due_date?: string;
}

export interface RequirementItem {
  user_requirement_id: string;
  status: 'NOT_UPLOADED' | 'IN_PROGRESS' | 'UPLOADED' | 'AI_ANALYZED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'NEEDS_ATTENTION' | 'EXPIRED' | 'REJECTED';
  notes?: string;
  requirement_id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  stage_number: number;
  source_url?: string;
}

export interface VaultDocument {
  id: string;
  user_id: string;
  journey_id?: string;
  requirement_id?: string;
  requirement_title?: string;
  category: string;
  original_name: string;
  stored_name: string;
  file_size: number;
  mime_type: string;
  file_hash: string;
  verification_status: string;
  issuer?: string;
  issue_date?: string;
  expiry_date?: string;
  created_at: string;
  ai_analysis?: {
    fileHash: string;
    classification: string;
    detectedName?: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuer?: string;
    hasQrCode: boolean;
    hasDigitalSignature: boolean;
    ocrConfidence: number;
    extractedSnippets: string[];
    isAiAnalyzed: boolean;
    isOfficiallyVerified: boolean;
    disclaimer: string;
  };
}

export interface ReadinessCategoryBreakdown {
  category: string;
  score: number;
  weight: number;
  details: string;
}

export interface ReadinessReport {
  overallScore: number;
  categories: {
    documents: number;
    verification: number;
    visa: number;
    medical: number;
    financial: number;
    travel: number;
  };
  breakdown: ReadinessCategoryBreakdown[];
  penalties: string[];
  nextRecommendedAction: string;
}

export interface Scholarship {
  id: string;
  name: string;
  country_code: string;
  country_name?: string;
  flag_emoji?: string;
  provider: string;
  level: string;
  eligible_nationalities: string;
  field: string;
  funding_type: string;
  deadline: string;
  description: string;
  official_source: string;
  last_checked: string;
}

export interface SharePackage {
  id: string;
  user_id: string;
  share_token: string;
  recipient_name: string;
  recipient_email?: string;
  allow_download: boolean;
  expires_at: string;
  is_revoked: boolean;
  notes?: string;
  created_at: string;
  document_count?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface ReminderItem {
  id: string;
  user_id: string;
  journey_id?: string;
  title: string;
  due_date: string;
  category: string;
  is_completed: boolean;
  created_at: string;
}
