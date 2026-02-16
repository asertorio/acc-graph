export interface SchemaColumn {
  data_type: string;
  constraints: string[];
  notes: string;
  ordinal_position: number;
}

export interface SchemaTable {
  name: string;
  columns: Record<string, SchemaColumn>;
}
