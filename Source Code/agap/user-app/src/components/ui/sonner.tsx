"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      offset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
