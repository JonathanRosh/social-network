import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/errors.js";
import { toSessionUser } from "../auth/service.js";
import { getPublicProfile, updateProfile } from "./service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.params.username, req.session.userId!);
  if (!profile) {
    throw new HttpError(404, "User not found");
  }
  res.json({ user: profile });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await updateProfile(req.session.userId!, req.body);
  res.json({ user: toSessionUser(updated) });
});
