import { Request, Response, NextFunction } from 'express';
import * as jobService from '../service/job.service';
import {
  createJobSchema,
  assignJobSchema,
  updateJobSchema,
  cancelJobSchema,
} from '../validators/job.validators';
import { JobPriority, JobStatus } from '@prisma/client';

export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const job = await jobService.createJob(req.user!.id, parsed.data);
    res.status(201).json({ success: true, message: 'Transport job created successfully', job });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, search } = req.query;

    const jobs = await jobService.getJobs({
      status: status as JobStatus,
      priority: priority as JobPriority,
      search: search as string,
      userId: req.user!.id,
      userRole: req.user!.role,
    });

    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await jobService.getJobById(req.params.id as string, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

export const assignJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = assignJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const job = await jobService.assignJob(req.params.id as string, parsed.data.vehicleId, req.user!.id);
    res.status(200).json({ success: true, message: 'Vehicle and driver assigned to job successfully', job });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = updateJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const job = await jobService.updateJob(req.params.id as string, parsed.data, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, message: 'Job updated successfully', job });
  } catch (error) {
    next(error);
  }
};

export const cancelJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = cancelJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const job = await jobService.cancelJob(req.params.id as string, parsed.data.reason, req.user!.id, req.user!.role);
    res.status(200).json({ success: true, message: 'Job cancelled successfully', job });
  } catch (error) {
    next(error);
  }
};
