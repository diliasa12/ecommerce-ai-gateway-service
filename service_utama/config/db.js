import mysql from "mysql2/promise";
import "dotenv/config";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_produk VARCHAR(255) NOT NULL,
                deskripsi TEXT,
                rating DECIMAL(3,2) DEFAULT 5.0,
                kategori VARCHAR(100),
                estimasi_harga INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    connection.release();
    console.log('Database & Tabel "products" siap digunakan.');
  } catch (error) {
    console.error("Gagal menginisialisasi database:", error.message);
  }
};

initDB();

export default pool;
