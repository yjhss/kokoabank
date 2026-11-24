
export type ServiceType = 'BACKEND' | 'FRONTEND' | 'WORKER';

export interface CatalogService {
  id: number;
  serviceKey: string;
  name: string;
  description: string | null;
  serviceType: ServiceType;
  repositoryUrl: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ServiceInput = Pick<
  CatalogService,
  | 'serviceKey'
  | 'name'
  | 'description'
  | 'serviceType'
  | 'repositoryUrl'
  | 'owner'
>;
