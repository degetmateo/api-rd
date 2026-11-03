export interface ApiKeyProps {
  id?: string;
  key: string;
  clientName: string;
  active: boolean;
  createdAt?: Date;
  lastUsedAt?: Date | null;
}

export class ApiKeyEntity {
  public readonly id?: string;
  public readonly key: string;
  public readonly clientName: string;
  public readonly active: boolean;
  public readonly createdAt: Date;
  public readonly lastUsedAt: Date | null;

  constructor(props: ApiKeyProps) {
    this.id = props.id;
    this.key = props.key;
    this.clientName = props.clientName;
    this.active = props.active ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.lastUsedAt = props.lastUsedAt ?? null;
  }

  public isValid(): boolean {
    return this.active;
  }
}

