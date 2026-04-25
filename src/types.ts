export interface UserProfile {
  id: string;
  email: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  createdAt: number;
}

export enum FileType {
  IMAGE = "image",
  PDF = "pdf",
}

export interface MessageAttachment {
  type: FileType;
  mimeType: string;
  data: string; // base64
  name: string;
}
