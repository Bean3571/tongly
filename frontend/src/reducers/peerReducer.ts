export interface PeerState {
  [key: string]: {
    peerId: string;
    userName?: string;
    stream?: MediaStream;
  };
}

type PeerAction =
  | {
      type: "ADD_PEER_STREAM";
      payload: { peerId: string; stream: MediaStream };
    }
  | {
      type: "REMOVE_PEER_STREAM";
      payload: { peerId: string };
    }
  | {
      type: "ADD_PEER_NAME";
      payload: { peerId: string; userName: string };
    }
  | {
      type: "ADD_ALL_PEERS";
      payload: { peers: PeerState };
    };

export const peersReducer = (state: PeerState, action: PeerAction): PeerState => {
  switch (action.type) {
    case "ADD_PEER_STREAM": {
      const { peerId, stream } = action.payload;
      return {
        ...state,
        [peerId]: {
          ...state[peerId],
          stream,
          peerId,
        },
      };
    }
    case "REMOVE_PEER_STREAM": {
      const { peerId } = action.payload;
      const { [peerId]: peerToRemove, ...rest } = state;
      return rest;
    }
    case "ADD_PEER_NAME": {
      const { peerId, userName } = action.payload;
      return {
        ...state,
        [peerId]: {
          ...state[peerId],
          userName,
          peerId,
        },
      };
    }
    case "ADD_ALL_PEERS": {
      return {
        ...state,
        ...action.payload.peers,
      };
    }
    default:
      return state;
  }
}; 