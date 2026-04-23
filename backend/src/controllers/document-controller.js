import { validationResult } from 'express-validator';
import {
    createDocument, findDocumentsByUser, findDocumentByIdandUser,
    updateDocumentByIdandUser, deleteDocumentByIdandUser,
} from '../repositories/document-repository.js';

const notFound = (res) => 
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Document not found"} });

const handleError = (res, message) => {
    console.error(`[DocumentController] ${message}`);
    return res.status(500).json({ success: false, error: { message } });
};

export const listDocuments = async (req, res) => {
    try {
        const docs = await findDocumentsByUser(req.user.userId);
        return res.json({ success: true, data: docs });
    } catch { return handleError(res, "Failed to list documents"); }
};

export const getDocument = async (req, res) => {
    try {
        const doc = await findDocumentByIdandUser(req.params.id, req.user.userId );
        if (!doc) return notFound(res);
        return res.json({ success: true, data: doc });
    } catch { return handleError(res, "Failed to get document"); }
};

export const createDocumentHandler = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.array() } });
    try {
        const { name, type, status, tags } = req.body;
        const doc = await createDocument(req.user.userId, { name, type, status, tags });
        return res.status(201).json({ success: true, data: doc });
    } catch { return handleError(res, "Failed to create document"); }
};

export const updateDocumentHandler = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.array() } });
    try {
        const updates = req.body;
        const doc = await updateDocumentByIdandUser(req.params.id, req.user.userId, updates);
        if (!doc) return notFound(res);
        return res.json({ success: true, data: doc });
    } catch { return handleError(res, "Failed to update document"); }
};

export const deleteDocumentHandler = async (req, res) => {
    try {
        const doc = await deleteDocumentByIdandUser(req.params.id, req.user.userId);
        if (!doc) return notFound(res);
        return res.json({ success: true, data: doc });
    } catch { return handleError(res, "Failed to delete document"); }
};
