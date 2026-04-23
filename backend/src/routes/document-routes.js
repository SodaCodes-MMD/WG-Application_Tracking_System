import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth-middleware.js';
import {
    listDocuments, getDocument, createDocumentHandler,
    updateDocumentHandler, deleteDocumentHandler,
} from '../controllers/document-controller.js';
import { DOCUMENT_TYPES_LIST, DOCUMENT_STATUSES_LIST } from '../models/document-model.js';

const router = express.Router();
router.use(authenticate);

const createValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn(DOCUMENT_TYPES_LIST).withMessage(`Type must be one of: ${DOCUMENT_TYPES_LIST.join(', ')}`),
    body('status').optional().isIn(DOCUMENT_STATUSES_LIST).withMessage(`Status must be one of: ${DOCUMENT_STATUSES_LIST.join(', ')}`),
    body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
]

const updateValidation = [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('type').optional().isIn(DOCUMENT_TYPES_LIST).withMessage(`Type must be one of: ${DOCUMENT_TYPES_LIST.join(', ')}`),
    body('status').optional().isIn(DOCUMENT_STATUSES_LIST).withMessage(`Status must be one of: ${DOCUMENT_STATUSES_LIST.join(', ')}`),
    body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
]

router.get('/documents', listDocuments);
router.get('/documents/:id', getDocument);
router.post('/documents', createValidation, createDocumentHandler);
router.patch('/documents/:id', updateValidation, updateDocumentHandler);
router.delete('/documents/:id', deleteDocumentHandler);

export default router;