# Selbst gehostete Schriften

Diese Dateien werden bewusst mitgeliefert statt zur Laufzeit von `fonts.gstatic.com`
geladen. Gründe und die Einbindung stehen in [`../styles/_fonts.scss`](../styles/_fonts.scss).

| Datei                               | Familie                                                             | Herkunft                          |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| `montserrat-latin.woff2`            | Montserrat, normal (variabel, deckt 300/400/600 ab), Subset `latin` | Google Fonts, Montserrat v31      |
| `montserrat-latin-ext.woff2`        | Montserrat, normal (variabel), Subset `latin-ext`                   | Google Fonts, Montserrat v31      |
| `montserrat-italic-latin.woff2`     | Montserrat, kursiv 300, Subset `latin`                              | Google Fonts, Montserrat v31      |
| `montserrat-italic-latin-ext.woff2` | Montserrat, kursiv 300, Subset `latin-ext`                          | Google Fonts, Montserrat v31      |
| `material-icons.woff2`              | Material Icons                                                      | Google Fonts, Material Icons v145 |

Die Subsets `cyrillic`, `cyrillic-ext` und `vietnamese` sind nicht enthalten — die
Anwendung gibt es nur auf Deutsch und Englisch.

## Lizenzen

- **Montserrat** — SIL Open Font License 1.1 (<https://openfontlicense.org/>).
  Copyright 2011 The Montserrat Project Authors (<https://github.com/JulietaUla/Montserrat>).
- **Material Icons** — Apache License 2.0 (<https://www.apache.org/licenses/LICENSE-2.0>).
  Copyright Google LLC.

Beide Lizenzen erlauben das Mitliefern und Weiterverbreiten der Dateien; die
Urhebervermerke oben erfüllen die jeweilige Attributionspflicht.

## Aktualisieren

Die `@font-face`-Regeln in `../styles/_fonts.scss` sind aus der von Google
ausgelieferten CSS erzeugt (Gewichte, Styles und `unicode-range` unverändert). Beim
Aktualisieren dieselbe CSS mit einem Desktop-Browser-User-Agent abrufen, die
`latin`/`latin-ext`-Blöcke übernehmen und die referenzierten `woff2`-Dateien hier ablegen:

    https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;1,300&display=swap
    https://fonts.googleapis.com/icon?family=Material+Icons&display=swap
