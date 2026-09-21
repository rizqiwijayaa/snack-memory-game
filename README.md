# Memory Match Game

Game ini adalah game memory card berbasis HTML, CSS, dan JavaScript modular. Pemain membuka kartu, mencari pasangan yang sama, mengumpulkan koin, memakai item shop, dan naik level sampai level terakhir.

## Gambaran Umum

- Genre: memory matching game
- Platform: browser
- Penyimpanan data: `localStorage`
- Level maksimum saat ini: `6`
- Tidak memakai backend, login, atau database online

## Flow Screen

Struktur game saat ini memakai tiga screen utama:

1. `Main Menu`
2. `Gameplay`
3. `Game Over`

Perilakunya:

- Saat halaman dibuka, yang tampil hanya `Main Menu`
- Gameplay belum terlihat dan timer belum berjalan
- Setelah tombol `Start Game` ditekan, game berpindah ke `Gameplay`
- Jika waktu habis, game berpindah ke `Game Over Screen`
- Setiap screen tampil sendiri, tidak saling menumpuk

## Main Menu

Main Menu tampil fullscreen dan berisi:

- `Start Game`
- `Statistics`
- `Settings`
- `Credits`

Menu juga punya panel informasi di sisi kanan yang berganti isi sesuai tombol yang dipilih.

## Cara Main

1. Tekan `Start Game`
2. Buka dua kartu
3. Jika gambar sama, kartu akan tetap terbuka dan dihitung sebagai pasangan benar
4. Jika gambar berbeda, kartu akan tertutup lagi dan dihitung sebagai kesalahan
5. Level selesai jika semua pasangan pada level tersebut berhasil ditemukan sebelum waktu habis
6. Jika waktu habis, permainan dianggap kalah dan masuk ke `Game Over Screen`

## Sistem Level

Level menggunakan jumlah pasangan dan grid yang meningkat bertahap:

| Level | Pasangan | Jumlah Kartu | Grid |
| --- | --- | --- | --- |
| 1 | 6 pasang | 12 kartu | 4 x 3 |
| 2 | 8 pasang | 16 kartu | 4 x 4 |
| 3 | 10 pasang | 20 kartu | 5 x 4 |
| 4 | 12 pasang | 24 kartu | 6 x 4 |
| 5 | 15 pasang | 30 kartu | 6 x 5 |
| 6 | 18 pasang | 36 kartu | 6 x 6 |

## Sistem Skor

- Match benar: `8 + (Level x 2)` score
- Salah cocokkan kartu: penalti kecil berdasarkan level
- `Bonus Score` dari shop: `+100 score`

Contoh score match:

- Level 1: `+10 score`
- Level 3: `+14 score`
- Level 6: `+20 score`

Contoh penalti salah:

- Level 1-2: `-1 score`
- Level 3-6: `-2 score`

## Sistem Koin

Koin aktif adalah saldo yang dipakai untuk belanja di shop.

Sumber koin:

- Setiap match benar: `4 + Level` koin
- Bonus akurasi saat level selesai

Contoh koin per match:

- Level 1: `+5 koin`
- Level 3: `+7 koin`
- Level 6: `+10 koin`

Koin aktif disimpan di `localStorage`, jadi tetap ada walaupun browser ditutup.

## Bonus Akurasi

Saat level selesai, pemain mendapat bonus berdasarkan jumlah kesalahan pada level itu:

- Salah `0-2` kali: `Level x 5` koin
- Salah `3-5` kali: `Level x 3` koin
- Salah lebih dari `5` kali: `0` koin

Contoh:

- Level 1, salah 2 kali: `+5 koin`
- Level 3, salah 2 kali: `+15 koin`
- Level 5, salah 2 kali: `+25 koin`

## Sistem Shop

Shop dibuka lewat tombol kecil di panel atas saat berada di screen gameplay. Saat shop terbuka, waktu berhenti sementara.

Item yang tersedia:

