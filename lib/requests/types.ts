export type RequestType = "SUPPORT" | "LEAVE" | "CLAIM";
export type RequestStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";

export type RequestRow = {
  id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: string;

  startDate?: string | null;
  endDate?: string | null;
  amount?: string | number | null;
  currency?: string | null;
};

export type CreateRequestPayload = {
  type: RequestType;
  title: string;
  description: string | null;

  startDate?: string | null;
  endDate?: string | null;
  amount?: number | null;
  currency?: string | null;
};

export type AdminRequestRow = {
  id: string
  title: string
  description: string | null
  type: RequestType
  status: RequestStatus
  createdAt: string

  user: {
    name: string | null
    email: string | null
  }
}