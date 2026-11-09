import { Request, Response, NextFunction } from 'express';
import * as shopService from '../service/shop.service';
import { uploadFileToCloudinary } from '../utils/cloudinary.util';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const str = (v: unknown): string => (Array.isArray(v) ? String(v[0]) : String(v ?? ''));

// ─── Categories ───────────────────────────────────────────────────────────────

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const category = await shopService.createCategory(name, slug);
    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) { next(error); }
};

export const listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await shopService.getAllCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const category = await shopService.updateCategory(str(req.params.id), { name, slug });
    res.status(200).json({ success: true, message: 'Category updated successfully', category });
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shopService.deleteCategory(str(req.params.id));
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) { next(error); }
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, name, description, price, stockQty, sku, isActive } = req.body;
    const product = await shopService.createProduct({
      categoryId,
      name,
      description,
      price: Number(price),
      stockQty: Number(stockQty),
      sku: sku || undefined,
      isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : true,
    });
    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) { next(error); }
};

export const listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, search, isActive } = req.query;
    let isActiveParsed: boolean | undefined;
    if (isActive !== undefined) isActiveParsed = isActive === 'true';

    const products = await shopService.getAllProductsAdmin({
      categoryId: categoryId ? str(categoryId) : undefined,
      search: search ? str(search) : undefined,
      isActive: isActiveParsed,
    });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) { next(error); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, name, description, price, stockQty, sku, isActive } = req.body;
    const data: Record<string, unknown> = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (stockQty !== undefined) data.stockQty = Number(stockQty);
    if (sku !== undefined) data.sku = sku;
    if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';

    const product = await shopService.updateProduct(str(req.params.id), data as Parameters<typeof shopService.updateProduct>[1]);
    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shopService.deleteProduct(str(req.params.id));
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { next(error); }
};

// ─── Product Images ───────────────────────────────────────────────────────────

export const addProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'Image file is required' }); return; }
    const isPrimary = req.body.isPrimary === 'true';
    const imageUrl = await uploadFileToCloudinary(req.file, 'products');
    const image = await shopService.addProductImage(str(req.params.id), imageUrl, isPrimary);
    res.status(201).json({ success: true, message: 'Image added successfully', image });
  } catch (error) { next(error); }
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await shopService.deleteProductImage(str(req.params.imageId));
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) { next(error); }
};

// ─── Admin Orders ─────────────────────────────────────────────────────────────

export const listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search } = req.query;
    const orders = await shopService.getAllOrders({
      status: status ? str(status) : undefined,
      search: search ? str(search) : undefined,
    });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const order = await shopService.updateOrderStatus(str(req.params.id), status as OrderStatus);
    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) { next(error); }
};
