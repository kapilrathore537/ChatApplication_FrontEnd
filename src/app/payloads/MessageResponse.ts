export class MessageResponse {
	messageId!: string;
	senderId!: string;
	attachments!: string[];
	content!: string;
	localTime!: any;
	isSeen!: boolean
	isRecieved!: boolean
}