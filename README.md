# Pong mini-game (2 spelers)

Eenvoudige Pong-demo in pure **HTML/CSS/JavaScript** (Canvas), zonder dependencies of build tools.

## Starten

### Optie 1: direct openen
Open `index.html` direct in Chrome of Edge.

### Optie 2: lokale server (optioneel)
In deze map:

```bash
python3 -m http.server 8000
```

Ga daarna naar `http://localhost:8000`.

## Controls

- **Linker speler:** `W` (omhoog), `S` (omlaag)
- **Rechter speler:** `↑` / `↓`
- **Spatie:** pauze / verder
- **R:** reset score + bal

## Wat zit erin

- 2-speler Pong op één keyboard
- Bal stuitert op boven/onderrand
- Paddle-hit met impact-gebaseerde deflectie (hoek varieert op basis van raakpunt)
- Score links/rechts bovenin
- Punt = bal reset naar midden + korte serve-delay (~1s)
- Tennisveld-look (randen, middenlijn, middenstip + cirkel)
- Subtiele WebAudio beeps bij hit/score (zonder audiobestanden)
- Kleine balversnelling per paddle-hit met maximumsnelheid
