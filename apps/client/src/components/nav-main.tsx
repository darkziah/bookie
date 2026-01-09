import { Link } from "@tanstack/react-router"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@bookie/ui/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bookie/ui/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bookie/ui/components/ui/dropdown-menu"
import {
  IconChevronRight,
  IconBook,
  IconUsers,
  IconQrcode,
} from "@tabler/icons-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 mb-4 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Action"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground h-9 px-4 rounded-md shadow-sm transition-all duration-200"
                >
                  <IconCirclePlusFilled className="size-4" />
                  <span className="font-semibold tracking-tight">Quick Action</span>
                  <IconChevronRight className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="start"
                className="w-48 rounded-lg shadow-lg border-border/50"
              >
                <DropdownMenuItem asChild>
                  <Link to="/circulation" className="flex items-center gap-2 cursor-pointer">
                    <IconQrcode className="size-4" />
                    <span>New Loan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/catalog" className="flex items-center gap-2 cursor-pointer">
                    <IconBook className="size-4" />
                    <span>Add Book</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/students" className="flex items-center gap-2 cursor-pointer">
                    <IconUsers className="size-4" />
                    <span>Add Student</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <Button
              size="icon"
              variant="outline"
              className="size-9 group-data-[collapsible=icon]:hidden border-border/50 hover:bg-accent transition-colors shadow-sm"
            >
              <IconMail className="size-4" />
              <span className="sr-only">Messages</span>
            </Button> */}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
