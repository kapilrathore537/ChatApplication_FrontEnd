import { AgencyChatUsers } from "../Models/AgencyChatUsers";
import { MessageResponse } from "./MessageResponse";

export class ChatRoomResponse {
	roomId!: string;
	roomName!: string;
	messageList = new Map<string, MessageResponse[]>();
	roomType!: string;
	participants: AgencyChatUsers[] = [];
	isTyping: boolean = false
	// messages: any
}