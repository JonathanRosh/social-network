import { asyncHandler } from "../../utils/asyncHandler.js";
import { toPublicProfile } from "../users/service.js";
import * as service from "./service.js";

export const sendRequest = asyncHandler(async (req, res) => {
  const friendship = await service.sendFriendRequest(req.session.userId!, req.body.addresseeId);
  res.status(201).json({ friendship });
});

export const listRequests = asyncHandler(async (req, res) => {
  const { incoming, outgoing } = await service.listPendingRequests(req.session.userId!);
  res.json({
    incoming: incoming.map((r) => ({ id: r.id, createdAt: r.createdAt, from: toPublicProfile(r.requester) })),
    outgoing: outgoing.map((r) => ({ id: r.id, createdAt: r.createdAt, to: toPublicProfile(r.addressee) })),
  });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const friendship = await service.acceptFriendRequest(req.params.id, req.session.userId!);
  res.json({ friendship });
});

export const declineRequest = asyncHandler(async (req, res) => {
  const friendship = await service.declineFriendRequest(req.params.id, req.session.userId!);
  res.json({ friendship });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const friendship = await service.cancelFriendRequest(req.params.id, req.session.userId!);
  res.json({ friendship });
});

export const listMyFriends = asyncHandler(async (req, res) => {
  const friends = await service.listFriends(req.session.userId!);
  res.json({ friends: friends.map(toPublicProfile) });
});

export const removeFriendHandler = asyncHandler(async (req, res) => {
  await service.removeFriend(req.session.userId!, req.params.userId);
  res.status(204).send();
});
