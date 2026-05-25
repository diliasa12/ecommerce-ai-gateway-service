import pickle
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(
    title="E-Commerce ML Service",
    description="Service untuk auto-tagging kategori dan estimasi harga produk berdasarkan data Tokopedia 2025",
    version="1.0.0"
)


try:
    with open('./models/model_kategori.pkl', 'rb') as f:
        model_cat = pickle.load(f)

    with open('./models/model_harga.pkl', 'rb') as f:
        model_price = pickle.load(f)
    print("✓ Semua model .pkl berhasil dimuat.")
except FileNotFoundError:
    print("❌ Error: File .pkl tidak ditemukan. Jalankan 'python train.py' terlebih dahulu!")



class RequestProduk(BaseModel):
    nama_produk: str = Field(..., example="Kaos Polos Cotton Combed 30s Premium")
    rating: float = Field(default=5.0, ge=1.0, le=5.0, example=4.8) 


@app.post("/predict-metadata")
def predict_metadata(data: RequestProduk):
  
    if 'model_cat' not in globals() or 'model_price' not in globals():
        raise HTTPException(status_code=500, detail="Model ML belum siap atau gagal dimuat di server.")
    
    try:
      
        pred_kategori = model_cat.predict([data.nama_produk])[0]
        
        df_input_harga = pd.DataFrame([{
            'Kategori': pred_kategori,
            'Rating': data.rating
        }])
        
        pred_harga = model_price.predict(df_input_harga)[0]
        
      
        return {
            "status": "success",
            "data": {
                "kategori_otomatis": str(pred_kategori),
                # Menggunakan max(0, ...) untuk menghindari nilai minus akibat regresi linear jika data pencilan
                "estimasi_harga": max(0, int(round(pred_harga))) 
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan saat pemrosesan ML: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}