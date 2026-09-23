import { useAuth as useSession } from '../../lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
export function useAuth(){
 const auth=useSession();
 const queryClient=useQueryClient();
 return {...auth,user:auth.session?.user,isAuthenticated:auth.access.canPost,logout:async()=>{
   try {await auth.signOut();queryClient.removeQueries({queryKey:['spots','mine']});}
   catch(error){toast.error(error instanceof Error?error.message:'ログアウトできませんでした。');}
 }};
}
