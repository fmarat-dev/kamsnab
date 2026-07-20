"use client";

import { createSlugListStore } from "./slug-list-store";

export const COMPARE_LIMIT = 4;

const store = createSlugListStore("kamsnab:compare", "kamsnab:compare-change", COMPARE_LIMIT);

export const toggleCompareSlug = store.toggle;
export const removeCompareSlug = store.remove;
export const clearCompareSlugs = store.clear;
export const useCompareSlugs = store.useSlugs;
