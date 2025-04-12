import { useState, useEffect, useContext } from "react";
import { NameInput } from "../common/Name";
import { Button } from "./common/Button";
import { ws } from "../ws";
import { RoomContext } from "../context/RoomContext";
import { useNavigate } from "react-router-dom";

export const Join: React.FC = () => {
    const { setRoomId } = useContext(RoomContext);
    const [joinRoomId, setJoinRoomId] = useState("");
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
    const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
    const navigate = useNavigate();

    // Get available media devices
    useEffect(() => {
        async function getDevices() {
            try {
                // Request permission to get devices
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(device => device.kind === "videoinput");
                const audioInputs = devices.filter(device => device.kind === "audioinput");
                
                setVideoDevices(videoInputs);
                setAudioDevices(audioInputs);
                
                // Set defaults if available
                if (videoInputs.length > 0) {
                    setSelectedVideoDevice(videoInputs[0].deviceId);
                }
                if (audioInputs.length > 0) {
                    setSelectedAudioDevice(audioInputs[0].deviceId);
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
            }
        }
        
        getDevices();
    }, []);

    // Store selected devices in sessionStorage
    useEffect(() => {
        if (selectedVideoDevice) {
            sessionStorage.setItem("selectedVideoDevice", selectedVideoDevice);
        }
        if (selectedAudioDevice) {
            sessionStorage.setItem("selectedAudioDevice", selectedAudioDevice);
        }
    }, [selectedVideoDevice, selectedAudioDevice]);

    const createRoom = () => {
        ws.emit("create-room");
    };

    const joinRoom = () => {
        if (joinRoomId.trim()) {
            setRoomId(joinRoomId);
            ws.emit("join-room", { roomId: joinRoomId });
            navigate(`/room/${joinRoomId}`);
        }
    };

    return (
        <div className="flex flex-col space-y-4 w-full max-w-md">
            <NameInput />
            
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                    Camera
                </label>
                <select 
                    className="border rounded-md p-2 h-10"
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                >
                    {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                    Microphone
                </label>
                <select 
                    className="border rounded-md p-2 h-10"
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                >
                    {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="flex flex-col mt-4">
                <Button onClick={createRoom} className="py-2 px-8 text-xl mb-2">
                    Start new meeting
                </Button>
                
                <div className="flex items-center my-2">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-gray-500">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <div className="flex space-x-2">
                    <input
                        className="border rounded-md p-2 h-10 flex-grow"
                        placeholder="Enter room ID"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                    />
                    <Button 
                        onClick={joinRoom} 
                        className="py-2 px-4"
                        disabled={!joinRoomId.trim()}
                    >
                        Join
                    </Button>
                </div>
            </div>
        </div>
    );
};
