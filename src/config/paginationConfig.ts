/**
 * Pagination Configuration
 * Central configuration for pagination across the application
 */

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE: number = 50;

/** Available page size options for dropdown */
export const PAGE_SIZE_OPTIONS: number[] = [25, 50, 100];

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
