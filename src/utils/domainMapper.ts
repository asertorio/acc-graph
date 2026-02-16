import type { EntityType } from '../types/entities';

export interface DomainMapping {
  csvFile: string;
  primaryKey: string | string[];
  displayNameColumn: string;
  personColumns: string[];
  entityType: EntityType;
}

const DOMAIN_MAP: Record<string, Record<string, DomainMapping>> = {
  'autodesk-bim360-issue': {
    issue: {
      csvFile: 'issues_issues.csv',
      primaryKey: 'issue_id',
      displayNameColumn: 'title',
      personColumns: ['assignee_id', 'owner_id', 'created_by', 'updated_by', 'opened_by', 'closed_by', 'response_by', 'deleted_by'],
      entityType: 'issue',
    },
    coordinationother: {
      csvFile: 'issues_issues.csv',
      primaryKey: 'issue_id',
      displayNameColumn: 'title',
      personColumns: ['assignee_id', 'owner_id', 'created_by', 'updated_by', 'opened_by', 'closed_by', 'response_by', 'deleted_by'],
      entityType: 'issue',
    },
  },
  'autodesk-bim360-asset': {
    asset: {
      csvFile: 'assets_assets.csv',
      primaryKey: 'id',
      displayNameColumn: 'client_asset_id',
      personColumns: ['created_by', 'updated_by', 'deleted_by'],
      entityType: 'asset',
    },
  },
  'autodesk-construction-photo': {
    photo: {
      csvFile: 'photos_photos.csv',
      primaryKey: 'uid',
      displayNameColumn: 'title',
      personColumns: ['creator_id', 'deleter_id', 'updater_id'],
      entityType: 'photo',
    },
  },
  'autodesk-construction-schedule': {
    activity: {
      csvFile: 'schedule_activities.csv',
      primaryKey: ['schedule_id', 'unique_id'],
      displayNameColumn: 'name',
      personColumns: [],
      entityType: 'activity',
    },
  },
  'autodesk-bim360-rfi': {
    rfi: {
      csvFile: 'rfis_rfis.csv',
      primaryKey: 'id',
      displayNameColumn: 'title',
      personColumns: ['created_by', 'updated_by', 'closed_by', 'responded_by', 'answered_by', 'manager_id'],
      entityType: 'rfi',
    },
  },
  'autodesk-construction-markup': {
    markup: {
      csvFile: 'markups_markup.csv',
      primaryKey: 'uid',
      displayNameColumn: 'markup_text',
      personColumns: ['created_by', 'updated_by', 'deleted_by'],
      entityType: 'markup',
    },
  },
  'autodesk-bim360-modelcoordination': {
    documentlineage: {
      csvFile: '',
      primaryKey: '',
      displayNameColumn: '',
      personColumns: [],
      entityType: 'documentlineage',
    },
    container: {
      csvFile: '',
      primaryKey: '',
      displayNameColumn: '',
      personColumns: [],
      entityType: 'container',
    },
    scope: {
      csvFile: '',
      primaryKey: '',
      displayNameColumn: '',
      personColumns: [],
      entityType: 'scope',
    },
  },
  'autodesk-construction-form': {
    form: {
      csvFile: 'forms_forms.csv',
      primaryKey: 'id',
      displayNameColumn: 'name',
      personColumns: ['created_by', 'assignee_id', 'last_reopened_by', 'last_submitted_by'],
      entityType: 'form',
    },
  },
  'autodesk-bim360-cost': {
    pco: {
      csvFile: 'cost_change_orders.csv',
      primaryKey: 'id',
      displayNameColumn: 'name',
      personColumns: ['creator_id', 'owner_id', 'changed_by', 'applied_by', 'integration_state_changed_by'],
      entityType: 'pco',
    },
  },
};

export function getDomainMapping(domain: string, entityType: string): DomainMapping | null {
  return DOMAIN_MAP[domain]?.[entityType] ?? null;
}

export function resolveEntityType(domain: string, entityType: string): EntityType {
  const mapping = getDomainMapping(domain, entityType);
  if (mapping) return mapping.entityType;
  return 'unknown';
}

export function getAllMappings(): Array<{ domain: string; entityType: string; mapping: DomainMapping }> {
  const result: Array<{ domain: string; entityType: string; mapping: DomainMapping }> = [];
  for (const [domain, types] of Object.entries(DOMAIN_MAP)) {
    for (const [entityType, mapping] of Object.entries(types)) {
      result.push({ domain, entityType, mapping });
    }
  }
  return result;
}