| Item | Harga | Efek |
| --- | --- | --- |
| `Extra Time` | 10 koin | Menambah 5 detik |
| `Reveal Cards` | 20 koin | Membuka semua kartu sementara selama 2 detik |
| `Hint Pair` | 25 koin | Menunjukkan 1 pasangan yang cocok |
| `Second Chance` | 30 koin | Saat waktu habis, otomatis mendapat +10 detik sekali |
| `Bonus Score` | 15 koin | Menambah 100 score |
| `Shuffle Board` | 20 koin | Mengacak ulang kartu yang belum match |

Perilaku shop:

- Setelah item berhasil dibeli, popup shop langsung tertutup
- Efek item langsung dijalankan
- Tidak ada inventory

## Kondisi Menang dan Kalah

### Menang level

- Semua pasangan pada level berhasil ditemukan
- Pemain mendapat bonus akurasi
- Jika belum level terakhir, lanjut ke level berikutnya
- Jika sudah level terakhir, permainan selesai

### Kalah

- Waktu habis sebelum semua pasangan selesai
- Gameplay disembunyikan
- Muncul `Game Over Screen` fullscreen
- Tersedia tombol `Play Again` dan `Back to Home`

## Game Over Screen

Saat kalah, screen ini menampilkan:

- Judul besar `Game Over`
- Ringkasan hasil permainan
- Level yang dicapai
- Score
- Coins
- Moves
- Matched pairs
- Mistakes

Tombol yang tersedia:

- `Play Again`: mulai ulang game dari level 1
- `Back to Home`: kembali ke `Main Menu`

## Statistik Pemain

Panel statistik di gameplay memakai `localStorage`.

Statistik yang disimpan:

- `Games Played`
- `Best Score`
- `Highest Level`
- `Longest Win Streak`

Arti `Longest Win Streak`:

- Menghitung kemenangan run yang selesai tuntas
- Jika kalah, streak aktif di-reset

## Audio

Game memakai dua jenis audio:

- `BGM` dari file lokal di `assets/audio/music/`
- `SFX` buatan kode menggunakan `Web Audio API`

### Music Credit

Background music yang digunakan:

**Find Pou/Memory - Pou (REMIX)**  
Source: [YouTube](https://youtu.be/vQj91VsSWrg?si=aY6k3CtoSCDuiQdI)

Music belongs to its respective creator/copyright holder.

SFX yang tersedia:

- klik kartu
- pasangan cocok
- pasangan tidak cocok
- menang level
- game over

Perilaku audio:

- BGM mulai otomatis saat tombol `Start Game` ditekan
- BGM akan menurun sesaat saat SFX diputar
- Volume bisa diatur dari menu `Settings`

## Settings

Menu `Settings` pada `Main Menu` berisi:

- `Music Volume` slider `0% - 100%`
- `Sound Effects Volume` slider `0% - 100%`
- `Mute All Sounds` `ON / OFF`
- `Reset Statistics`
- `About Game`

`Reset Statistics` memakai konfirmasi:

- `Are you sure?`

`About Game` menampilkan:

- `Memory Match`
- `Version 1.0`
- `Created by Rizqi Wijaya`

## Penyimpanan Data

Data pemain disimpan lokal di browser melalui `localStorage`.

Yang tersimpan:

- saldo koin aktif
- statistik pemain

Tidak ada:

- akun
- login
- sinkronisasi cloud
- leaderboard online

## Struktur File

Project saat ini sudah dipecah menjadi beberapa modul:

- `index.html`: struktur screen utama
- `style.css`: seluruh styling game
- `script.js`: bootstrap dan wiring event
- `js/config.js`: level, simbol, waktu dasar, harga shop
- `js/game.js`: alur game utama, screen flow, timer, skor, hasil level
- `js/cards.js`: render kartu, reveal, hint, shuffle
- `js/shop.js`: logika item shop
- `js/storage.js`: load/save/reset `localStorage`
- `js/ui.js`: update tampilan, pergantian screen, statistik, panel menu
- `js/audio.js`: BGM, SFX, volume, mute

## Catatan Teknis

- JavaScript dimuat sebagai `type="module"`
- Beberapa helper debug masih tersedia dari console browser, misalnya:

```js
previewLevel(3)
```

Itu hanya untuk testing tampilan dan bukan fitur gameplay utama.
