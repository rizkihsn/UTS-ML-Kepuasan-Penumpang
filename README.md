# Prediksi Kepuasan Penumpang Maskapai (Random Forest)

Proyek UTS Pembelajaran Mesin. Berisi notebook Google Colab untuk melatih model dan web app Flask yang siap di-deploy.

- **Dataset:** [Airline Passenger Satisfaction (Kaggle)](https://www.kaggle.com/datasets/mysarahmadbhat/airline-passenger-satisfaction)
- **Model:** Random Forest Classifier (100 pohon, `max_depth=18`, `min_samples_leaf=3`)
- **Hasil uji (20% data):** accuracy 96,2%, precision 97,0%, recall 94,2%, F1 95,6%, ROC-AUC 99,4%

## Isi folder

```
UTS-ML-Kepuasan-Penumpang/
├── 01_colab/
│   └── Kepuasan_Penumpang_RandomForest.ipynb   <- buka di Google Colab
├── 02_webapp/
│   ├── app.py                 <- server Flask + API prediksi
│   ├── train_model.py         <- latih ulang model dari terminal (opsional)
│   ├── requirements.txt
│   ├── Procfile, render.yaml  <- konfigurasi deploy
│   ├── model/                 <- model.joblib, metrics.json, feature_importance.json
│   ├── templates/index.html
│   └── static/ (css, js, img)
└── README.md
```

## Langkah 1: Jalankan notebook di Colab

1. Unduh `airline_passenger_satisfaction.csv` dari Kaggle.
2. Buka `01_colab/Kepuasan_Penumpang_RandomForest.ipynb` di [colab.research.google.com](https://colab.research.google.com) (File > Upload notebook).
3. Jalankan semua sel dari atas. Saat sel unggah muncul, pilih file CSV tadi.
4. Sel terakhir mengunduh `model_kepuasan_penumpang.zip`.
5. Ekstrak zip itu dan **timpa** isi `02_webapp/model/` (3 berkas). Ini penting agar model di web app berasal dari notebook Anda sendiri.
6. Lihat angka `Versi scikit-learn` yang tercetak di akhir notebook. Ubah baris `scikit-learn==...` di `02_webapp/requirements.txt` agar sama dengan versi itu, supaya model bisa dimuat tanpa error.

> Model bawaan di folder `model/` sudah dilatih dengan kode yang sama, jadi web app bisa langsung dicoba sebelum Anda menjalankan Colab.

## Langkah 2: Coba web app di komputer

```bash
cd 02_webapp
pip install -r requirements.txt
python app.py
```

Buka http://127.0.0.1:5000

## Langkah 3: Unggah ke GitHub

```bash
cd 02_webapp
git init
git add .
git commit -m "Web app prediksi kepuasan penumpang"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

Folder `01_colab` boleh ikut diunggah sebagai repositori terpisah atau dimasukkan ke repo yang sama.

## Langkah 4: Deploy (pilih salah satu)

**Render (gratis, paling mudah)**
1. Daftar di render.com, pilih New > Web Service, lalu hubungkan repo GitHub.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
4. Klik Deploy. Tautan hasilnya yang dilampirkan ke laporan.

Catatan: layanan gratis Render tertidur jika lama tidak dipakai, jadi buka tautannya sekali sebelum presentasi atau merekam video.

**Alternatif:** PythonAnywhere atau Hugging Face Spaces (pilih SDK Docker).

## Checklist pengumpulan UTS

- [ ] Link aplikasi yang di-deploy
- [ ] Link GitHub repository
- [ ] Laporan artikel (PDF dan DOC, 2 kolom, Times New Roman 10, 6 sampai 10 halaman)
- [ ] Hasil Turnitin (di bawah 25%) dan cek AI detection (di bawah 30%)
- [ ] Video demo (YouTube) dan tautannya dicantumkan di laporan
- [ ] File Google Colab (.ipynb)
- [ ] Jurnal rujukan (diunggah ke Drive)

## Catatan penting

- Kolom rating bernilai 0 berarti layanan tidak berlaku bagi penumpang.
- Dataset berasal dari maskapai Amerika, jadi hasilnya tidak otomatis berlaku untuk maskapai Indonesia. Cantumkan ini sebagai keterbatasan di laporan.
- Bagian "Peningkatan dengan dampak terbesar" di kartu hasil adalah perkiraan model (menaikkan satu penilaian lalu memprediksi ulang), bukan hubungan sebab-akibat.
- Font tampilan (Cormorant Garamond dan Inter) dimuat dari Google Fonts. Tanpa internet, tampilan memakai font serif bawaan.
