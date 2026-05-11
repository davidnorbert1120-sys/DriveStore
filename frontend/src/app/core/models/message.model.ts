export interface Message {
  id: number;
  senderEmail: string;
  senderUserId: number;
  productId: number;
  content: string;
  sentAt: string;
}

export interface ConversationPartner {
  userId: number;
  email: string;
}
