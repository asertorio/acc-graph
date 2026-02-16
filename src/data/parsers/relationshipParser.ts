import type { Relationship } from '../../types/relationships';
import type { CsvParseResult } from './csvParser';

export function parseRelationships(csvResult: CsvParseResult): Relationship[] {
  const relationships: Relationship[] = [];

  for (const row of csvResult.data) {
    if (row.is_deleted === 't') continue;

    relationships.push({
      relationshipGuid: row.relationship_guid,
      accountId: row.bim360_account_id,
      projectId: row.bim360_project_id,
      item1Domain: row.item1_domain,
      item1EntityType: row.item1_entitytype,
      item1Id: row.item1_id,
      item2Domain: row.item2_domain,
      item2EntityType: row.item2_entitytype,
      item2Id: row.item2_id,
      createdOn: row.created_on,
      isDeleted: row.is_deleted === 't',
      isServiceOwned: row.is_service_owned === 't',
    });
  }

  return relationships;
}
