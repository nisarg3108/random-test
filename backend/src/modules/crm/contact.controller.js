import {
  createContact,
  listContacts,
  getContact,
  updateContact,
  deleteContact
} from './contact.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createContactController = async (req, res, next) => {
  try {
    const contact = await createContact(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'CONTACT',
      entityId: contact.id
    });

    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
};

export const listContactsController = async (req, res, next) => {
  try {
    const contacts = await listContacts(req.user.tenantId);
    res.json(contacts);
  } catch (err) {
    next(err);
  }
};

export const getContactController = async (req, res, next) => {
  try {
    const contact = await getContact(req.params.id, req.user.tenantId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (err) {
    next(err);
  }
};

export const updateContactController = async (req, res, next) => {
  try {
    const contact = await updateContact(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'CONTACT',
      entityId: contact.id
    });

    res.json(contact);
  } catch (err) {
    next(err);
  }
};

export const deleteContactController = async (req, res, next) => {
  try {
    await deleteContact(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'CONTACT',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
