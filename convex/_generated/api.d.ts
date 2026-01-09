/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as crons from "../crons.js";
import type * as holidays from "../holidays.js";
import type * as http from "../http.js";
import type * as kiosk from "../kiosk.js";
import type * as librarians from "../librarians.js";
import type * as reports from "../reports.js";
import type * as settings from "../settings.js";
import type * as students from "../students.js";
import type * as transactions from "../transactions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  books: typeof books;
  crons: typeof crons;
  holidays: typeof holidays;
  http: typeof http;
  kiosk: typeof kiosk;
  librarians: typeof librarians;
  reports: typeof reports;
  settings: typeof settings;
  students: typeof students;
  transactions: typeof transactions;
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
