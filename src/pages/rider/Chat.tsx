import { ChatView } from '@/components/chat/ChatView';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function RiderChat() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rider')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold">Messages</h1>
      </div>
      <ChatView className="flex-1" />
    </div>
  );
}
