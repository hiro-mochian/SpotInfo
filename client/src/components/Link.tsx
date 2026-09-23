import { Link as RouterLink } from 'react-router-dom';
import type { AnchorHTMLAttributes } from 'react';
export function Link({href='/',...props}:AnchorHTMLAttributes<HTMLAnchorElement>){return <RouterLink to={href} {...props}/>;}
