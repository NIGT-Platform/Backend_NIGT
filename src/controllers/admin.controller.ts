import { Request, Response, NextFunction } from 'express';
import * as adminService from '../service/admin.service';
import * as profileService from '../service/profile.service';
import prisma from '../utils/prisma.utils';

// GET /api/admin/stats
export const getDashboardStats = async (
  _req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      pendingUsers,
      totalOwners,
      totalDrivers,
      totalVehicles,
      pendingVehicles,
      approvedVehicles,
      activeAssignments,
      pendingProfileRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: 'PENDING' } }),
      prisma.user.count({ where: { role: 'VEHICLE_OWNER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.vehicle.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.vehicleAssignment.count({ where: { status: 'ACTIVE' } }),
      prisma.profileChangeRequest.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, pending: pendingUsers, owners: totalOwners, drivers: totalDrivers },
        vehicles: { total: totalVehicles, pending: pendingVehicles, approved: approvedVehicles },
        assignments: { active: activeAssignments },
        requests: { pendingProfiles: pendingProfileRequests },
      },
    });
  } catch (error) {
    next(error);
  }
};


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

// ── Profile Change Request Admin Endpoints ────────────────

// GET /api/admin/profile-requests
export const getProfileChangeRequests = async (
  _req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const requests = await profileService.getAllProfileChangeRequests();
    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/profile-requests/:id/approve
export const approveProfileChangeRequest = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const request = await profileService.approveProfileChangeRequest(req.params.id as string, adminId);
    res.status(200).json({ success: true, message: 'Profile change approved and applied', request });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/profile-requests/:id/reject
export const rejectProfileChangeRequest = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const request = await profileService.rejectProfileChangeRequest(req.params.id as string, adminId);
    res.status(200).json({ success: true, message: 'Profile change request rejected', request });
  } catch (error) {
    next(error);
  }
};
