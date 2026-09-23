// Compatibility adapter for the reconstructed screens, backed by Firebase Auth + Cloud Firestore.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import { useAuth } from "./auth";
import { isFirebaseConfigured } from "./config";
import { createSpotSchema, updateSpotSchema } from "./validation";
import type { CreateSpotInput, UpdateSpotInput } from "./validation";

type Options<T> = { onSuccess?: (data: T) => void | Promise<void>; onError?: (error: Error) => void };
type CreateDraft = Omit<CreateSpotInput, "lat" | "lng"> & { lat: string | number; lng: string | number };

export const trpc = {
  spots: {
    list: { useQuery: () => useQuery({ queryKey: api.spotKeys.public, queryFn: api.listPublicSpots, enabled: isFirebaseConfigured }) },
    mine: {
      useQuery: (_?: undefined, options?: { enabled?: boolean; retry?: boolean }) => {
        const { session, isAuthenticated } = useAuth();
        return useQuery({
          queryKey: [...api.spotKeys.mine, session?.uid],
          queryFn: api.listMySpots,
          enabled: isFirebaseConfigured && isAuthenticated && options?.enabled !== false,
          retry: options?.retry ?? false,
        });
      },
    },
    create: { useMutation: (options?: Options<string>) => useMutation({ mutationFn: (input: CreateDraft) => api.createSpot(createSpotSchema.parse(input)), ...options }) },
    update: { useMutation: (options?: Options<boolean>) => useMutation({ mutationFn: (input: UpdateSpotInput) => api.updateSpot(updateSpotSchema.parse(input)), ...options }) },
    delete: { useMutation: (options?: Options<boolean>) => useMutation({ mutationFn: ({ id }: { id: string }) => api.deleteSpot(id), ...options }) },
  },
  useUtils: () => {
    const client = useQueryClient();
    return {
      spots: {
        mine: { invalidate: () => client.invalidateQueries({ queryKey: api.spotKeys.mine }) },
        list: { invalidate: () => client.invalidateQueries({ queryKey: api.spotKeys.all }) },
      },
    };
  },
};
