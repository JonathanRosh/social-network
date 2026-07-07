import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/errors.js";
import { registerUser, verifyCredentials, getUserById, toSessionUser } from "./service.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  req.session.userId = user.id;
  res.status(201).json({ user: toSessionUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await verifyCredentials(email, password);
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }
  req.session.userId = user.id;
  res.json({ user: toSessionUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
  res.clearCookie("connect.sid");
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  const user = await getUserById(req.session.userId!);
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }
  res.json({ user: toSessionUser(user) });
});
