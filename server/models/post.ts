import { Comment } from "./comment";

export interface PostRecord {
  id: string;
  userId: string;
  content: string;
  likes: string[];
  comments: string[];
}

export type PostDto = Omit<PostRecord, "comments"> & {
  comments: Comment[];
};

export type NewPostDto = Pick<PostDto, "content">;
