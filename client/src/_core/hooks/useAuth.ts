import { useAuth as useFirebaseAuth } from "../../lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Retained only for reconstructed components that may consume this compatibility hook.
export function useAuth() {
  const auth = useFirebaseAuth();
  const queryClient = useQueryClient();
  return {
    ...auth,
    user: auth.session,
    isAuthenticated: auth.isAuthenticated,
    logout: async () => {
      try {
        await auth.signOut();
        queryClient.removeQueries({ queryKey: ["spots", "mine"] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "ログアウトできませんでした。");
      }
    },
  };
}
