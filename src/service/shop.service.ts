import prisma from '../utils/prisma.utils';
import { AppError } from '../middleware/error.middleware';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// ─────────────────────────────────────────────
// Product image include helper
// ─────────────────────────────────────────────

const productInclude = {
  images: true,
  category: true,
} as const;

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export const createCategory = async (name: string, slug: string) => {
  return await prisma.productCategory.create({
    data: { name, slug },
  });
};

export const getAllCategories = async () => {
  return await prisma.productCategory.findMany({
    orderBy: { name: 'asc' },
  });
};

export const updateCategory = async (
  id: string,
  data: { name?: string; slug?: string }
) => {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return await prisma.productCategory.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError('Cannot delete category that has products', 400);
  }

  await prisma.productCategory.delete({ where: { id } });
};

// ─────────────────────────────────────────────
// PRODUCTS (ADMIN)
// ─────────────────────────────────────────────

export const createProduct = async (data: {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  sku?: string;
  isActive?: boolean;
}) => {
  const category = await prisma.productCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new AppError('Category not found', 404);

  return await prisma.product.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      stockQty: data.stockQty,
      sku: data.sku,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: productInclude,
  });
};

export const updateProduct = async (
  id: string,
  data: Partial<{
    categoryId: string;
    name: string;
    description: string;
    price: number;
    stockQty: number;
    sku: string;
    isActive: boolean;
  }>
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  if (data.categoryId) {
    const category = await prisma.productCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Category not found', 404);
  }

  return await prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    throw new AppError('Cannot delete product that has associated order items', 400);
  }

  await prisma.product.delete({ where: { id } });
};

export const addProductImage = async (
  productId: string,
  imageUrl: string,
  isPrimary: boolean
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });
  if (!product) throw new AppError('Product not found', 404);

  // If this is the first image or user selected primary, set as primary
  const shouldBePrimary = isPrimary || product.images.length === 0;

  if (shouldBePrimary) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  return await prisma.productImage.create({
    data: { productId, imageUrl, isPrimary: shouldBePrimary },
  });
};

export const setPrimaryProductImage = async (productId: string, imageId: string) => {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    throw new AppError('Product image not found', 404);
  }

  await prisma.productImage.updateMany({
    where: { productId },
    data: { isPrimary: false },
  });

  return await prisma.productImage.update({
    where: { id: imageId },
    data: { isPrimary: true },
  });
};

export const deleteProductImage = async (imageId: string) => {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new AppError('Product image not found', 404);

  await prisma.productImage.delete({ where: { id: imageId } });
};

export const getAllProductsAdmin = async (params: {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}) => {
  const where: any = {};

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: productInclude,
  });
};

// ─────────────────────────────────────────────
// PRODUCTS (PUBLIC)
// ─────────────────────────────────────────────

export const getPublicProducts = async (params: {
  categoryId?: string;
  search?: string;
}) => {
  const where: any = { isActive: true };

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: productInclude,
  });
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) throw new AppError('Product not found', 404);

  return product;
};

// ─────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────

const cartInclude = {
  items: {
    include: {
      product: {
        include: { images: true },
      },
    },
  },
} as const;

export const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }

  return cart;
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found', 404);
  if (!product.isActive) throw new AppError('Product is not available', 400);

  const cart = await getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: { include: { images: true } } },
    });
  }

  return await prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity },
    include: { product: { include: { images: true } } },
  });
};

export const updateCartItem = async (
  userId: string,
  cartItemId: string,
  quantity: number
) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Cart not found', 404);

  const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
  if (!cartItem) throw new AppError('Cart item not found', 404);
  if (cartItem.cartId !== cart.id) throw new AppError('Cart item does not belong to your cart', 403);

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return null;
  }

  return await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { product: { include: { images: true } } },
  });
};

export const removeCartItem = async (userId: string, cartItemId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Cart not found', 404);

  const cartItem = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
  if (!cartItem) throw new AppError('Cart item not found', 404);
  if (cartItem.cartId !== cart.id) throw new AppError('Cart item does not belong to your cart', 403);

  await prisma.cartItem.delete({ where: { id: cartItemId } });
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export const placeOrder = async (
  userId: string,
  shippingAddress: string,
  notes?: string
) => {
  // 1. Get user's cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  // 2. Validate all products
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new AppError(`Product "${item.product.name}" is no longer available`, 400);
    }
    if (item.product.stockQty < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${item.product.name}". Available: ${item.product.stockQty}`,
        400
      );
    }
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const referenceNumber = `ORD-${Date.now()}`;

  // 3. Create order, order items, deduct stock and clear cart in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        referenceNumber,
        buyerId: userId,
        totalAmount,
        shippingAddress,
        notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: { product: { include: { images: true } } },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
        },
      },
    });

    // Deduct stock for each product
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
};

export const getUserOrders = async (userId: string) => {
  return await prisma.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: { include: { images: true } } },
      },
    },
  });
};

export const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { include: { images: true } } },
      },
      buyer: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
      },
    },
  });

  if (!order) throw new AppError('Order not found', 404);
  if (order.buyerId !== userId) throw new AppError('You are not authorized to view this order', 403);

  return order;
};

// ─────────────────────────────────────────────
// ADMIN ORDERS
// ─────────────────────────────────────────────

export const getAllOrders = async (params: {
  status?: string;
  search?: string;
}) => {
  const where: any = {};

  if (params.status) {
    where.status = params.status as OrderStatus;
  }

  if (params.search) {
    where.OR = [
      { referenceNumber: { contains: params.search, mode: 'insensitive' } },
      { shippingAddress: { contains: params.search, mode: 'insensitive' } },
      {
        buyer: {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
      },
      items: {
        include: { product: { include: { images: true } } },
      },
    },
  });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found', 404);

  return await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      buyer: {
        select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true },
      },
      items: {
        include: { product: { include: { images: true } } },
      },
    },
  });
};
