import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const id = z.string().min(1).max(64);
const body = z.string().trim().min(1).max(1000);

/** Every action resolves the actor from the verified Clerk session, never from input. */
async function actor() {
  const { requireViewer } = await import("./auth.server");
  const { db, profile } = await requireViewer(getRequest());
  return { db, clerkUserId: profile.clerk_user_id };
}

export const addThought = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string; text: string }) =>
    z.object({ postId: id, text: body }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createThought } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    return { id: await createThought(db, clerkUserId, data.postId, data.text) };
  });

export const addThoughtReply = createServerFn({ method: "POST" })
  .inputValidator((input: { thoughtId: string; text: string }) =>
    z.object({ thoughtId: id, text: body }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createThoughtReply } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    return { id: await createThoughtReply(db, clerkUserId, data.thoughtId, data.text) };
  });

export const boostThought = createServerFn({ method: "POST" })
  .inputValidator((input: { thoughtId: string; boosted: boolean }) =>
    z.object({ thoughtId: id, boosted: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { setThoughtBoosted } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    await setThoughtBoosted(db, clerkUserId, data.thoughtId, data.boosted);
    return { ok: true };
  });

export const hideThought = createServerFn({ method: "POST" })
  .inputValidator((input: { thoughtId: string }) => z.object({ thoughtId: id }).parse(input))
  .handler(async ({ data }) => {
    const { setThoughtHidden } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    await setThoughtHidden(db, clerkUserId, data.thoughtId, true);
    return { ok: true };
  });

export const closeThoughts = createServerFn({ method: "POST" })
  .inputValidator((input: { postId: string; closed: boolean }) =>
    z.object({ postId: id, closed: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { setThoughtsClosed } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    await setThoughtsClosed(db, clerkUserId, data.postId, data.closed);
    return { ok: true };
  });

export const flagThought = createServerFn({ method: "POST" })
  .inputValidator((input: { thoughtId: string }) => z.object({ thoughtId: id }).parse(input))
  .handler(async ({ data }) => {
    const { reportThought } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    await reportThought(db, clerkUserId, data.thoughtId, "reported_by_op");
    return { ok: true };
  });

export const blockUser = createServerFn({ method: "POST" })
  .inputValidator((input: { thoughtId: string }) => z.object({ thoughtId: id }).parse(input))
  .handler(async ({ data }) => {
    const { blockThoughtAuthor } = await import("../server/thoughts");
    const { db, clerkUserId } = await actor();
    await blockThoughtAuthor(db, clerkUserId, data.thoughtId);
    return { ok: true };
  });
