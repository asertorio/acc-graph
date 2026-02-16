export interface Relationship {
  relationshipGuid: string;
  accountId: string;
  projectId: string;
  item1Domain: string;
  item1EntityType: string;
  item1Id: string;
  item2Domain: string;
  item2EntityType: string;
  item2Id: string;
  createdOn: string;
  isDeleted: boolean;
  isServiceOwned: boolean;
}
