/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cases from "../cases.js";
import type * as lib from "../lib.js";
import type * as lib_cursorClient from "../lib/cursorClient.js";
import type * as lib_verdictAnalysis from "../lib/verdictAnalysis.js";
import type * as lib_verdictPrompt from "../lib/verdictPrompt.js";
import type * as reports from "../reports.js";
import type * as verdictActions from "../verdictActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cases: typeof cases;
  lib: typeof lib;
  "lib/cursorClient": typeof lib_cursorClient;
  "lib/verdictAnalysis": typeof lib_verdictAnalysis;
  "lib/verdictPrompt": typeof lib_verdictPrompt;
  reports: typeof reports;
  verdictActions: typeof verdictActions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
