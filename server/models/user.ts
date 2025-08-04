export interface UserRecord {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  following: string[]; 
  followers: string[]; 
  password: string;
}

export type UserDto = Omit<UserRecord, "password">;

export type NewUserDto = Pick<UserRecord, "username" | "password">;

export type UpdateUserDto = Pick<UserRecord, "bio" | "avatar" | "name">;
