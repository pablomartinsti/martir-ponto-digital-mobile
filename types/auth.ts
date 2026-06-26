export type UserRole = "employee" | "admin" | "sub_admin";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
};

export type StoredUserData = AuthUser & {
  token: string;
};
