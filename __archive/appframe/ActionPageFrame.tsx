import type { ReactNode } from "react";
import { V0AppFrame } from "@/components/app/V0AppFrame";

type ActionPageFrameProps = {
  children: ReactNode;
};

export function ActionPageFrame({
  children,
}: ActionPageFrameProps): JSX.Element {
  return <V0AppFrame>{children}</V0AppFrame>;
}

