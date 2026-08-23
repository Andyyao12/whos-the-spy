import { PublicRoomState } from "@/lib/types";
import { StoredIdentity } from "@/lib/client";

export interface RoomCtx {
  code: string;
  state: PublicRoomState;
  identity: StoredIdentity;
  isHost: boolean;
  myId: string;
  refresh: () => Promise<void>;
}
