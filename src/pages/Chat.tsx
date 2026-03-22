import { ChatView } from '@/components/chat/ChatView';
import { BottomNav } from '@/components/store/BottomNav';

export default function Chat() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <ChatView className="flex-1" />
      <BottomNav />
    </div>
  );
}
