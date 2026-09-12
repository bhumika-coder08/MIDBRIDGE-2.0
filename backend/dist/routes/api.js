"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const upload_js_1 = require("../middleware/upload.js");
// Controllers
const authController = __importStar(require("../controllers/authController.js"));
const countryController = __importStar(require("../controllers/countryController.js"));
const journeyController = __importStar(require("../controllers/journeyController.js"));
const documentController = __importStar(require("../controllers/documentController.js"));
const verificationController = __importStar(require("../controllers/verificationController.js"));
const scholarshipController = __importStar(require("../controllers/scholarshipController.js"));
const translatorController = __importStar(require("../controllers/translatorController.js"));
const assistantController = __importStar(require("../controllers/assistantController.js"));
const shareController = __importStar(require("../controllers/shareController.js"));
const emergencyController = __importStar(require("../controllers/emergencyController.js"));
const notificationController = __importStar(require("../controllers/notificationController.js"));
const reminderController = __importStar(require("../controllers/reminderController.js"));
const adminController = __importStar(require("../controllers/adminController.js"));
const authorityController = __importStar(require("../controllers/authorityController.js"));
const institutionController = __importStar(require("../controllers/institutionController.js"));
const healthController = __importStar(require("../controllers/healthController.js"));
const costPlannerController = __importStar(require("../controllers/costPlannerController.js"));
const mobilityTwinController = __importStar(require("../controllers/mobilityTwinController.js"));
exports.apiRouter = (0, express_1.Router)();
// ========================
// 1. PUBLIC ROUTES
// ========================
exports.apiRouter.post('/auth/signup', authController.signup);
exports.apiRouter.post('/auth/login', authController.login);
exports.apiRouter.post('/auth/admin-login', authController.adminLogin);
exports.apiRouter.get('/countries', countryController.getAllCountries);
exports.apiRouter.get('/countries/:code', countryController.getCountryByCode);
exports.apiRouter.get('/scholarships', scholarshipController.getScholarships);
exports.apiRouter.post('/translator/translate', translatorController.translateText);
// Public Selective Disclosure Verifier inspection
exports.apiRouter.get('/share/verify/:token', shareController.getPublicSharePackageByToken);
// Public Health Selective Disclosure inspection
exports.apiRouter.get('/health/verify/:token', healthController.getPublicHealthSharePackageByToken);
// Public Emergency Card inspection
exports.apiRouter.get('/emergency/card/:token', emergencyController.getPublicEmergencyCard);
// ========================
// 2. AUTHENTICATED USER ROUTES
// ========================
exports.apiRouter.get('/auth/me', auth_js_1.authenticateToken, authController.getMe);
exports.apiRouter.put('/profile', auth_js_1.authenticateToken, authController.updateProfile);
// Journeys & Checklists
exports.apiRouter.get('/journeys/active', auth_js_1.authenticateToken, journeyController.getActiveJourney);
exports.apiRouter.post('/journeys', auth_js_1.authenticateToken, journeyController.createJourney);
exports.apiRouter.put('/journeys/:journeyId/stages/:stageNumber', auth_js_1.authenticateToken, journeyController.updateJourneyStage);
exports.apiRouter.put('/journeys/requirements/:userRequirementId', auth_js_1.authenticateToken, journeyController.updateRequirementStatus);
// Document Vault
exports.apiRouter.get('/documents', auth_js_1.authenticateToken, documentController.getDocuments);
exports.apiRouter.post('/documents/upload', auth_js_1.authenticateToken, upload_js_1.uploadMiddleware.single('file'), documentController.uploadDocument);
exports.apiRouter.get('/documents/:id/download', auth_js_1.authenticateToken, documentController.downloadDocument);
exports.apiRouter.delete('/documents/:id', auth_js_1.authenticateToken, documentController.deleteDocument);
// Verification Request
exports.apiRouter.post('/verification/request', auth_js_1.authenticateToken, verificationController.requestVerification);
// AI Assistant
exports.apiRouter.post('/assistant/ask', auth_js_1.authenticateToken, assistantController.askAssistant);
exports.apiRouter.get('/assistant/history', auth_js_1.authenticateToken, assistantController.getConversationHistory);
// Selective Disclosure Share Packages
exports.apiRouter.post('/share', auth_js_1.authenticateToken, shareController.createSharePackage);
exports.apiRouter.get('/share', auth_js_1.authenticateToken, shareController.getUserSharePackages);
exports.apiRouter.post('/share/:id/revoke', auth_js_1.authenticateToken, shareController.revokeSharePackage);
// Health Vault (Private by Default)
exports.apiRouter.get('/health-vault/documents', auth_js_1.authenticateToken, healthController.getHealthDocuments);
exports.apiRouter.post('/health-vault/upload', auth_js_1.authenticateToken, upload_js_1.uploadMiddleware.single('file'), healthController.uploadHealthDocument);
exports.apiRouter.get('/health-vault/documents/:id/download', auth_js_1.authenticateToken, healthController.downloadHealthDocument);
exports.apiRouter.delete('/health-vault/documents/:id', auth_js_1.authenticateToken, healthController.deleteHealthDocument);
exports.apiRouter.get('/health-vault/readiness', auth_js_1.authenticateToken, healthController.getHealthReadiness);
exports.apiRouter.post('/health-vault/share', auth_js_1.authenticateToken, healthController.createHealthSharePackage);
// Mobility Twin & Scenario Simulator
exports.apiRouter.get('/mobility-twin', auth_js_1.authenticateToken, mobilityTwinController.getMobilityTwin);
exports.apiRouter.post('/mobility-twin/simulate', auth_js_1.authenticateToken, mobilityTwinController.simulateScenario);
exports.apiRouter.post('/mobility-twin/apply', auth_js_1.authenticateToken, mobilityTwinController.applySimulatedScenario);
// Cost Planner & Financial Solvency
exports.apiRouter.get('/cost-planner', auth_js_1.authenticateToken, costPlannerController.getCostPlan);
exports.apiRouter.post('/cost-planner/items', auth_js_1.authenticateToken, costPlannerController.addCostItem);
exports.apiRouter.put('/cost-planner/items/:id', auth_js_1.authenticateToken, costPlannerController.updateCostItem);
exports.apiRouter.delete('/cost-planner/items/:id', auth_js_1.authenticateToken, costPlannerController.deleteCostItem);
exports.apiRouter.post('/cost-planner/funding', auth_js_1.authenticateToken, costPlannerController.addFundingSource);
exports.apiRouter.put('/cost-planner/funding/:id', auth_js_1.authenticateToken, costPlannerController.updateFundingSource);
exports.apiRouter.delete('/cost-planner/funding/:id', auth_js_1.authenticateToken, costPlannerController.deleteFundingSource);
exports.apiRouter.put('/cost-planner/exchange-rate', auth_js_1.authenticateToken, costPlannerController.updateExchangeRate);
// Emergency Mode
exports.apiRouter.get('/emergency/profile', auth_js_1.authenticateToken, emergencyController.getEmergencyProfile);
exports.apiRouter.post('/emergency/profile', auth_js_1.authenticateToken, emergencyController.createOrUpdateEmergencyProfile);
// Notifications
exports.apiRouter.get('/notifications', auth_js_1.authenticateToken, notificationController.getNotifications);
exports.apiRouter.put('/notifications/:id/read', auth_js_1.authenticateToken, notificationController.markAsRead);
exports.apiRouter.put('/notifications/read-all', auth_js_1.authenticateToken, notificationController.markAllAsRead);
// Reminders
exports.apiRouter.get('/reminders', auth_js_1.authenticateToken, reminderController.getReminders);
exports.apiRouter.post('/reminders', auth_js_1.authenticateToken, reminderController.createReminder);
exports.apiRouter.put('/reminders/:id/toggle', auth_js_1.authenticateToken, reminderController.toggleReminder);
exports.apiRouter.delete('/reminders/:id', auth_js_1.authenticateToken, reminderController.deleteReminder);
// ========================
// 3. ROLE-BASED PORTAL ROUTES
// ========================
// Verification Queue (AUTHORITY, VERIFIER, ADMIN)
exports.apiRouter.get('/verification/queue', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('AUTHORITY', 'VERIFIER', 'ADMIN'), verificationController.getVerificationQueue);
exports.apiRouter.post('/verification/review', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('AUTHORITY', 'VERIFIER', 'ADMIN'), verificationController.reviewVerification);
exports.apiRouter.get('/authority/stats', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('AUTHORITY', 'ADMIN'), authorityController.getAuthorityStats);
// Institution Portal (UNIVERSITY, ADMIN)
exports.apiRouter.get('/institution/applications', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('UNIVERSITY', 'ADMIN'), institutionController.getReceivedApplications);
// Admin Control Center (ADMIN)
exports.apiRouter.get('/admin/metrics', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('ADMIN'), adminController.getAdminMetrics);
exports.apiRouter.get('/admin/users', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('ADMIN'), adminController.getAllUsers);
exports.apiRouter.post('/admin/requirements', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)('ADMIN'), adminController.addCountryRequirement);
