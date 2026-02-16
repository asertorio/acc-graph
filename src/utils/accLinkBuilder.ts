import type { EntityRecord, EntityType } from '../types/entities';

const ACC_BASE = 'https://acc.autodesk.com';

interface AccLinkConfig {
  buildUrl: (projectId: string, fields: Record<string, string>) => string | null;
}

const ACC_LINK_REGISTRY: Partial<Record<EntityType, AccLinkConfig>> = {
  issue: {
    buildUrl: (pid, fields) => {
      const id = fields['issue_id'];
      return id ? `${ACC_BASE}/build/issues/projects/${pid}/issues?issueId=${id}` : null;
    },
  },
  coordinationother: {
    buildUrl: (pid, fields) => {
      const id = fields['issue_id'];
      return id ? `${ACC_BASE}/build/issues/projects/${pid}/issues?issueId=${id}` : null;
    },
  },
  asset: {
    buildUrl: (pid, fields) => {
      const id = fields['id'];
      return id ? `${ACC_BASE}/build/assets/projects/${pid}/assets?assetId=${id}` : null;
    },
  },
  rfi: {
    buildUrl: (pid, fields) => {
      const id = fields['id'];
      return id ? `${ACC_BASE}/build/rfis/projects/${pid}?preview=${id}` : null;
    },
  },
  form: {
    buildUrl: (pid, fields) => {
      const id = fields['id'];
      const templateId = fields['template_id'];
      return id && templateId
        ? `${ACC_BASE}/build/forms/projects/${pid}/field-reports/${templateId}/reports/${id}`
        : null;
    },
  },
};

export function getAccLink(entity: EntityRecord): string | null {
  const config = ACC_LINK_REGISTRY[entity.entityType];
  if (!config) return null;

  const projectId = entity.fields['bim360_project_id'];
  if (!projectId) return null;

  return config.buildUrl(projectId, entity.fields);
}
