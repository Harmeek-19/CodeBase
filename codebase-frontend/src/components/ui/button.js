import React from 'react';

export const Button = React.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? React.Children.only(props.children).type : "button"
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background
        ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
        ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
        ${variant === 'outline' ? 'border border-input hover:bg-accent hover:text-accent-foreground' : ''}
        ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}
        ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
        ${variant === 'link' ? 'underline-offset-4 hover:underline text-primary' : ''}
        ${size === 'default' ? 'h-10 py-2 px-4' : ''}
        ${size === 'sm' ? 'h-9 px-3 rounded-md' : ''}
        ${size === 'lg' ? 'h-11 px-8 rounded-md' : ''}
        ${className}`}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"