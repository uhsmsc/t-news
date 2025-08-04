export interface Comment {
  id: string;
  userId: string;
  content: string;
}

export type NewComment = Pick<Comment, "content">;
