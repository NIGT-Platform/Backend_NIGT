import { Request, Response, NextFunction } from 'express';
import * as adminService from '../service/admin.service';

// GET /api/admin/users
export const getAllUsers = async (
  _req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/pending
export const getPendingUsers = async (
  _req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const users = await adminService.getPendingUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
export const getUserById = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.getUserById(req.params.id as string);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/approve
export const approveUser = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.approveUser(req.params.id as string);
    res.status(200).json({ success: true, message: 'User approved successfully', user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/reject
export const rejectUser = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.rejectUser(req.params.id as string);
    res.status(200).json({ success: true, message: 'User rejected', user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/suspend
export const suspendUser = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const user = await adminService.suspendUser(req.params.id as string);
    res.status(200).json({ success: true, message: 'User suspended', user });
  } catch (error) {
    next(error);
  }
};

