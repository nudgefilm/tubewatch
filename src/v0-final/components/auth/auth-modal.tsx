"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/v0-final/components/ui/dialog";
import { Button } from "@/v0-final/components/ui/button";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
          <DialogDescription>Google 계정으로 TubeWatch에 로그인합니다.</DialogDescription>
        </DialogHeader>
        <a href="/login">
          <Button className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full cursor-pointer">
            Google로 로그인
          </Button>
        </a>
      </DialogContent>
    </Dialog>
  );
}
