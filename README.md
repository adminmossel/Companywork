# companywork

Rooster, chat en uitbetaling voor teams met medewerkers en vrijwilligers.
Dit is de website van companywork, open source onder de [MIT-licentie](LICENSE).

Live: <https://adminmossel.github.io/companywork/>

## Wat zit erin

| Bestand | Waarvoor |
| --- | --- |
| `index.html` | De hoofdsite met de interactieve demo (nepgegevens, niets wordt opgeslagen) |
| `changelog.html` | Alle versies en commits van MHVwork, de basis van companywork |
| `changelog-data.json` | Gegevens voor de changelog, automatisch gesynchroniseerd |
| `changelog-edits.json` | Handmatige titels, extra regels of verborgen commits voor de changelog |
| `changelog.xml` | RSS-feed van de laatste commits |
| `changelog-summary.json` | Klein bestand met aantallen voor de homepage (badge en tellers) |
| `sw.js` | Service worker: de site werkt ook offline |
| `merk.html` | Logo en kleuren om te downloaden |
| `voorwaarden.html` | Voorwaarden en privacy (identiek aan MHVwork) |
| `404.html` | Pagina voor niet-gevonden adressen |
| `scripts/sync-changelog.mjs` | Haalt commits en changelog van MHVwork op |
| `.github/workflows/sync-changelog.yml` | Draait dat script elke dag |

## Online zetten

1. Maak een repo `companywork` en zet alle bestanden in de hoofdmap.
2. Ga naar Settings → Pages → Deploy from a branch → `main` / root.
3. Na een minuut staat de site op `https://adminmossel.github.io/companywork/`.

## Wat de site kan

- **Demo:** medewerker (donker) en beheerder (licht), met inloggen via Face ID, QR of snelcode, een uitnodigingsflow en vier huisstijlen.
- **Scrollervaring:** de telefoon loopt mee terwijl je door de functies scrolt (alleen op een breed scherm).
- **Tools:** rooster maken (png of agenda), puzzel, poster met QR om te printen, vergelijking en rekentool.
- **Ctrl+K:** opdrachtenpalet. **Aa:** makkelijke taal. **EN/NL:** taalwissel.
- **Parameters:** `?b=horeca|sportkantine|evenement` kiest een branche, `?seizoen=kerst|koningsdag` toont het seizoensthema.

## Instellen

- **Mailadres van het aanvraagformulier:** bovenin het script in `index.html`, bij `CONFIG.to`.
  Het formulier verstuurt via dezelfde EmailJS-instelling als MHVwork.
- **Changelog handmatig bijwerken:** `node scripts/sync-changelog.mjs` (Node 18 of nieuwer).
  Zonder internet kan het met een lokale kloon: `SRC_LOCAL=pad/naar/MHVwork node scripts/sync-changelog.mjs`.
- **Changelog aanpassen:** zet een titel (`titles`), een eigen regel (`manual`) of een verborgen commit (`hidden`)
  in `changelog-edits.json`. De dagelijkse sync overschrijft dat bestand nooit.

## Meedoen

Zie [CONTRIBUTING.md](CONTRIBUTING.md). Een beveiligingsprobleem melden? Zie [SECURITY.md](SECURITY.md).
