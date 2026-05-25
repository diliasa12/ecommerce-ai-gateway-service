import pool from "../config/db.js";
import axios from "axios";

const createProduct = async (req, res) => {
  const { nama_produk, deskripsi, rating } = req.body;

  if (!nama_produk) {
    return res.status(400).json({ message: "Nama produk wajib diisi." });
  }

  try {
    let kategori = "Uncategorized";
    let estimasi_harga = 0;

    try {
      const mlResponse = await axios.post(
        `${process.env.ML_SERVICE_URL}/predict-metadata`,
        {
          nama_produk: nama_produk,
          rating: parseFloat(rating) || 5.0,
        },
      );

      if (mlResponse.data && mlResponse.data.status === "success") {
        kategori = mlResponse.data.data.kategori_otomatis;
        estimasi_harga = mlResponse.data.data.estimasi_harga;
      }
    } catch (mlError) {
      console.error(
        "ML Service tidak merespons, menggunakan data default.",
        mlError.message,
      );
    }

    const [result] = await pool.query(
      `INSERT INTO products (nama_produk, deskripsi, rating, kategori, estimasi_harga) VALUES (?, ?, ?, ?, ?)`,
      [nama_produk, deskripsi || null, rating || 5.0, kategori, estimasi_harga],
    );

    res.status(201).json({
      status: "success",
      message: "Produk berhasil ditambahkan dengan rekomendasi AI!",
      data: {
        id: result.insertId,
        nama_produk,
        deskripsi,
        rating: rating || 5.0,
        kategori,
        estimasi_harga,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error saat menyimpan produk.",
      error: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    res.status(200).json({ status: "success", data: rows });
  } catch (error) {
    res.status(500).json({
      message: "Server error saat mengambil data.",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Produk tidak ditemukan." });

    res.status(200).json({ status: "success", data: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nama_produk, deskripsi, rating } = req.body;

  try {
    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0)
      return res.status(404).json({ message: "Produk tidak ditemukan." });

    let kategori = existing[0].kategori;
    let estimasi_harga = existing[0].estimasi_harga;

    const currentNama =
      nama_produk !== undefined ? nama_produk : existing[0].nama_produk;
    const currentRating =
      rating !== undefined
        ? parseFloat(rating)
        : parseFloat(existing[0].rating);

    const oldNama = existing[0].nama_produk;
    const oldRating = parseFloat(existing[0].rating);

    if (currentNama !== oldNama || currentRating !== oldRating) {
      try {
        const mlResponse = await axios.post(
          `${process.env.ML_SERVICE_URL}/predict-metadata`,
          {
            nama_produk: currentNama,
            rating: currentRating,
          },
        );

        if (mlResponse.data && mlResponse.data.status === "success") {
          kategori = mlResponse.data.data.kategori_otomatis;
          estimasi_harga = mlResponse.data.data.estimasi_harga;
        }
      } catch (mlError) {
        console.error(
          "Gagal memperbarui prediksi ML, mempertahankan data lama.",
          mlError.message,
        );
      }
    }
    await pool.query(
      `UPDATE products SET nama_produk = ?, deskripsi = ?, rating = ?, kategori = ?, estimasi_harga = ? WHERE id = ?`,
      [
        currentNama,
        deskripsi !== undefined ? deskripsi : existing[0].deskripsi,
        currentRating,
        kategori,
        estimasi_harga,
        id,
      ],
    );

    res.status(200).json({
      status: "success",
      message: "Produk berhasil diperbarui dengan penyesuaian AI!",
      data: {
        id,
        nama_produk: currentNama,
        kategori,
        estimasi_harga,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error saat memperbarui produk.",
      error: error.message,
    });
  }
};
// 5. DELETE
const deleteProduct = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Produk tidak ditemukan." });

    res
      .status(200)
      .json({ status: "success", message: "Produk berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
};
