import os
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


csv_filename = 'products.csv'
output_dir = 'models' 


os.makedirs(output_dir, exist_ok=True)


if not os.path.exists(csv_filename):
    raise FileNotFoundError(f"File '{csv_filename}' tidak ditemukan di folder service python ini!")

print("--> Membaca dataset lokal 'products.csv'...")
df = pd.read_csv(csv_filename, low_memory=False)

print("--> Menyeleksi dan membersihkan kolom...")
df = df[['name', 'category_name', 'rating', 'price']].dropna()

df = df.rename(columns={
    'name': 'Nama Produk',
    'category_name': 'Kategori',
    'rating': 'Rating',
    'price': 'Harga'
})

df['Harga'] = pd.to_numeric(df['Harga'], errors='coerce')
df['Rating'] = pd.to_numeric(df['Rating'], errors='coerce')
df = df.dropna()

print(f"--> Total data yang siap digunakan untuk training: {len(df)} baris.")

X_text = df['Nama Produk']
y_cat = df['Kategori']

indo_stopwords = ['yang', 'untuk', 'dan', 'dengan', 'di', 'ke', 'ini', 'itu', 'bisa', 'murah', 'promo', 'ready', 'stok']

model_kategori = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words=indo_stopwords, max_features=5000)),
    ('clf', LogisticRegression(max_iter=1000))
])

print("--> Memulai training Model Kategori (Klasifikasi)...")
model_kategori.fit(X_text, y_cat)

path_kategori = os.path.join(output_dir, 'model_kategori.pkl')
with open(path_kategori, 'wb') as f:
    pickle.dump(model_kategori, f)
print(f"✓ {path_kategori} berhasil disimpan!")

X_reg = df[['Kategori', 'Rating']]
y_price = df['Harga']

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['Kategori'])
    ], remainder='passthrough'
)

model_harga = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42)) # <-- Gunakan ini
])

print("--> Memulai training Model Estimasi Harga (Regresi)...")
model_harga.fit(X_reg, y_price)

path_harga = os.path.join(output_dir, 'model_harga.pkl')
with open(path_harga, 'wb') as f:
    pickle.dump(model_harga, f)
print(f"✓ {path_harga} berhasil disimpan!")

print(f"\n[PROSES SELESAI] Semua model disimpan rapi di dalam folder '{output_dir}'.")