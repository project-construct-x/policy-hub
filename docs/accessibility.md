# Barrierefreiheit (Accessibility) — Policy Hub Frontend

Zielniveau: **WCAG 2.2 AA** als solide Grundausstattung. WCAG 2.2 AA ist der aktuelle Standard
und über den **European Accessibility Act** (in Kraft seit Juni 2025) auch rechtlich relevant.

## Umgesetzte Grundlagen

- **App-Shell:** Skip-Link („Zum Hauptinhalt springen"), `<main id="main-content" tabindex="-1">`,
  Fokus wandert bei Routenwechsel auf `<main>`, neuer Seitentitel wird per CDK `LiveAnnouncer`
  angesagt.
- **Seitentitel:** pro Route via `CxTitleStrategy` (übersetzt, Format `"<Seite> · Policy Hub"`).
- **Sprache:** `<html lang>` wird bei DE/EN-Wechsel dynamisch aktualisiert; Titel neu übersetzt.
- **Struktur:** semantische Tabelle in `cx-policy-table` (`<table>`/`<th scope>`/`<caption>`),
  lückenlose Überschriften-Reihenfolge, `aria-current` in der Navigation.
- **Formulare:** Labels/ARIA für Suche & Filter, Kategorie-Auswahl als `radiogroup` (Pfeiltasten),
  Palette-Toggles mit `aria-pressed`, Fehler-Ansage + Fokus auf erstes ungültiges Feld beim Absenden.
- **Feedback:** Lade-/Fehlerzustände als Live-Regions (`role="status"`/`role="alert"`),
  Snackbar mit Icon + verstecktem Severity-Wort (nicht nur Farbe) und assertive Politeness für
  Fehler/Warnungen.
- **Icons:** dekorative Icons durchgängig `aria-hidden`; Icon-only-Buttons benannt; Dev-Guard in
  `cx-button` warnt bei fehlendem Accessible Name.
- **Fokus:** sichtbare `:focus-visible`-Indikatoren (inkl. Suche/Filter, die vorher `outline:none`
  ohne Ersatz hatten).
- **Motion:** globaler `prefers-reduced-motion`-Guard.
- **Reflow (1.4.10):** flexible Layouts/Breakpoints; nutzbar bei 320px Breite und 400% Zoom.

Alle sichtbaren a11y-Texte liegen im Transloco-Namespace `a11y` (in `de.json` **und** `en.json`).
Statische Prüfung läuft über das ESLint-Preset `angular.configs.templateAccessibility`
(`npm run lint`).

## Bekanntes Restrisiko (bewusst akzeptiert)

Das **Marken-Orange `#e53d17`** wird auf Wunsch unverändert beibehalten. Dadurch erreichen folgende
**Text**-Kontraste das AA-Kriterium **1.4.3 (4.5:1)** nicht:

| Element | Vorder-/Hintergrund | Verhältnis | Status |
| --- | --- | --- | --- |
| Links / gefüllte Button-Labels | `#e53d17` auf Weiß | ~4.2:1 | unter AA (Text) |
| Kategorie-Badge „contract" | `#e53d17` auf `#ebd8d0` | ~3.1:1 | unter AA |
| Typ-Badge (gelb) | `#f08109` auf `#f4e7d4` | ~2.2:1 | deutlich unter AA |
| Tertiärtext | `#767676` auf `#fafafa` | grenzwertig | knapp unter AA |

Diese Punkte sind **nicht** Teil der aktuellen Umsetzung. Für volle AA-Konformität beim Text-Kontrast
müsste eine dunklere Textvariante des Markenorange (z.B. nur für Text/Links/kleine Labels) oder eine
Anpassung der Badge-Farbpaare eingeführt werden — als bewusste Design-Entscheidung in einem
Folgeschritt.

## Manuelle Verifikation (empfohlen vor Releases)

- Tastatur-Only-Durchlauf (Tab/Shift-Tab/Enter/Space/Pfeile), Skip-Link, Fokus nach Routenwechsel.
- Screenreader-Stichprobe (NVDA): Seitentitel & `lang` bei DE/EN, Nav `aria-current`, Tabelle mit
  Spaltenüberschriften, Formularfehler/Lade-/Fehlerzustände, Snackbar-Severität.
- Zoom 400% / Viewport 320px → kein horizontales Scrollen (außer Datentabelle, 1.4.10-Ausnahme).
- Gegencheck mit axe DevTools / Lighthouse im Browser.
