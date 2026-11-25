# SKYSCORE — Prediksi Kepuasan Penumpang Maskapai

Aplikasi web dan model *Machine Learning* untuk memprediksi tingkat kepuasan penumpang maskapai penerbangan berdasarkan data profil perjalanan, jadwal penerbangan, dan 14 aspek penilaian layanan menggunakan algoritma **Random Forest Classifier**.

Proyek ini dibuat untuk memenuhi tugas Ujian Tengah Semester (UTS) mata kuliah **Pembelajaran Mesin**.

---

## Ringkasan Model & Dataset

- **Dataset:** [Airline Passenger Satisfaction (Kaggle)](https://www.kaggle.com/datasets/mysarahmadbhat/airline-passenger-satisfaction)
- **Jumlah Data:** 129.880 penumpang (103.904 data latih / 25.976 data uji, rasio 80:20)
- **Jumlah Fitur:** 22 fitur (profil penumpang, jarak & keterlambatan penerbangan, serta 14 penilaian layanan)
- **Algoritma:** Random Forest Classifier (`scikit-learn==1.9.1`)

### Metrik Evaluasi (Data Uji)

| Metrik | Nilai |
| :--- | :--- |
| **Accuracy** | 96,2% (`0.9622`) |
| **Precision** | 97,0% (`0.9702`) |
| **Recall** | 94,2% (`0.9420`) |
| **F1-Score** | 95,6% (`0.9559`) |
| **ROC-AUC** | 99,4% (`0.9938`) |

---

## Fitur Aplikasi Web

- **Formulir Prediksi 3 Langkah:** Input data penumpang, detail penerbangan, dan 14 penilaian layanan (skala 0–5).
- **Boarding Pass Hasil Prediksi:** Menampilkan status prediksi (*Puas* / *Tidak Puas*), probabilitas kepuasan, dan ringkasan perjalanan.
- **Rekomendasi Peningkatan Layanan:** Simulasi sensitivitas model untuk menampilkan hingga 3 aspek layanan dengan dampak kenaikan peluang puas terbesar apabila nilainya ditingkatkan 1 poin.
- **Dashboard Transparansi Model:** Menampilkan metrik evaluasi, *Confusion Matrix*, dan 10 fitur paling berpengaruh (*Feature Importance*).

---

## Struktur Direktori

```text
UTS-ML-Kepuasan-Penumpang/
├── 01_colab/
│   └── Kepuasan_Penumpang_RandomForest.ipynb   # Notebook eksplorasi & pelatihan model (Google Colab)
├── 02_webapp/
│   ├── app.py                                  # Server Flask & REST API
│   ├── train_model.py                          # Script latih ulang model via CLI
│   ├── requirements.txt                        # Dependensi Python
│   ├── Procfile                                # Konfigurasi start command untuk deployment
│   ├── model/
│   │   ├── model.joblib                        # Artefak model Random Forest terlatih
│   │   ├── metrics.json                        # Metrik evaluasi model
│   │   └── feature_importance.json             # Skor kepentingan fitur
│   ├── templates/
│   │   └── index.html                          # Halaman utama aplikasi
│   └── static/
│       ├── css/style.css                       # Styling antarmuka
│       ├── js/main.js                          # Logika interaksi & animasi scroll
│       └── img/sky.jpg                         # Aset gambar latar belakang
└── README.md
```

---

## Menjalankan Notebook Pelatihan Model (Google Colab)

Folder `01_colab/` berisi notebook `Kepuasan_Penumpang_RandomForest.ipynb` yang dirancang untuk dijalankan di **Google Colab** (menggunakan `google.colab.files` untuk unggah dataset dan unduh hasil model):

1. Unduh dataset `airline_passenger_satisfaction.csv` dari [Kaggle](https://www.kaggle.com/datasets/mysarahmadbhat/airline-passenger-satisfaction).
2. Buka [colab.research.google.com](https://colab.research.google.com), lalu pilih **File > Upload notebook** dan unggah `01_colab/Kepuasan_Penumpang_RandomForest.ipynb`.
3. Jalankan seluruh sel dari atas hingga bawah (**Runtime > Run all**). Saat sel unggah muncul, pilih file `airline_passenger_satisfaction.csv`.
4. Di akhir eksekusi, notebook akan mengunduh arsip `model_kepuasan_penumpang.zip` berisi `model.joblib`, `metrics.json`, dan `feature_importance.json`.
5. Ekstrak berkas tersebut ke dalam folder `02_webapp/model/` (opsional, karena model terlatih bawaan sudah tersedia di `02_webapp/model/`).

---

## Cara Menjalankan di Komputer Lokal

1. Masuk ke direktori web app:
   ```bash
   cd 02_webapp
   ```

2. Instal seluruh dependensi:
   ```bash
   pip install -r requirements.txt
   ```

3. Jalankan server Flask:
   ```bash
   python app.py
   ```

4. Buka browser dan akses:
   ```text
   http://127.0.0.1:5000
   ```

### Melatih Ulang Model (Opsional)

Jika ingin melatih ulang model dari file CSV dataset Kaggle:
```bash
cd 02_webapp
python train_model.py path/ke/airline_passenger_satisfaction.csv
```
Perintah ini akan memperbarui berkas `model.joblib`, `metrics.json`, dan `feature_importance.json` di folder `02_webapp/model/`.

---

## Endpoint API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/` | Halaman utama aplikasi web SKYSCORE |
| `POST` | `/api/predict` | Menerima JSON 22 fitur perjalanan, mengembalikan status kepuasan, probabilitas, dan rekomendasi peningkatan layanan |
| `GET` | `/api/model-info` | Mengembalikan metrik evaluasi model dan daftar 10 fitur paling berpengaruh |
| `GET` | `/healthz` | *Health check* status server (`{"status": "ok"}`) |

---

## Deployment

Folder `02_webapp` sudah dilengkapi berkas `Procfile` untuk deployment ke platform PaaS seperti **Render** atau **Railway**:

```procfile
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

Pastikan *Root Directory* pada platform deployment diarahkan ke `02_webapp` (jika repo berisi folder `01_colab` dan `02_webapp`).

---

## Catatan & Keterbatasan

- Nilai `0` pada kolom penilaian layanan menandakan layanan tersebut tidak berlaku bagi penumpang.
- Dataset berasal dari maskapai Amerika Serikat, sehingga hasil prediksi tidak otomatis mencerminkan karakteristik penumpang maskapai di wilayah lain.
- Bagian *"Peningkatan dengan dampak terbesar"* merupakan perkiraan simulasi model (menaikkan skor 1 poin lalu memprediksi ulang), bukan hubungan sebab-akibat kausal.
