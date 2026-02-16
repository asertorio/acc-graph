export type EntityType =
  | 'issue'
  | 'asset'
  | 'photo'
  | 'activity'
  | 'rfi'
  | 'markup'
  | 'form'
  | 'pco'
  | 'documentlineage'
  | 'container'
  | 'scope'
  | 'coordinationother'
  | 'unknown';

export interface EntityRecord {
  id: string;
  entityType: EntityType;
  domain: string;
  displayName: string;
  fields: Record<string, string>;
  personFields: string[];
  isOpaque: boolean;
}

export interface EntityCollection {
  entities: Map<string, EntityRecord>;
}

export interface PersonReference {
  autodeskId: string;
  name: string;
  email: string;
}

export interface UserRecord {
  id: string;
  autodesk_id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company_id: string;
}
