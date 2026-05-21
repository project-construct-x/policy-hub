import { Observable } from 'rxjs';
import {
  PolicyMockMode,
  setPolicyMockMode,
  getPolicyMockMode$,
  getCurrentPolicyMockMode,
} from './data/policies/mocked-policies';

export interface MockDataCategory {
  id: string;
  label: string;
  icon: string;
  modes: MockDataMode[];
  currentMode$: Observable<string>;
  getCurrentMode: () => string;
  setMode: (mode: string) => void;
}

export interface MockDataMode {
  value: string;
  label: string;
  icon: string;
}

export const mockDataCategories: MockDataCategory[] = [
  {
    id: 'policies',
    label: 'Policies',
    icon: '📋',
    modes: [
      { value: 'empty', label: 'Keine Policies', icon: '🔴' },
      { value: 'few', label: 'Wenige Policies', icon: '🟡' },
      { value: 'many', label: 'Viele Policies', icon: '🟢' },
    ],
    currentMode$: getPolicyMockMode$(),
    getCurrentMode: () => getCurrentPolicyMockMode(),
    setMode: (mode: string) => setPolicyMockMode(mode as PolicyMockMode),
  },
];
