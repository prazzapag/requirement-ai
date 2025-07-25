"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  return (
    <div
      className={`p-4 flex justify-between items-center ${isHomePage ? "bg-violet-50" : "bg-background border-b border-violet-50"}`}
    >
      <Link href={"/"} className="flex items-center">
        <Shield className="w-6 h-6 text-violet-600 mr-2" />
        <h1 className="text-xl font-semibold text-foreground">reqIO</h1>
      </Link>
      <div className="flex items-center space-x-4">
        <SignedIn>
          <Link href="/requirements">
            <Button variant={"outline"}>My Requirements</Button>
          </Link>
          <Link href="/manage-plan">
            <Button>Manage Plan</Button>
          </Link>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Login</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
export default Header;
