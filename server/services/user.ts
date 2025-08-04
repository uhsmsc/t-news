import jwt from "jsonwebtoken";

import { UserDto, UpdateUserDto, NewUserDto, UserRecord } from "../models/user";
import { AuthDto, AuthRespnse } from "../models/auth";
import { getEnv } from "../utils/config";
import { createLoadFn, createSaveFn } from "./jsonStorage";
import { generateId } from "../utils/generate_id";

const loadUsersJson = createLoadFn<UserRecord>("USERS_DATA");
const saveUsersJson = createSaveFn<UserRecord>("USERS_DATA");

export function getUsers(): UserDto[] {
  const data = loadUsersJson();

  return data.map(({ password, ...rest }) => rest);
}

export function createUser(user: NewUserDto): UserDto {
  const newUser: UserRecord = {
    ...user,
    id: generateId(),
    name: user.username,
    bio: "",
    avatar: "/uploads/default.svg",
    following: [],
    followers: [],
  };

  const data = loadUsersJson();

  if (data.find((u) => u.username === newUser.username)) {
    throw new Error(`Username ${newUser.username} already exists`);
  }

  data.push(newUser);

  saveUsersJson(data);

  const { password, ...userDto } = newUser;

  return userDto;
}

export function getUserById(userId: string): UserDto {
  const data = loadUsersJson();
  const user = data.find((u) => u.id === userId);

  if (!user) {
    throw new Error(`User with id "${userId}" not found`);
  }

  const { password, ...userDto } = user;

  return userDto;
}

export function patchUser(userId: string, updateUser: UpdateUserDto): UserDto {
  const data = loadUsersJson();

  const updatedUsers: UserRecord[] = data.map((user) => {
    if (user.id === userId) {
      return {
        ...user,
        ...updateUser,
      };
    }
    return user;
  });

  const updatedUser = updatedUsers.find((u) => u.id === userId);
  if (!updatedUser) {
    throw new Error(`User with id ${userId} not found`);
  }

  saveUsersJson(updatedUsers);

  const { password, ...userDto } = updatedUser;
  return userDto;
}

export function authenticateUser(auth: AuthDto): AuthRespnse {
  const data = loadUsersJson();
  const JWT_SECRET = getEnv("JWT_SECRET");

  const user = data.find(
    (u) =>
      u.username.toLowerCase() === auth.username.toLowerCase() &&
      u.password === auth.password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  return {
    token,
  };
}

export function followUser(userId: string, targetId: string): void {
  if (userId === targetId) {
    throw new Error("You cannot follow yourself");
  }

  const data = loadUsersJson();

  const user = data.find((u) => u.id === userId);
  const target = data.find((u) => u.id === targetId);

  if (!user || !target) {
    throw new Error("User not found");
  }

  if (!target.followers.includes(userId)) {
    target.followers.push(userId);
  }
  if (!user.following.includes(targetId)) {
    user.following.push(targetId);
  }

  saveUsersJson(data);
}

export function unfollowUser(userId: string, targetId: string): void {
  if (userId === targetId) {
    throw new Error("You cannot unfollow yourself");
  }

  const data = loadUsersJson();

  const user = data.find((u) => u.id === userId);
  const target = data.find((u) => u.id === targetId);

  if (!user || !target) {
    throw new Error("User not found");
  }

  target.followers = target.followers.filter((f) => f !== userId);
  user.following = user.following.filter((f) => f !== targetId);

  saveUsersJson(data);
}

export function isFollowing(userId: string, targetId: string): boolean {
  if (userId === targetId) return false;

  const data = loadUsersJson();

  const target = data.find((u) => u.id === targetId);

  if (!target) {
    throw new Error("User not found");
  }

  return target.followers.includes(userId);
}

