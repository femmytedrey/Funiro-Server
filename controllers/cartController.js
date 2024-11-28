const Cart = require("../models/cartModel");
const Product = require("../models/productsModel");
const getCart = async (req, res) => {
  try {
    const userId = req.user.uid;

    //find the user's cart
    const cart = await Cart.findOne({
      user: userId,
      status: { $in: ["active", "completed"] },
    }).populate("items.product", "name price images");

    //check if cart exist
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.status(200).json({ cart });
  } catch (error) {
    console.log("Error fetching cart: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.uid;

    //input validation
    if (!productId || !quantity) {
      return res.status(400).json({ error: "product and quantity is requied" });
    }

    //find product in the database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "product not found" });
    }

    // Find the user's cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({
      user: userId,
      status: { $in: ["active", "completed"] },
    });
    if (!cart) {
      const newCart = new Cart({ user: userId, items: [], status: "active" });
      cart = await newCart.save();
      console.log("New cart created:", cart);
    }

    // Check if the product is already in the cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      //product exist in cart? update the quantity
      cart.items[cartItemIndex].quantity += quantity;
      //price update incase it changed
      cart.items[cartItemIndex].price = product.price * quantity;
    } else {
      //product not in cart? add new product
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    // Save the updated cart
    await cart.save();

    // Populate product details for the response
    await cart.populate("items.product", "name price images");

    res
      .status(200)
      .json({ message: "Product added to cart successfully", cart: cart });
  } catch (error) {
    console.log("Failed to add to cart: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.uid;

    //input validation
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    //find cart
    const cart = await Cart.findOne({
      user: userId,
      status: { $in: ["active", "completed"] },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    //find product in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    //update quantity
    cart.items[itemIndex].quantity = quantity;

    await cart.save();

    //populate product details for the response
    await cart.populate("items.product", "name price images");

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.log("Error updating cart: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.uid;

    //find cart
    const cart = await Cart.findOne({
      user: userId,
      status: { $in: ["active", "completed"] },
    });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Prodcut not found in cart" });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();
    await cart.populate("items.product", "name price images");

    res
      .status(200)
      .json({ message: "Item removed from cart successfully", cart });
  } catch (error) {
    console.log("unable to deleteitem: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCart,
  addCart,
  updateCart,
  deleteCart,
};
