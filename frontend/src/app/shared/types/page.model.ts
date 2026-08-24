/** Ausschnitt der Spring-`Page`-Serialisierung (DIRECT-Modus), den das Frontend nutzt. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-basiert (Spring-Default, `one-indexed-parameters` ist nicht gesetzt)
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageRequest {
  page?: number; // 0-basiert
  size?: number;
  sort?: string; // z.B. 'updatedAt,desc'
}
