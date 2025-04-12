import { PeerState } from "./peerReducer";

export const addPeerStreamAction = (peerId: string, stream: MediaStream) => ({
  type: "ADD_PEER_STREAM" as const,
  payload: { peerId, stream },
});

export const removePeerStreamAction = (peerId: string) => ({
  type: "REMOVE_PEER_STREAM" as const,
  payload: { peerId },
});

export const addPeerNameAction = (peerId: string, userName: string) => ({
  type: "ADD_PEER_NAME" as const,
  payload: { peerId, userName },
});

export const addAllPeersAction = (peers: PeerState) => ({
  type: "ADD_ALL_PEERS" as const,
  payload: { peers },
}); 