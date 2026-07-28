# Bamboo Cinema Club — Menu digitale

Landing page statica (HTML/CSS/JS) per QR code.
Pubblicata con **GitHub Pages**.

## Contenuto

| File | Ruolo |
|------|--------|
| `index.html` | Menu principale |
| `style.css` | Stile cinematografico scuro |
| `script.js` | Prodotti, prezzi, PayPal, WhatsApp |
| `success.html` | Conferma post-pagamento |
| `assets/logo.png` | Logo Bamboo Cinema Club |

## Configurazione

- PayPal: `https://www.paypal.me/florianoserafin` (importi automatici)
- WhatsApp: già impostato in `script.js`
- Aggiorna gli allergeni in `index.html` con le dichiarazioni ufficiali del locale

**Non inserire** password o chiavi private nel codice.

## Pubblicare su GitHub Pages

### 1. Prima pubblicazione

Repository: `https://github.com/BambooCinemaClub/bamboo-cinema-club`

Dopo il push su `main`:

1. Apri il repository su GitHub
2. **Settings** → **Pages**
3. **Source:** Deploy from a branch
4. **Branch:** `main` / cartella `/ (root)`
5. **Save**

Entro 1–2 minuti il sito sarà online su:

**https://bamboocinemaclub.github.io/bamboo-cinema-club/**

### 2. Aggiornamenti

Ogni modifica + `git push` aggiorna automaticamente il sito.

## Anteprima locale

Apri `index.html` nel browser, oppure:

```bash
npx --yes serve .
```

## Pagamenti — nota

I pulsanti **Acquista** aprono PayPal.me con l’importo.
Il sito statico **non verifica** automaticamente il pagamento: il cliente mostra la ricevuta al personale.
