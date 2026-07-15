import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const reportCategory = v.union(
  v.literal("privacy"),
  v.literal("harassment"),
  v.literal("threat"),
  v.literal("copyright"),
  v.literal("impersonation"),
  v.literal("other")
);

/** Public: file a content/safety report. */
export const submit = mutation({
  args: {
    case_id: v.optional(v.string()),
    category: reportCategory,
    explanation: v.string(),
    contact_email: v.optional(v.string()),
    session_id: v.string(),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    const explanation = args.explanation.trim();
    if (explanation.length < 10) {
      throw new Error("Explain what happened (at least 10 characters)");
    }
    if (explanation.length > 2000) {
      throw new Error("Keep the explanation under 2000 characters");
    }

    const contact = args.contact_email?.trim() || undefined;
    if (contact && (!contact.includes("@") || contact.length > 254)) {
      throw new Error("That email address looks off");
    }

    const caseId = args.case_id?.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || undefined;

    return await ctx.db.insert("reports", {
      case_id: caseId,
      category: args.category,
      explanation,
      contact_email: contact,
      session_id: args.session_id,
      created_at: Date.now(),
      emailed: false,
    });
  },
});

/** Mark a report as emailed after the API delivers it. */
export const markEmailed = mutation({
  args: { reportId: v.id("reports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (report) {
      await ctx.db.patch(args.reportId, { emailed: true });
    }
    return null;
  },
});

/** Recent reports for operator review in the Convex dashboard / tools. */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      case_id: v.optional(v.string()),
      category: reportCategory,
      explanation: v.string(),
      contact_email: v.optional(v.string()),
      session_id: v.string(),
      created_at: v.number(),
      emailed: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    return await ctx.db.query("reports").order("desc").take(limit);
  },
});
