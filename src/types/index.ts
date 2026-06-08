export type AuthType = 'none' | 'bearer' | 'apikey' | 'oauth2';
export type SourceStatus = 'active' | 'paused' | 'error';
export type SpecFormat = 'openapi3' | 'swagger2' | 'postman' | 'markdown';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ParamLocation = 'path' | 'query' | 'header' | 'cookie';
export type ChangeType = 'added' | 'removed' | 'modified';
export type ChangeSeverity = 'breaking' | 'normal' | 'minor';
export type ChangeCategory =
  | 'path'
  | 'parameter'
  | 'field'
  | 'statusCode'
  | 'auth'
  | 'example';
export type WorkStatus =
  | 'pending_review'
  | 'in_progress'
  | 'awaiting_verify'
  | 'closed';
export type WorkPriority = 'critical' | 'high' | 'medium' | 'low';
export type NodeType = 'api' | 'service' | 'consumer' | 'database' | 'gateway';
export type SlaLevel = 'P0' | 'P1' | 'P2' | 'P3';
export type ChannelType = 'email' | 'dingtalk' | 'feishu' | 'sms';
export type UserRole =
  | 'product'
  | 'tester'
  | 'provider'
  | 'consumer'
  | 'admin';

export interface ApiSource {
  id: string;
  name: string;
  system: string;
  baseUrl: string;
  authType: AuthType;
  owner: string;
  status: SourceStatus;
  lastScanAt: string;
  currentVersion: string;
  apiCount: number;
  createdAt: string;
  scanSchedule: string;
  description?: string;
}

export interface Parameter {
  name: string;
  in: ParamLocation;
  required: boolean;
  type: string;
  description?: string;
  example?: unknown;
}

export interface FieldProperty {
  type: string;
  description?: string;
  example?: unknown;
  enum?: unknown[];
  items?: FieldProperty;
}

export interface FieldSchema {
  type: string;
  properties?: Record<string, FieldProperty>;
  required?: string[];
  items?: FieldProperty;
}

export interface ResponseSchema {
  statusCode: number;
  description: string;
  schema?: FieldSchema;
}

export interface Example {
  name: string;
  request?: unknown;
  response?: unknown;
}

export interface Endpoint {
  path: string;
  method: HttpMethod;
  summary: string;
  tags?: string[];
  parameters: Parameter[];
  requestBody?: FieldSchema;
  responses: ResponseSchema[];
  auth: string[];
  examples: Example[];
  deprecated?: boolean;
}

export interface ApiVersion {
  id: string;
  sourceId: string;
  version: string;
  specFormat: SpecFormat;
  endpoints: Endpoint[];
  createdAt: string;
}

export interface ApiChange {
  id: string;
  sourceId: string;
  versionFrom: string;
  versionTo: string;
  endpoint: string;
  method: HttpMethod;
  category: ChangeCategory;
  type: ChangeType;
  severity: ChangeSeverity;
  fieldPath?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  detectedAt: string;
}

export interface WorkItem {
  id: string;
  title: string;
  changeIds: string[];
  status: WorkStatus;
  priority: WorkPriority;
  assignee?: string;
  reporter: string;
  description: string;
  relatedRequirement?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface SystemNode {
  id: string;
  name: string;
  type: NodeType;
  owner: string;
  slaLevel?: SlaLevel;
  dailyQps?: number;
  changeRelated?: boolean;
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
}

export interface SystemEdge {
  source: string;
  target: string;
  callVolume: number;
  sync: boolean;
}

export interface NotificationChannel {
  type: ChannelType;
  config: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  triggers: {
    severities: ChangeSeverity[];
    categories: ChangeCategory[];
    sources?: string[];
  };
  channels: NotificationChannel[];
  subscribers: string[];
  quietHours?: {
    start: string;
    end: string;
    mergeDigests: boolean;
  };
  createdAt: string;
  createdBy: string;
  lastTestedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface TrendPoint {
  date: string;
  breaking: number;
  normal: number;
  minor: number;
  total: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalSources: number;
    totalChanges: number;
    breakingCount: number;
    resolvedRate: number;
    avgHandleHours: number;
  };
  highlights: string[];
  risks: string[];
  progress: string[];
  bySystem: { system: string; changes: number; breaking: number }[];
  trend: TrendPoint[];
}

export type ScanTrigger = 'manual' | 'scheduled' | 'import';
export type ScanStatus = 'success' | 'failed' | 'running';

export interface ScanHistory {
  id: string;
  sourceId: string;
  version: string;
  scanAt: string;
  status: ScanStatus;
  triggeredBy: ScanTrigger;
  durationMs: number;
  apiCount: number;
  apiCountDelta: number;
  newApis: number;
  modifiedApis: number;
  removedApis: number;
  totalChanges: number;
  breakingChanges: number;
  failReason?: string;
  operator?: string;
}

export type ImportMode = 'overwrite' | 'append' | 'skip';
export type ImportDocType = 'openapi3' | 'swagger2' | 'postman' | 'markdown';

export interface ImportRecord {
  id: string;
  sourceId: string;
  fileName: string;
  docType: ImportDocType;
  importMode: ImportMode;
  importedBy: string;
  importedAt: string;
  parsedApiCount: number;
  versionBefore: string;
  versionAfter: string;
  apiCountDelta: number;
  conflictCount?: number;
  notes?: string;
}
