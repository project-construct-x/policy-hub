# Policy Hub Design Brief

## Ziel

Das bestehende Angular-Frontend des Construct-X Policy Hub soll anhand der bereitgestellten Design-Screens umgesetzt werden.

Die Anwendung ist aktuell ein Frontend-Prototyp mit Mock-Daten. Es soll keine Backend-Anbindung ergänzt werden.

## Source-Datei des Designs

Die Originalquelle des Designs:

- `docs/design/source/Policy_hub.pen`

## Screens

Die finalen Screens liegen unter:

- `docs/design/screens/home.png`
- `docs/design/screens/policy-overview.png`
- `docs/design/screens/policy-detail.png`
- `docs/design/screens/policy-create.png`
- `docs/design/screens/empty-state.png`
- `docs/design/screens/error-state.png`
- `docs/design/screens/loading-state.png`

## Designrichtung

- hell
- ruhig
- professionell
- viel Weißraum
- Construct-X-konform
- nicht zu technisch
- keine generische Admin-Dashboard-Optik
- keine dunkle Cybersecurity-Optik

## Header

Der Header ist auf allen Seiten gleich.

Er enthält:

- Construct-X Logo links
- Produktbezeichnung `Policy Hub`
- Navigation:
  - Start
  - Richtlinien
  - Profil

Seitenbezogene Aktionen wie `Bearbeiten`, `Abbrechen`, `Prüfen und erstellen` oder `Richtlinie erstellen` gehören nicht in den Header, sondern in den jeweiligen Seiteninhalt.

## Seiten

### Startseite

Enthält:

- Hero-Bereich
- primäre Aktion `Richtlinie erstellen`
- sekundäre Aktion `Alle Richtlinien anzeigen`
- rechte Box mit empfohlenen Schritten
- Übersichtskarten:
  - Policies im Hub
  - Anwendungsbereiche
  - Nutzungsregeln
- Bereich `Kürzlich bearbeitet`

### Richtlinienübersicht

Enthält:

- Titel `Richtlinienübersicht`
- Suchfeld
- Filter nach Name, Use-Case-Kontext und Datum
- Tabelle/Liste mit:
  - Name
  - Use-Case-Kontext
  - Letzte Änderung

Keine Status-Spalte.
Keine prominenten technischen IDs.
Kein `Öffnen`-Link.
Die Zeile soll klickbar sein und zur Detailansicht führen.

### Richtliniendetail

Enthält:

- Zurück-Pfeil
- Titel der Richtlinie
- Beschreibung
- Use-Case-Kontext
- letzte Änderung
- fachliche Inhaltsbereiche:
  - Zweck der Richtlinie
  - Erlaubte Nutzung
  - Einschränkungen
  - Rechtlicher Hinweis

Keine Status-Badges.
Keine unnötigen technischen Verwaltungsangaben.

### Richtlinie erstellen / bearbeiten

Enthält:

- horizontalen Stepper oberhalb des Inhalts
- Schritte:
  - Grundlagen
  - Use-Case-Kontext
  - Nutzung
  - Prüfen
- Formularbereiche je Schritt
- Aktionen im Seiteninhalt:
  - Abbrechen
  - Prüfen und erstellen
  - Weiter / Zurück

Keine linke Prozess-Sidebar.
Keine Vorschau auf jedem Schritt, außer auf dem finalen Prüfen-Schritt.
Kein Entwurf speichern.

## Styleguide

### Farben

- CX Blue: `rgb(10, 59, 147)`
- CX Orange: `rgb(229, 61, 23)`
- CX Yellow: `rgb(240, 129, 9)`
- Light Blue: `rgb(201, 216, 224)`
- Dark Blue: `rgb(52, 85, 161)`
- Light Orange: `rgb(235, 216, 208)`
- Dark Orange: `rgb(224, 82, 41)`
- Light Yellow: `rgb(244, 231, 212)`
- Dark Yellow: `rgb(236, 156, 73)`
- Dark Gray: `rgb(129, 131, 134)`
- Light Gray: `rgb(244, 243, 243)`
- White: `#ffffff`
- Text Primary: `#111111`

### Typografie

- Hauptschrift: Montserrat
- leichte, klare Typografie
- Headlines ruhig und hochwertig
- keine schweren, blockigen Überschriften

### Komponenten

- App Shell
- Header
- Page Header
- Content Cards
- Policy Cards
- Data Table / List
- Statusfreie Übersicht
- Buttons
- Form Fields
- horizontaler Stepper
- Legal Text Panel
- Empty State
- Loading State
- Error State