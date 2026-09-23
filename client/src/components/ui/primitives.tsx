import * as React from 'react';
import * as D from '@radix-ui/react-dialog';

export function Button({asChild,variant='default',size='default',className='',children,...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {asChild?:boolean;variant?:'default'|'outline'|'ghost';size?:'default'|'sm'}) {
  const classes=`inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed ${size==='sm'?'px-3 py-2 min-h-9':'px-4 py-2.5 min-h-10'} ${variant==='outline'?'border border-border hover:bg-secondary':variant==='ghost'?'hover:bg-secondary':`${className.includes('bg-')?'':'bg-primary'} text-primary-foreground hover:opacity-90`} ${className}`;
  if(asChild && React.isValidElement<{className?:string}>(children)) return React.cloneElement(children,{className:`${classes} ${children.props.className??''}`});
  return <button {...props} className={classes}>{children}</button>;
}
export const Input=React.forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(({className='',...p},ref)=><input {...p} ref={ref} className={`flex w-full min-h-10 border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 ${className}`}/>);
Input.displayName='Input';
export const Textarea=React.forwardRef<HTMLTextAreaElement,React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({className='',...p},ref)=><textarea {...p} ref={ref} className={`flex min-h-24 w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring ${className}`}/>);
Textarea.displayName='Textarea';
export const Label=(p:React.LabelHTMLAttributes<HTMLLabelElement>)=><label {...p} className={`block mb-1 text-sm font-medium ${p.className??''}`}/>;
export const Dialog=D.Root;
export function DialogContent({className='',children,...p}:React.ComponentPropsWithoutRef<typeof D.Content>){return <D.Portal><D.Overlay className="fixed inset-0 z-[2000] bg-foreground/35"/><D.Content {...p} className={`fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] overflow-y-auto border bg-card p-6 shadow-xl focus:outline-none ${className}`}><D.Close aria-label="閉じる" className="absolute right-3 top-2 text-2xl px-2">×</D.Close>{children}</D.Content></D.Portal>}
export const DialogHeader=({className='',...p}:React.HTMLAttributes<HTMLDivElement>)=><div {...p} className={`mb-5 pr-5 ${className}`}/>;
export const DialogTitle=({className='',...p}:React.ComponentPropsWithoutRef<typeof D.Title>)=><D.Title {...p} className={`text-2xl font-[family-name:var(--font-display)] ${className}`}/>;
export const DialogDescription=({className='',...p}:React.ComponentPropsWithoutRef<typeof D.Description>)=><D.Description {...p} className={`mt-2 text-sm text-muted-foreground ${className}`}/>;
