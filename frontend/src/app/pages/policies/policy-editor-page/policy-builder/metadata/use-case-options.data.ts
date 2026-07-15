export interface UseCaseOption {
  id: string;
  labelKey: string;
}

export const USE_CASE_OPTIONS: UseCaseOption[] = [
  { id: 'UC.bim-coordination', labelKey: 'useCase.bim-coordination' },
  { id: 'UC.quality-assurance', labelKey: 'useCase.quality-assurance' },
  { id: 'UC.material-testing', labelKey: 'useCase.material-testing' },
  { id: 'UC.site-documentation', labelKey: 'useCase.site-documentation' },
  { id: 'UC.geodata', labelKey: 'useCase.geodata' },
];

export const FRAMEWORK_AGREEMENT_VALUE = 'DataExchangeGovernance';
