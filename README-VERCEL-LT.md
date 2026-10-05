# KNIGHT — website + scanner (Vercel setup, lietuviškai)

## Kas čia?
- `knight-website/` — gražus website: Register (username/password/confirm) → Login → tavo kodukas → ⬇ Atsisiųsti Knight → Mano rezultatai
- `knight-scanner/knight.py` — Knight scanneris (pavadinimas BŪTINAI Knight). Be tavo koduko nenuskenuoja.

## Koks NAME turi būti, kad veiktų scanneris?
1. **Exe vardas: `Knight.exe`** (build-knight.bat jau taip daro: `--name Knight`)
2. **Website failas: `public/downloads/Knight.exe`** — ten nukopijuok sukompiliuotą failą
3. **Scannerio viduje `API_URL`** — turi būti TAVO Vercel domenas:
   ```python
   API_URL = "https://tavo-projektas.vercel.app"
   ```
   Arba per env: `KNIGHT_API_URL`. Jei paliksi `TAVO-PROJEKTAS`, scanneris nepasieks website ir rodys klaidą.
4. Scanneris kalba tik su 2 adresais:
   - `GET /api/verify-code?code=KNIGHT-XXXX` → tikrina ar kodas tikras
   - `POST /api/results` → įkelia scaną į tavo accountą

## Paleidimas ant Vercel (5 min)
1. Užkelk `knight-website` folderį į GitHub (naujas repo, pvz. `knight-website`)
2. Eik į https://vercel.com → New Project → pasirink tą repo → Deploy
3. Vercel → Project → Settings → Environment Variables įdėk:
   - `JWT_SECRET` = ilgas random tekstas (pvz. 40 simbolių)
   - `DOWNLOAD_URL` = (nebūtina) jei Knight.exe keli kitur (Drive/Discord CDN link)
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` = (rekomenduojama prod) Upstash Redis nemokamai, kad accountai neišsitrintų po redeploy
4. Redeploy. Gautą domeną pvz. `https://knight-tavo.vercel.app` įrašyk į `knight.py` viršų ir perbuildink exe.

## Lokalus testas
```bash
cd knight-website
npm install
npm run dev
# atidaryk http://localhost:3000
```
Scanneriui testui nustatyk `API_URL = "http://localhost:3000"` ir paleisk:
```bash
cd knight-scanner
python knight.py
```

## Foto + Icon (tavo 2 foto)
- 1 foto (LEGO) → išsaugok kaip `knight-scanner/assets/banner.png` → matysis GUI
- 2 foto (paršiukas) → išsaugok kaip `icon.png`, konvertuok į `icon.ico` → bus exe icon
- Po to paleisk `build-knight.bat` → gausi `dist/Knight.exe`

## Koduko logika (svarbu)
- Kodas generuojamas automatiškai per Register: `KNIGHT-XXXXXX-XXXX`
- Kiekvienas user turi SKIRTINGĄ kodą, saugomą DB/KV
- Scanneris be teisingo kodo net nepradeda scano — todėl duotas draugui failas neveiks
- Rezultatai matomi TIK tam useriui, kurio kodas buvo įvestas (dashboard → Mano scan rezultatai)
