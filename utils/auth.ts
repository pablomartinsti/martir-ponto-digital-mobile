import jwt_decode from "jwt-decode";

type DecodedToken = {
  exp: number;
};

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = (jwt_decode as unknown as (token: string) => DecodedToken)(
      token
    );
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}
