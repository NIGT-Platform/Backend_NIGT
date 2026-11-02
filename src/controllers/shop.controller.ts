import { Request, Response, NextFunction } from 'express';
import * as shopService from '../service/shop.service';

const str = (v: unknown): string => (Array.isArray(v) ? String(v[0]) : String(v ?? ''));

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await shopService.getAllCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) { next(error); }
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, search } = req.query;
    const products = await shopService.getPublicProducts({
      categoryId: categoryId ? str(categoryId) : undefined,
      search: search ? str(search) : undefined,
    });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) { next(error); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await shopService.getProductById(str(req.params.id));
    res.status(200).json({ success: true, product });
  } catch (error) { next(error); }
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await shopService.getOrCreateCart(req.user!.id);
    res.status(200).json({ success: true, cart });
  } catch (error) { next(error); }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;
    const cartItem = await shopService.addToCart(req.user!.id, productId, Number(quantity));
    res.status(201).json({ success: true, message: 'Item added to cart', cartItem });
  } catch (error) { next(error); }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const cartItem = await shopService.updateCartItem(req.user!.id, str(req.params.itemId), Number(quantity));
    if (cartItem === null) { res.status(200).json({ success: true, message: 'Cart item removed' }); return; }
    res.status(200).json({ success: true, message: 'Cart item updated', cartItem });
  } catch (error) { next(error); }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shopService.removeCartItem(req.user!.id, str(req.params.itemId));
    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) { next(error); }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shopService.clearCart(req.user!.id);
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) { next(error); }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shippingAddress, notes } = req.body;
    const order = await shopService.placeOrder(req.user!.id, shippingAddress, notes);
    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) { next(error); }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await shopService.getUserOrders(req.user!.id);
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) { next(error); }
};

export const getMyOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await shopService.getOrderById(req.user!.id, str(req.params.id));
    res.status(200).json({ success: true, order });
  } catch (error) { next(error); }
};
