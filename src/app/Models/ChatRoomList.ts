import { AgencyChatUsers } from "./AgencyChatUsers";

export class ChatRoomList {
    roomId: string = '';
    roomName: string = '';
    roomType: string = '';
    participants: AgencyChatUsers[] = []
    unSeenMessageCount: number = 0;
    lastMessage: string = '';
    lastMessageTime: string = ''
    isTyping!: boolean
}