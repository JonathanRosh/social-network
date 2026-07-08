export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export type RelationshipStatus = "self" | "friends" | "pending_outgoing" | "pending_incoming" | "none";

export interface BasicProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** GET /api/users/:username also tells the viewer their relationship to this user. */
export interface PublicProfile extends BasicProfile {
  relationship: RelationshipStatus;
  friendshipId: string | null;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  createdAt: string;
}

export interface IncomingFriendRequest extends FriendRequest {
  from: BasicProfile;
}

export interface OutgoingFriendRequest extends FriendRequest {
  to: BasicProfile;
}

export type PostVisibility = "public" | "friends" | "private";

export interface Post {
  id: string;
  authorId: string;
  content: string;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
}

export type FeedScope = "friends" | "discover";

export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface FeedPost extends Post {
  author: FeedAuthor;
}

export interface FeedCursor {
  createdAt: string;
  id: string;
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: FeedCursor | null;
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export interface CommentsPage {
  comments: Comment[];
  nextCursor: FeedCursor | null;
}
