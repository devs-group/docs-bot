import { and, eq } from "drizzle-orm";
import { accounts, sessions, users, verificationTokens } from "./schema";
import { db } from "./index";
import type { Adapter } from "next-auth/adapters";
import { InferSelectModel } from "drizzle-orm";

export type User = InferSelectModel<typeof users>;
export type Account = InferSelectModel<typeof accounts>;

export function DrizzleAdapter(): Adapter {
  return {
    // createUser creates a new user entry
    async createUser(userData: User) {
      const [user] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          image: userData.image,
        })
        .returning();
      return user;
    },

    // getUser retrieves a user by ID
    async getUser(id) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || null;
    },

    // getUser retrieves a user by Email
    async getUserByEmail(email) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return user || null;
    },

    // getUserByAccount retrieves a user by account ID and its provider
    async getUserByAccount({ providerAccountId, provider }) {
      const [result] = await db
        .select({
          user: users,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        )
        .innerJoin(users, eq(users.id, accounts.userId));
      return result?.user || null;
    },

    // updateUser updates a user's information
    async updateUser({ id, ...userData }) {
      if (!id) throw new Error("User ID is required");
      const [user] = await db
        .update(users)
        .set({
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          image: userData.image,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return user;
    },

    // deleteUser deletes a user and their associated accounts
    async deleteUser(userId) {
      const [user] = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    },

    // linkAccount links a user's account to a third-party provider
    async linkAccount(accountData: Account) {
      await db.insert(accounts).values({
        userId: accountData.userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        refresh_token: accountData.refresh_token,
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
        session_state: accountData.session_state,
      });
    },

    // unlinkAccount removes a user's account from a third-party provider
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        );
    },

    // createSession creates a new session for a user
    async createSession(sessionData) {
      const [session] = await db
        .insert(sessions)
        .values({
          sessionToken: sessionData.sessionToken,
          userId: sessionData.userId,
          expires: sessionData.expires,
        })
        .returning();
      return session;
    },

    // getSessionAndUser retrieves a session and user by session token
    async getSessionAndUser(sessionToken) {
      const [result] = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .innerJoin(users, eq(users.id, sessions.userId));

      if (!result) return null;
      return {
        session: result.session,
        user: result.user,
      };
    },

    // updateSession updates a session's data
    async updateSession(sessionData) {
      const [session] = await db
        .update(sessions)
        .set({
          expires: sessionData.expires,
        })
        .where(eq(sessions.sessionToken, sessionData.sessionToken))
        .returning();
      return session;
    },

    // deleteSession deletes a session by session token
    async deleteSession(sessionToken) {
      const [session] = await db
        .delete(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .returning();
      return session;
    },

    // createVerificationToken creates a verification token
    async createVerificationToken(verificationToken) {
      const [token] = await db
        .insert(verificationTokens)
        .values({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        })
        .returning();
      return token;
    },

    // useVerificationToken uses a verification token
    async useVerificationToken({ identifier, token }) {
      const [verificationToken] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
        .returning();
      return verificationToken;
    },
  };
}
