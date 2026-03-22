import { ChatView } from '@/components/chat/ChatView';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';

export default function AdminChat() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <ChatView className="flex-1" />
      <AdminBottomNav />
    </div>
  );
}
