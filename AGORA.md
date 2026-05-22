# 🏛️ AGORA AGENTS HACKATHON — Referensi Lengkap

> *"The agora was where Athens did its thinking out loud."*

---

## Apa Itu Agora Agents Hackathon?

Agora Agents Hackathon adalah sebuah **builder series online** yang diselenggarakan oleh **Canteen** bersama **Circle** dan **Arc**. Hackathon ini berfokus pada pembangunan **AI agents** yang mampu berinteraksi dengan pasar — trading, investasi, prediksi, hingga settlement keuangan — semuanya diselesaikan secara instan di atas blockchain Arc menggunakan USDC.

**Format:** Online · 2 minggu
**Tanggal:** 11 Mei → 25 Mei 2025
**Settlement:** Arc · USDC
**Akses:** Apply to join

---

## Filosofi & Konteks

Nama "Agora" diambil dari pusat kota Athena kuno — tempat warga berdagang, bertukar informasi, dan membentuk opini publik. Agora adalah *mesin pemrosesan informasi* pertama dalam sejarah.

Hackathon ini mengadopsi filosofi itu ke era modern:

- **Pasar = teknologi sosial** untuk mengagregasi pengetahuan dan menentukan nilai sesuatu.
- **AI agents = warga baru** yang bisa memonitor pasar 24/7, memproses ribuan sinyal, dan bertindak atas sinyal paling marginal sekalipun.
- **Arc = infrastruktur fisika yang tepat** — finality sub-detik, biaya transaksi ~$0.01 dalam USDC (bukan token gas volatil), membuat strategi high-frequency dan low-margin menjadi ekonomis di onchain untuk pertama kalinya.

---

## Penyelenggara

| Pihak | Peran | Deskripsi |
|---|---|---|
| **Canteen** | Host | Firma riset & teknologi di persimpangan crypto, AI, dan payments |
| **Circle** (NYSE: CRCL) | Platform | Penerbit USDC & EURC; infrastruktur stablecoin terbesar di dunia |
| **Arc** | Settlement Layer | L1 blockchain buatan Circle; "Economic OS for the internet" |

---

## Hadiah — Total $50.000

### Grand Prizes ($40.000)
- 🥇 **1st Place** — $10.000 (1 tim)
- 🥈 **2nd Place** — $7.500 × 2 tim = $15.000
- 🥉 **3rd Place** — $5.000 × 3 tim = $15.000

### Standout Teams ($7.500)
10–12 tim terbaik yang menunjukkan kerja luar biasa, masing-masing ~$650–$750.

### Feedback Incentives ($500)
Untuk developer yang memberikan feedback paling berguna tentang Circle developer tooling.

### Easter Eggs ($2.000)
Code-golf challenges, Discord puzzles, content creation challenges, dan side quests lainnya.

---

## Tech Stack — Circle Developer Platform

Ini adalah primitif utama yang tersedia untuk builder. Pilih yang relevan dengan proyekmu.

### Blockchain & Settlement
| Tool | Fungsi | Use Case di Hackathon |
|---|---|---|
| **Arc** | L1 blockchain, sub-second finality | Semua transaksi dan settlement |
| **USDC / EURC** | Stablecoin dollar & euro | Native settlement, multi-currency markets |

### Circle Developer Tools
| Tool | Fungsi | Use Case di Hackathon |
|---|---|---|
| **CCTP** (Cross-Chain Transfer Protocol) | Transfer USDC antar blockchain | Cross-chain arbitrage, rebalancing kolateral |
| **Gateway** | Unified USDC balance, transfer <500ms antar chain | Agent yang bertindak di banyak chain secara instan |
| **Nanopayments** | Pembayaran USDC gas-free sekecil $0.000001 | High-frequency agentic commerce |
| **Wallets** | Embed wallet di aplikasi apapun | Trading accounts dengan automated key management |
| **Contracts** | Build & manage smart contracts | Position management, liquidation protection, hedging |
| **Paymaster** | Bayar fee transaksi dalam USDC | UX user-facing tanpa token gas volatil |
| **USYC** | Tokenized money market fund | Parkir idle capital sambil yield, atau risk-off allocation |
| **App Kit** | Drop-in components (Bridge, Swap, Send, Unified Balance) | Integrasi cepat untuk flow umum |

### Reference Apps (Open Source — bisa di-fork!)
- **Arc Commerce** — USDC payments for credit purchases
- **Arc Multi-Chain Wallet** — unified USDC balance & crosschain transfers
- **Arc Escrow** — AI-powered work validation & USDC settlement
- **Arc Fintech** — multichain treasury dengan crosschain capital movement
- **Arc P2P Payments** — gasless peer-to-peer payments on Arc

### Developer Docs
- Arc Developer Docs: `docs.arc.network`
- Circle Developer Docs: `developers.circle.com`
- ARC CLI: `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`

---

## RFB — Requests for Builders (Ide Proyek)

RFB adalah versi YC's "Requests for Startups" milik Canteen. Ini bukan track wajib — tapi jika salah satu menarik perhatianmu, itu validasi ekstra untuk terjun lebih dalam.

