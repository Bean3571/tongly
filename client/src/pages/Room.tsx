import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShareScreenButton } from "../components/ShareScreeenButton";
import { ChatButton } from "../components/ChatButton";
import { VideoPlayer } from "../components/VideoPlayer";
import { PeerState } from "../reducers/peerReducer";
import { RoomContext } from "../context/RoomContext";
import { Chat } from "../components/chat/Chat";
import { NameInput } from "../common/Name";
import { ws } from "../ws";
import { UserContext } from "../context/UserContext";
import { ChatContext } from "../context/ChatContext";
import { ClipboardCopyIcon } from "@heroicons/react/outline";

export const Room = () => {
    const { id } = useParams();
    const { stream, screenStream, peers, shareScreen, screenSharingId, setRoomId } =
        useContext(RoomContext);
    const { userName, userId } = useContext(UserContext);
    const { toggleChat, chat } = useContext(ChatContext);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (stream)
            ws.emit("join-room", { roomId: id, peerId: userId, userName });
    }, [id, userId, stream, userName]);

    useEffect(() => {
        setRoomId(id || "");
    }, [id, setRoomId]);

    const screenSharingVideo =
        screenSharingId === userId
            ? screenStream
            : peers[screenSharingId]?.stream;

    const { [screenSharingId]: sharing, ...peersToShow } = peers;
    
    const copyRoomId = () => {
        navigator.clipboard.writeText(id || "");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };
    
    return (
        <div className="flex flex-col min-h-screen">
            <div className="bg-red-500 p-4 text-white flex justify-between items-center">
                <div>Room Session</div>
                <div className="flex items-center space-x-2">
                    <div className="text-sm bg-white bg-opacity-20 rounded px-3 py-1">
                        {id}
                    </div>
                    <button 
                        onClick={copyRoomId}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                        title="Copy Room ID"
                    >
                        <ClipboardCopyIcon className="h-5 w-5" />
                    </button>
                    {copySuccess && (
                        <div className="text-xs bg-green-500 rounded px-2 py-1">
                            Copied!
                        </div>
                    )}
                </div>
            </div>
            <div className="flex grow">
                {screenSharingVideo && (
                    <div className="w-4/5 pr-4">
                        <VideoPlayer stream={screenSharingVideo} />
                    </div>
                )}
                <div
                    className={`grid gap-4 ${
                        screenSharingVideo ? "w-1/5 grid-col-1" : "grid-cols-4"
                    }`}
                >
                    {screenSharingId !== userId && (
                        <div>
                            <VideoPlayer stream={stream} />
                            <NameInput />
                        </div>
                    )}

                    {Object.values(peersToShow as PeerState)
                        .filter((peer) => !!peer.stream)
                        .map((peer) => (
                            <div key={peer.peerId}>
                                <VideoPlayer stream={peer.stream} />
                                <div>{peer.userName}</div>
                            </div>
                        ))}
                </div>
                {chat.isChatOpen && (
                    <div className="border-l-2 pb-28">
                        <Chat />
                    </div>
                )}
            </div>
            <div className="h-28 fixed bottom-0 p-6 w-full flex items-center justify-center border-t-2 bg-white">
                <ShareScreenButton onClick={shareScreen} />
                <ChatButton onClick={toggleChat} />
            </div>
        </div>
    );
};
