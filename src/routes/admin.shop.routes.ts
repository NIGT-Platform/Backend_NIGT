import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import * as adminShopController from '../controllers/admin.shop.controller';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// Categories
router.post('/categories', adminShopController.createCategory);
router.get('/categories', adminShopController.listCategories);
router.put('/categories/:id', adminShopController.updateCategory);
router.delete('/categories/:id', adminShopController.deleteCategory);

// Products
router.post('/products', adminShopController.createProduct);
router.get('/products', adminShopController.listProducts);
router.put('/products/:id', adminShopController.updateProduct);
router.delete('/products/:id', adminShopController.deleteProduct);

// Product Images
router.post('/products/:id/images', upload.single('image'), adminShopController.addProductImage);
router.patch('/products/:id/images/:imageId/primary', adminShopController.setPrimaryImage);
router.delete('/products/images/:imageId', adminShopController.deleteProductImage);

// Orders
router.get('/orders', adminShopController.listOrders);
router.patch('/orders/:id/status', adminShopController.updateOrderStatus);

// Cloudinary diagnostics
router.get('/cloudinary-status', adminShopController.getCloudinaryConfigStatus);

export default router;
