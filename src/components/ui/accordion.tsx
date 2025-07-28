import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  children: React.ReactNode
  className?: string
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContext = React.createContext<{
  openItems: Set<string>
  toggleItem: (value: string) => void
}>({
  openItems: new Set(),
  toggleItem: () => {}
})

const Accordion: React.FC<AccordionProps> = ({ 
  type = "single", 
  collapsible = true, 
  children, 
  className 
}) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(value)) {
        newSet.delete(value)
      } else {
        if (type === "single") {
          newSet.clear()
        }
        newSet.add(value)
      }
      return newSet
    })
  }, [type])

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

const AccordionItemContext = React.createContext<string>("")

const AccordionItem: React.FC<AccordionItemProps> = ({ value, children, className }) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn("border-b", className)} data-value={value}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { openItems, toggleItem } = React.useContext(AccordionContext)
    const value = React.useContext(AccordionItemContext)
    const isOpen = openItems.has(value)

    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline text-left w-full",
          className
        )}
        onClick={() => toggleItem(value)}
        {...props}
      >
        {children}
        <ChevronDown 
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
    )
  }
)

const AccordionContent: React.FC<AccordionContentProps> = ({ 
  children, 
  className 
}) => {
  const { openItems } = React.useContext(AccordionContext)
  const value = React.useContext(AccordionItemContext)
  const isOpen = openItems.has(value)

  return (
    <div 
      className={cn(
        "overflow-hidden text-sm transition-all duration-200",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className={cn("pb-4 pt-0", className)}>
        {children}
      </div>
    </div>
  )
}

AccordionTrigger.displayName = "AccordionTrigger"
AccordionContent.displayName = "AccordionContent"
AccordionItem.displayName = "AccordionItem"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }