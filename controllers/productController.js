const mongoose = require('mongoose')
const Product = require("../models/productsModel");

const allProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch product" });
  }
};

const singleProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "No product found" });
    }
    res.status(200).json(product);
  } catch (error) {
    return res.status(400).json({ error: "Unable to fetch product" });
  }
};

const createProduct = async (req, res) => {
  const {
    name,
    description,
    additionalDescription,
    price,
    originalPrice,
    images,
    additionalImages,
    size,
    tags,
    category,
    promoPercentage,
  } = req.body;

  const emptyFields = [];

  if (!name) {
    emptyFields.push("name");
  }
  if (!description) {
    emptyFields.push("description");
  }
  if (!price) {
    emptyFields.push("price");
  }
  if (!images) {
    emptyFields.push("images");
  }
  if (!tags) {
    emptyFields.push("tags");
  }
  if (!category) {
    emptyFields.push("category");
  }

  if (emptyFields.length > 0) {
    return res
      .status(400)
      .json({ error: "Please fill in the required fields", emptyFields });
  }

  try {
    const product = await Product.create({
      name,
      description,
      additionalDescription: additionalDescription || "",
      price,
      originalPrice,
      images,
      additionalImages: additionalImages || [],
      size: size || "",
      tags,
      category,
      promoPercentage: promoPercentage || 0,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Unable to add product" });
  }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
  
    const {
      name,
      description,
      price,
      additionalDescription,
      originalPrice,
      images,
      additionalImages,
      size,
      tags,
      category,
      promoPercentage,
    } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
  
    const emptyFields = [];
  
    if (!name) {
      emptyFields.push("name");
    }
    if (!description) {
      emptyFields.push("description");
    }
    if (!price) {
      emptyFields.push("price");
    }
    if (!images) {
      emptyFields.push("images");
    }
    if (!tags) {
      emptyFields.push("tags");
    }
    if (!category) {
      emptyFields.push("category");
    }
  
    if (emptyFields.length > 0) {
      return res
        .status(400)
        .json({ error: "Please fill in the required fields", emptyFields });
    }
  
    const updatedField = {
      name,
      description,
      price,
      additionalDescription: additionalDescription || '',
      originalPrice,
      images,
      additionalImages: additionalImages || [],
      size: size || "",
      tags,
      category,
      promoPercentage: promoPercentage || 0,
    };
  
    try {
      const product = await Product.findByIdAndUpdate(id, updatedField, {
        new: true,
        runValidators: true,
      });
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ error: "Unable to update product" });
    }
  }

module.exports = {
  allProducts,
  singleProduct,
  createProduct,
  updateProduct,
};
