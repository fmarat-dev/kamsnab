"use client";

import { createSlugListStore } from "./slug-list-store";

const store = createSlugListStore("kamsnab:favorites", "kamsnab:favorites-change");

export const toggleFavoriteSlug = store.toggle;
export const removeFavoriteSlug = store.remove;
export const clearFavoriteSlugs = store.clear;
export const useFavoriteSlugs = store.useSlugs;
