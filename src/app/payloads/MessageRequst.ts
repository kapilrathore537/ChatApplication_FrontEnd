export class MessageRequest {
	roomId!: string;
	senderId!: string;
	recipientId!: string;
	content!: string;
	attachments: string[] = [];
	participants: string[] = []; // List of user IDs
}