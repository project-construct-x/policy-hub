export interface Environment {
  production: boolean;
  backendUrl: string;
  useMocks: boolean;
  /**
   * Nur für lokale Entwicklung gegen das echte Backend: Das Backend sichert `/api/**` per HTTP
   * Basic (Provisorium, siehe CLAUDE.md §4). `environment.production.ts` setzt dieses Feld bewusst
   * nicht — das echte Auth-Verfahren für Produktion/Staging ist noch offen.
   */
  devBasicAuth?: { username: string; password: string };
}
