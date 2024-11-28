const Checkout = require("../models/CheckoutModel");
const dotenv = require("dotenv");
const Cart = require("../models/cartModel");
const mongoose = require("mongoose");

dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getCheckouts = async (req, res) => {
  try {
    const userId = req.user.uid;

    const checkouts = await Checkout.find({ user: userId })
      .populate({
        path: "cart",
        populate: {
          path: "items.product",
          select: "name price images",
        },
      })
      .sort({ createdAt: -1 });

    if (!checkouts) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    res.status(200).json({ checkouts });
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createCheckout = async (req, res) => {
  try {
    const { deliveryDetails, paymentMethod } = req.body;
    const userId = req.user.uid;

    // Input validation
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "shippingAddress",
      "phone",
      "country",
      "state",
      "city",
      "zipCode",
    ];

    const validationErrors = {};

    requiredFields.forEach((field) => {
      if (!deliveryDetails[field]) {
        validationErrors[field] = `${field} is required`;
      }
    });
    //email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (deliveryDetails.email && !emailRegex.test(deliveryDetails.email)) {
      validationErrors.email = "Invalid email format";
    }
    // Validate phone format (customize regex as needed)
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (deliveryDetails.phone && !phoneRegex.test(deliveryDetails.phone)) {
      validationErrors.phone = "Invalid phone number format";
    }

    // Validate payment method
    if (!["cashOnDelivery", "card"].includes(paymentMethod)) {
      validationErrors.paymentMethod = "Invalid payment method";
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(422).json({
        error: "Validation failed",
        errors: validationErrors,
      });
    }

    const currentCart = await Cart.findOne({
      user: userId,
      status: { $in: ["active", "completed"] },
    });

    if (!currentCart || !currentCart.items.length) {
      return res
        .status(404)
        .json({ error: "Cart is empty. Please add items before checkout." });
    }

    // Check for existing checkout
    let checkout = await Checkout.findOne({ cart: currentCart._id });
    let saveOperations = [];

    if (currentCart.status === "archived") {
      // Create new checkout for archived cart
      checkout = new Checkout({
        user: userId,
        cart: currentCart._id,
        deliveryDetails,
        paymentMethod,
      });

      // Create new active cart
      const newCart = new Cart({
        user: userId,
        items: [],
        status: "active",
      });
      saveOperations.push(newCart.save());
      response.newCartId = newCart._id;
    } else {
      // Update existing checkout or create new one
      if (checkout) {
        checkout.deliveryDetails = deliveryDetails;
        checkout.paymentMethod = paymentMethod;
      } else {
        checkout = new Checkout({
          user: userId,
          cart: currentCart._id,
          deliveryDetails,
          paymentMethod,
        });
      }

      if (currentCart.status === "active") {
        currentCart.status = "completed";
      }
    }

    if (paymentMethod === "cashOnDelivery") {
      checkout.paymentStatus = "completed";
      currentCart.status = "archived";

      // Create new active cart
      const newCart = new Cart({
        user: userId,
        items: [],
        status: "active",
      });
      saveOperations.push(newCart.save());
    }

    saveOperations.push(checkout.save(), currentCart.save());
    await Promise.all(saveOperations);

    const response = {
      message: "Checkout processed successfully",
      checkout,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error in checkout route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createSession = async (req, res) => {
  const { checkoutId } = req.body;
  const userId = req.user.uid;
  try {
    if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
      return res.status(400).json({ error: "Invalid checkoutId" });
    }

    //find checkout
    const checkout = await Checkout.findOne({
      _id: checkoutId,
      user: userId,
    }).populate({
      path: "cart",
      populate: {
        path: "items.product",
        select: "name price images",
      },
    });
    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }
    // if(checkout.paymentStatus === "completed"){
    //     return res.status(400).json({ error: "Checkout already completed" });
    // }

    //create or format lineItems
    const lineItems = checkout.cart.items.map((item) => {
      const imageUrl = item.product.images?.[0];
      const validImageUrl =
        imageUrl && imageUrl.startsWith("https://") ? [imageUrl] : [];
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product.name,
            images: validImageUrl,
          },
          unit_amount: item.product.price * 100,
        },
        quantity: item.quantity,
      };
    });

    //create the stripe checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: checkout.deliveryDetails.email,
      //where to go after payment
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
      //Save IDs for later
      metadata: {
        checkoutId: checkout._id.toString(),
        userId: userId,
      },
    });

    console.log(session.url);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ error: "Payment session creation failed" });
  }
};

const getSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ checkoutId: session.metadata.checkoutId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCheckout = async (req, res) => {
  const { checkoutId } = req.params;
  const user = req.user.uid;

  if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
    return res.status(400).json({ error: "Invalid checkoutId" });
  }

  try {
    const checkout = await Checkout.findOne({
      _id: checkoutId,
      user: user,
    }).populate({
      path: "cart",
      populate: {
        path: "items.product",
        select: "name price images",
      },
    });

    //just testing
    // console.log(checkout.cart.items.map((item) => {
    //     return {
    //         name: item.product.name,
    //         price: item.product.price,
    //         quantity: item.quantity,
    //         images: item.product.images[0],
    //     }
    // }), "here we are");

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }
    res.status(200).json({ checkout });
  } catch (error) {
    console.error("Error fetching checkouts", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCheckout = async (req, res) => {
  const { checkoutId } = req.params;
  const user = req.user.uid;
  try {
    if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
      return res.status(400).json({ error: "Invalid checkoutId" });
    }
    const checkout = await Checkout.findOneAndDelete({
      _id: checkoutId,
      user: user,
    });

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    await Promise.all([
      checkout.deleteOne(),
      Cart.deleteOne({ _id: checkout.cart._id }),
    ]);

    res.status(200).json({
      message: "Checkout and associated cart deleted successfully",
      deletedCheckoutId: checkoutId,
      deletedCartId: checkout.cart._id,
    });
  } catch (error) {
    console.error("Error fetching checkouts", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateCheckout = async (req, res) => {
  try {
    const { checkoutId } = req.params;
    const { deliveryDetails, paymentMethod, paymentStatus } = req.body;
    const userId = req.user.uid;

    const checkout = await Checkout.findOne({
      _id: checkoutId,
      user: userId,
    });

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    if (checkout.paymentStatus === "completed") {
      return res.status(400).json({ error: "Checkout already completed" });
    }

    // Update only provided delivery details fields
    if (deliveryDetails) {
      Object.keys(deliveryDetails).forEach((key) => {
        if (deliveryDetails[key]) {
          checkout.deliveryDetails[key] = deliveryDetails[key];
        }
      });
    }

    if (paymentMethod) checkout.paymentMethod = paymentMethod;
    if (paymentStatus) {
      checkout.paymentStatus = paymentStatus;

      if (paymentStatus === "completed") {
        await Cart.findByIdAndUpdate(checkout.cart, { status: "archived" });
        const newCart = new Cart({
          user: userId,
          items: [],
          status: "active",
        });
        await newCart.save();
      }
    }

    await checkout.save();

    res.status(200).json({
      message: "Checkout updated successfully",
      checkout,
    });
  } catch (error) {
    console.error("Error updating checkout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCheckouts,
  createCheckout,
  createSession,
  getSession,
  getCheckout,
  deleteCheckout,
  updateCheckout,
};
