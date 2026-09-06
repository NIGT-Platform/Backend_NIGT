import { Request, Response, NextFunction } from 'express';
import * as tripService from '../service/trip.service';
import {
  startTripSchema,
  deliverySchema,
  completeTripSchema,
  cancelTripSchema,
} from '../validators/trip.validators';
import { TripStatus } from '@prisma/client';

export const getTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search } = req.query;

    const trips = await tripService.getTrips({
      status: status as TripStatus,
      search: search as string,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await tripService.getTripById(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

export const startTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = startTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const trip = await tripService.startTrip(req.params.id as string, req.user!.id, parsed.data);
    res.status(200).json({ success: true, message: 'Trip started successfully', trip });
  } catch (error) {
    next(error);
  }
};

export const updateTripStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const trip = await tripService.updateTripStatus(
      req.params.id as string,
      req.user!.id,
      status as TripStatus
    );
    res.status(200).json({ success: true, message: `Trip status updated to ${status}`, trip });
  } catch (error) {
    next(error);
  }
};

export const recordDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = deliverySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const proofDocumentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const result = await tripService.recordDelivery(
      req.params.id as string,
      req.user!.id,
      parsed.data,
      proofDocumentUrl
    );

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed successfully',
      trip: result.trip,
      delivery: result.delivery,
    });
  } catch (error) {
    next(error);
  }
};

export const completeTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = completeTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const trip = await tripService.completeTrip(req.params.id as string, req.user!.id, parsed.data);
    res.status(200).json({ success: true, message: 'Trip completed successfully', trip });
  } catch (error) {
    next(error);
  }
};

export const cancelTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = cancelTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const trip = await tripService.cancelTrip(
      req.params.id as string,
      parsed.data.reason,
      req.user!.id,
      req.user!.role
    );
    res.status(200).json({ success: true, message: 'Trip cancelled successfully', trip });
  } catch (error) {
    next(error);
  }
};
