import {BrowserRouter,Route,Routes,Link} from 'react-router-dom';
import {useEffect,useState,Component,type ReactNode} from 'react';
import {Toaster} from 'sonner';
import {configurationMessage} from './lib/config';
import {routerBasename} from './lib/routes';
import {useAuth} from './lib/auth';
import {LoginDialog} from './components/LoginDialog';
import Home from './pages/Home';
import MySpots from './pages/MySpots';

class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl">画面を表示できませんでした</h1><button className="mt-4 border p-3" onClick={()=>window.location.reload()}>再読み込み</button></main>:this.props.children;}
}
function Content(){
 const {session}=useAuth();
 const [loginOpen,setLoginOpen]=useState(false);
 useEffect(()=>{const show=()=>setLoginOpen(true);window.addEventListener('spot:login',show);return()=>window.removeEventListener('spot:login',show);},[]);
 useEffect(()=>{if(session)setLoginOpen(false);},[session]);
 const message=configurationMessage();
 return <>
  {message?<div className="configuration-banner" role="alert"><strong>移行先の設定が必要です。</strong> {message}</div>:null}
  <Routes>
   <Route path="/" element={<Home/>}/>
   <Route path="/my/*" element={<MySpots/>}/>
   <Route path="*" element={<main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl">ページが見つかりません</h1><Link to="/" className="underline">地図帳へ戻る</Link></main>}/>
  </Routes>
  <LoginDialog open={loginOpen} onOpenChange={setLoginOpen}/>
  <Toaster position="top-center" richColors/>
 </>;
}
export default function App(){return <ErrorBoundary><BrowserRouter basename={routerBasename(import.meta.env.BASE_URL)}><Content/></BrowserRouter></ErrorBoundary>;}
