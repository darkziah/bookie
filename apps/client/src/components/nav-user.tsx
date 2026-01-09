import { Link } from "@tanstack/react-router"
import {
  IconDotsVertical,
  IconLogout,
  IconBell,
  IconUserCircle,
  IconSettings,
} from "@tabler/icons-react"
import { useAuthActions } from "@convex-dev/auth/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bookie/ui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bookie/ui/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@bookie/ui/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuthActions()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-12 transition-colors duration-200"
            >
              <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wider">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
                <Avatar className="h-9 w-9 shadow-sm">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs uppercase tracking-wider">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <Link to="/profile">
                  <IconUserCircle className="size-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <IconBell className="size-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <Link to="/settings">
                  <IconSettings className="size-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
              onClick={handleSignOut}
            >
              <IconLogout className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
