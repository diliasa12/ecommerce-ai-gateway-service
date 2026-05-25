# 1. Gunakan base image Python resmi yang ringan (slim)
FROM python:3.11-slim

# 2. Set environment variables agar Python tidak menulis file .pyc dan output langsung dicetak ke log
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set folder kerja di dalam *container*
WORKDIR /app

# 4. Install dependencies OS yang mungkin dibutuhkan oleh scikit-learn/pandas (opsional tapi aman untuk slim image)
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

# 5. Salin file requirements.txt terlebih dahulu (manfaatkan Docker layer caching)
COPY requirements.txt .

# 6. Install seluruh library Python yang dibutuhkan
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

# 7. Salin source code aplikasi dan folder hasil training
COPY app.py .
COPY models/ ./models/

# 8. Buka port 8000 di dalam container (port bawaan FastAPI kita)
EXPOSE 8000

# 9. Perintah untuk menjalankan FastAPI menggunakan Uvicorn saat container dinyalakan
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]