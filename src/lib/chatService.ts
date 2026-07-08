import { supabase } from "../supabaseClient";

export interface ChatMessage {
  id: string;
  userId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

const LOCAL_CHATS_KEY = "yarana_admin_chats_v2";

// Helper to get local fallback messages
function getLocalMessages(): ChatMessage[] {
  const stored = localStorage.getItem(LOCAL_CHATS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

// Helper to save local fallback messages
function saveLocalMessages(messages: ChatMessage[]) {
  localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(messages));
}

// Fetch all messages (for admin, fetches all; for user, filters by their email/ID)
export async function fetchChatMessages(userEmail?: string, isAdmin: boolean = false): Promise<ChatMessage[]> {
  try {
    // Try querying Supabase
    let query = supabase.from("admin_messages").select("*").order("created_at", { ascending: true });
    
    if (!isAdmin && userEmail) {
      query = query.or(`sender_email.eq.${userEmail},recipient_email.eq.${userEmail}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // If table doesn't exist or RLS issues, throw to trigger fallback
      throw error;
    }
    
    if (data) {
      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        senderEmail: item.sender_email,
        senderName: item.sender_name || "User",
        message: item.message,
        isAdmin: !!item.is_admin,
        createdAt: item.created_at
      }));
    }
  } catch (err: any) {
    console.warn("Supabase chat fetch failed or table 'admin_messages' not found. Using local fallback.", err.message);
  }
  
  // Local storage fallback
  const allLocal = getLocalMessages();
  if (isAdmin) {
    return allLocal;
  } else if (userEmail) {
    return allLocal.filter(m => m.senderEmail === userEmail || (m.isAdmin && m.userId === userEmail));
  }
  return [];
}

// Send a new chat message
export async function sendChatMessage(params: {
  userId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
}): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: crypto.randomUUID ? crypto.randomUUID() : "msg_" + Math.random().toString(36).substring(2, 11),
    userId: params.userId,
    senderEmail: params.senderEmail,
    senderName: params.senderName,
    message: params.message,
    isAdmin: params.isAdmin,
    createdAt: new Date().toISOString()
  };

  try {
    // Try to insert in Supabase
    const { error } = await supabase.from("admin_messages").insert({
      id: newMessage.id,
      user_id: params.userId,
      sender_email: params.senderEmail,
      sender_name: params.senderName,
      message: params.message,
      is_admin: params.isAdmin,
      recipient_email: params.isAdmin ? params.userId : "komailali116@gmail.com", // Recipient is the other party
      created_at: newMessage.createdAt
    });

    if (error) {
      throw error;
    }
    return newMessage;
  } catch (err: any) {
    console.warn("Supabase chat insert failed, saving to local fallback.", err.message);
  }

  // Local storage fallback
  const current = getLocalMessages();
  current.push(newMessage);
  saveLocalMessages(current);
  return newMessage;
}
