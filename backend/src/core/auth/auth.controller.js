import { registerUser, loginUser } from './auth.service.js';

/**
 * Register new user
 */
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Login existing user
 */
export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
