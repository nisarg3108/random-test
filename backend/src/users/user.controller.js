import { createUser, listUsers, updateUser, deleteUser } from './user.service.js';

export const createUserController = async (req, res, next) => {
  try {
    const user = await createUser(req.body, req.user.tenantId);
    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const listUsersController = async (req, res, next) => {
  try {
    const users = await listUsers(req.user.tenantId);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await updateUser(id, req.body, req.user.tenantId);
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUser(id, req.user.tenantId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};
