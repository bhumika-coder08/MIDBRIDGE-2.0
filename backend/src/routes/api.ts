import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

// Controllers
import * as authController from '../controllers/authController.js';
import * as countryController from '../controllers/countryController.js';
import * as journeyController from '../controllers/journeyController.js';
import * as documentController from '../controllers/documentController.js';
import * as verificationController from '../controllers/verificationController.js';
import * as scholarshipController from '../controllers/scholarshipController.js';
import * as translatorController from '../controllers/translatorController.js';
import * as assistantController from '../controllers/assistantController.js';
import * as shareController from '../controllers/shareController.js';
import * as emergencyController from '../controllers/emergencyController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as reminderController from '../controllers/reminderController.js';
import * as adminController from '../controllers/adminController.js';
import * as authorityController from '../controllers/authorityController.js';
import * as institutionController from '../controllers/institutionController.js';
import * as healthController from '../controllers/healthController.js';
import * as costPlannerController from '../controllers/costPlannerController.js';
import * as mobilityTwinController from '../controllers/mobilityTwinController.js';

export const apiRouter = Router();

// ========================
// 1. PUBLIC ROUTES
// ========================
apiRouter.post('/auth/signup', authController.signup);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/admin-login', authController.adminLogin);

apiRouter.get('/countries', countryController.getAllCountries);
apiRouter.get('/countries/:code', countryController.getCountryByCode);

apiRouter.get('/scholarships', scholarshipController.getScholarships);
apiRouter.post('/translator/translate', translatorController.translateText);

// Public Selective Disclosure Verifier inspection
apiRouter.get('/share/verify/:token', shareController.getPublicSharePackageByToken);

// Public Health Selective Disclosure inspection
apiRouter.get('/health/verify/:token', healthController.getPublicHealthSharePackageByToken);

// Public Emergency Card inspection
apiRouter.get('/emergency/card/:token', emergencyController.getPublicEmergencyCard);

// ========================
// 2. AUTHENTICATED USER ROUTES
// ========================
apiRouter.get('/auth/me', authenticateToken, authController.getMe);
apiRouter.put('/profile', authenticateToken, authController.updateProfile);

// Journeys & Checklists
apiRouter.get('/journeys/active', authenticateToken, journeyController.getActiveJourney);
apiRouter.post('/journeys', authenticateToken, journeyController.createJourney);
apiRouter.put('/journeys/:journeyId/stages/:stageNumber', authenticateToken, journeyController.updateJourneyStage);
apiRouter.put('/journeys/requirements/:userRequirementId', authenticateToken, journeyController.updateRequirementStatus);

// Document Vault
apiRouter.get('/documents', authenticateToken, documentController.getDocuments);
apiRouter.post('/documents/upload', authenticateToken, uploadMiddleware.single('file'), documentController.uploadDocument);
apiRouter.get('/documents/:id/download', authenticateToken, documentController.downloadDocument);
apiRouter.delete('/documents/:id', authenticateToken, documentController.deleteDocument);

// Verification Request
apiRouter.post('/verification/request', authenticateToken, verificationController.requestVerification);

// AI Assistant
apiRouter.post('/assistant/ask', authenticateToken, assistantController.askAssistant);
apiRouter.get('/assistant/history', authenticateToken, assistantController.getConversationHistory);

// Selective Disclosure Share Packages
apiRouter.post('/share', authenticateToken, shareController.createSharePackage);
apiRouter.get('/share', authenticateToken, shareController.getUserSharePackages);
apiRouter.post('/share/:id/revoke', authenticateToken, shareController.revokeSharePackage);

// Health Vault (Private by Default)
apiRouter.get('/health-vault/documents', authenticateToken, healthController.getHealthDocuments);
apiRouter.post('/health-vault/upload', authenticateToken, uploadMiddleware.single('file'), healthController.uploadHealthDocument);
apiRouter.get('/health-vault/documents/:id/download', authenticateToken, healthController.downloadHealthDocument);
apiRouter.delete('/health-vault/documents/:id', authenticateToken, healthController.deleteHealthDocument);
apiRouter.get('/health-vault/readiness', authenticateToken, healthController.getHealthReadiness);
apiRouter.post('/health-vault/share', authenticateToken, healthController.createHealthSharePackage);

// Mobility Twin & Scenario Simulator
apiRouter.get('/mobility-twin', authenticateToken, mobilityTwinController.getMobilityTwin);
apiRouter.post('/mobility-twin/simulate', authenticateToken, mobilityTwinController.simulateScenario);
apiRouter.post('/mobility-twin/apply', authenticateToken, mobilityTwinController.applySimulatedScenario);

// Cost Planner & Financial Solvency
apiRouter.get('/cost-planner', authenticateToken, costPlannerController.getCostPlan);
apiRouter.post('/cost-planner/items', authenticateToken, costPlannerController.addCostItem);
apiRouter.put('/cost-planner/items/:id', authenticateToken, costPlannerController.updateCostItem);
apiRouter.delete('/cost-planner/items/:id', authenticateToken, costPlannerController.deleteCostItem);
apiRouter.post('/cost-planner/funding', authenticateToken, costPlannerController.addFundingSource);
apiRouter.put('/cost-planner/funding/:id', authenticateToken, costPlannerController.updateFundingSource);
apiRouter.delete('/cost-planner/funding/:id', authenticateToken, costPlannerController.deleteFundingSource);
apiRouter.put('/cost-planner/exchange-rate', authenticateToken, costPlannerController.updateExchangeRate);

// Emergency Mode
apiRouter.get('/emergency/profile', authenticateToken, emergencyController.getEmergencyProfile);
apiRouter.post('/emergency/profile', authenticateToken, emergencyController.createOrUpdateEmergencyProfile);

// Notifications
apiRouter.get('/notifications', authenticateToken, notificationController.getNotifications);
apiRouter.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
apiRouter.put('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// Reminders
apiRouter.get('/reminders', authenticateToken, reminderController.getReminders);
apiRouter.post('/reminders', authenticateToken, reminderController.createReminder);
apiRouter.put('/reminders/:id/toggle', authenticateToken, reminderController.toggleReminder);
apiRouter.delete('/reminders/:id', authenticateToken, reminderController.deleteReminder);

// ========================
// 3. ROLE-BASED PORTAL ROUTES
// ========================

// Verification Queue (AUTHORITY, VERIFIER, ADMIN)
apiRouter.get('/verification/queue', authenticateToken, requireRole('AUTHORITY', 'VERIFIER', 'ADMIN'), verificationController.getVerificationQueue);
apiRouter.post('/verification/review', authenticateToken, requireRole('AUTHORITY', 'VERIFIER', 'ADMIN'), verificationController.reviewVerification);
apiRouter.get('/authority/stats', authenticateToken, requireRole('AUTHORITY', 'ADMIN'), authorityController.getAuthorityStats);

// Institution Portal (UNIVERSITY, ADMIN)
apiRouter.get('/institution/applications', authenticateToken, requireRole('UNIVERSITY', 'ADMIN'), institutionController.getReceivedApplications);

// Admin Control Center (ADMIN)
apiRouter.get('/admin/metrics', authenticateToken, requireRole('ADMIN'), adminController.getAdminMetrics);
apiRouter.get('/admin/users', authenticateToken, requireRole('ADMIN'), adminController.getAllUsers);
apiRouter.post('/admin/requirements', authenticateToken, requireRole('ADMIN'), adminController.addCountryRequirement);
