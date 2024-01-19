import express, { Express, Router, Request, Response , Application, NextFunction} from 'express';
import {register, signIn,signout, CreateCaterogry, CreateInterest,JobPosting, ApplyJob} from '../controller/allController';
import {authenticateToken} from '../middleware/authenticateToken';
const router = Router();
router.post('/register', register );
router.post('/login', signIn);
router.post('/logout', signout);
router.post('/createCaterogry',authenticateToken, CreateCaterogry);
router.post('/createInterest',authenticateToken, CreateInterest);
router.post('/jobPosting', authenticateToken, JobPosting); 
router.post('/applyJob', authenticateToken, ApplyJob);

export default router;