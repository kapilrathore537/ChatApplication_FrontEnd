export class RoomRequest {
    senderId!: string;
    recipientId!: string;
    roomType!: any;
    participants: string[] = []
}