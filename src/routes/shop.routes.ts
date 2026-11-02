import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as shopController from '../controllers/shop.controller';

const router = Router();

// Public browsing (accessible by anyone, even before login)
router.get('/categories', shopController.getCategories);
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProduct);

// Protected routes (Cart & Orders require authenticated user)
router.use(authenticate);

// Cart
router.get('/cart', shopController.getCart);
router.post('/cart/items', shopController.addToCart);
router.patch('/cart/items/:itemId', shopController.updateCartItem);
router.delete('/cart/items/:itemId', shopController.removeFromCart);
router.delete('/cart', shopController.clearCart);

// Orders
router.post('/orders', shopController.placeOrder);
router.get('/orders', shopController.getMyOrders);
router.get('/orders/:id', shopController.getMyOrder);

export default router;
