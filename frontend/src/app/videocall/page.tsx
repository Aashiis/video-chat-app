'use client';
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const VideoCallPage = () => {
    const searchParams = useSearchParams();
    const roomname = searchParams.get("roomname");
    const token = searchParams.get("token");
    const videoenable = searchParams.get('videoenable')

    const [userToken, setUserToken] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    // Handle WebSocket connection
    useEffect(() => {
        if (!token || !roomname) return;

        // Call the function to handle WebSocket connection
        handleWebSocketConnection(roomname, token);

    }, [token, roomname])



    const handleWebSocketConnection = (roomname: string, token: string) => {

        if (!token || !roomname) return;
        console.log('Connecting to WebSocket...');


        // Close connection if already exists
        if (ws.current) {
            ws.current.close();
        }

        // Creating new WebSocket connection
        const selectedFriendName = encodeURIComponent(roomname);
        ws.current = new WebSocket(
            `ws://localhost:8000/ws/chat/${selectedFriendName}/?token=${token}`
        );

        // -----------Open WebSocket connection-----------
        ws.current.onopen = () => {
            console.log('WebSocket Connected');
        };

        // ------------Handle incoming messages------------
        ws.current.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                handlingCallBasedOnMessageType(data);
            } catch (error) {
                console.log('An unknown error occured when parsing json message');
            }
        }



        // --------------ON CONNECTION CLOSE--------------
        ws.current.onclose = () => {
            console.log('WebSocket Disconnected');
        }



        // --------------ON WEBSOCKET ERRORS--------------
        ws.current.onerror = (error: Event) => {
            console.error('WebSocket Error:', error);
        };



        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }

    const handlingCallBasedOnMessageType = (data: any) => {
        switch (data.type) {
            case 'call_rejected':
                console.log('The call has been rejected', data);
                break;
            case 'call_accepted':
                
                break;
        
            default:
                break;
        }
    } 



    // ----------HANDLING DATA SENDING----------
    const sendData = (data: any) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not open. Cannot send data.');
            return;
        }

        try {
            ws.current.send(JSON.stringify(data));
            console.log('Data sent:', data);
        } catch (error) {
            console.error('Error sending data:', error);
        }
    }








    return (
        <>
            Friend's username: {roomname} <br />
            Video Call Page <br />
            <button className="bg-purple-500 text-white p-5 rounded-2xl hover:bg-purple-600" onClick={() => {
                const callType = videoenable == 'true' ? 'video' : 'audio';
                sendData({
                    type: 'call_request',
                    callType: callType,
                    message: 'Hello world frome chrome',
                });
            }}>Call</button>
        </>
    )
}

export default VideoCallPage;