### RFB 01 — Perpetual Futures Trading Agent
Agen yang memonitor perp futures 24/7, mengambil keputusan leverage secara split-second, dan melindungi posisi dari likuidasi secara otonom.

### RFB 02 — Prediction Market Trader Intelligence
Agen yang menemukan taruhan bernilai positif (+EV) dari noise berita, data, dan sentimen. Sizing posisi yang tepat adalah kuncinya.

### RFB 03 — Prediction Market Verticals
Membuat pasar prediksi baru yang belum ada — geopolitik, makroekonomi, institusional, privat. Pasar yang *seharusnya* ada tapi belum ada.

### RFB 04 — Adaptive Portfolio Manager
Rebalancing konstan, deteksi regime pasar, optimasi pajak. Terlalu membosankan untuk manusia — tapi sempurna untuk agen. Cross-chain.

### RFB 05 — Cross-Platform Arbitrage Agent
Disparitas harga antar platform menghilang dalam hitungan detik. Deteksi, routing, eksekusi — survive slippage.

### RFB 06 — Social Trading Intelligence
Kebanyakan copy-trader hanya meniru leader secara buta. AI memilih, memberi bobot, dan memonitor para leader ini secara cerdas.

---

## Research Angle — Celah Inovasi Konkret

Canteen menyediakan 6 insight riset yang langsung bisa dijadikan produk:

1. **Trading-R1** — Reasoning trace sebagai produk yang bisa di-hash dan dipasarkan. Arc's ~$0.01 fees membuatnya ekonomis. *(Terhubung: RFB 06)*

2. **Builder Codes sebagai monetisasi agen** — Polymarket V2 builder codes memungkinkan agen mengambil cut dari setiap fill yang berasal dari rekomendasinya. Per-pick economics baru masuk akal di Arc. *(Terhubung: RFB 02)*

3. **Freqtrade Blacklist sebagai oracle** — Commit log NostalgiaForInfinity sebagai sinyal real-time rugpull detection. Mint setiap blacklist addition sebagai Arc event dan buka prediction market. *(Terhubung: RFB 03)*

4. **Translation sebagai sumber alpha** — Bottleneck Polymarket adalah terjemahan berita non-Inggris. Buat pasar di mana agen bid untuk hak menerjemahkan news event, dengan builder fees ke translator. *(Terhubung: RFB 03)*

5. **Hyperliquid Whale Migration Index** — Arc-native ERC-20 yang auto-rebalance exposure antar HL forks berdasarkan migrasi top trader. Rebalance mingguan cuma cents di Arc. *(Terhubung: RFB 04, 06)*

6. **Slash-Bonded Leaderboard Copy-Trading** — Performance bond USDC untuk whale tertentu. Smart contract membaca leaderboard rank; jika rank turun, bond slash proporsional dalam <1 detik. *(Terhubung: RFB 06)*

---

## Kriteria Penilaian

| Bobot | Kriteria | Keterangan |
|---|---|---|
| **30%** | Agentic Sophistication | Seberapa banyak AI benar-benar *memutuskan* vs sekadar otomatisasi? Full autonomy > meaningful agency > AI-flavored automation |
| **30%** | Traction | Real users, real transactions, real volume selama event. Founders terbaik ship DAN dapat users dalam 2 minggu |
| **20%** | Circle Tool Usage | Penggunaan kreatif & efektif platform Circle: Wallets, CCTP, Gateway, App Kit, Contracts, USYC, USDC |
| **20%** | Innovation | Pendekatan novel, emergent behavior, insight riset. Wilayah baru > iterasi halus |

---

## Cara Submit

Pengumpulan dilakukan **asinkron** — tidak ada demo day atau presentasi live.

**Deadline: 25 Mei 2025** via `forms.gle/ok3Gr9zhmHnApvK48`

Yang dibutuhkan saat submit:
- ✅ **Video demo** (Loom/YouTube/Vimeo, maks 3 menit) — *wajib*
- ✅ **Public GitHub repo** — *wajib*
- ✅ **Live product link** — *opsional tapi sangat dianjurkan*
- ✅ **Laporan traction** (berapa user nyata, validasi apa yang didapat) — *wajib dalam form*

Bisa submit berkali-kali — submit lebih awal dan sering.

---

## Cara Mulai

1. **Join Canteen Discord** → `discord.gg/TGnyfKh23V`
2. **Join Arc Builder Discord** → `discord.com/invite/buildonarc` (sebut Canteen + Agora di onboarding)
3. **Install ARC CLI** → `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`
4. **Eksplorasi docs** → `arc-node.thecanteenapp.com`
5. **Apply & mulai build!**

---

## Juri

Panel juri memiliki latar belakang dari **Stellar, Coinbase, Arc/Circle, dan Protocol Labs** — mereka yang pernah membangun payments infrastructure dan menjalankan perusahaan. Mereka akan membaca repo-mu seperti operator, bukan penonton.

---

> *"All things are an exchange for fire, and fire for all things — even as wares for gold and gold for wares."*
> — Heraclitus, Fragment 90 · c. 500 BCE