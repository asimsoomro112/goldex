import React, { useState } from 'react';
import { MessageSquare, HelpCircle, Send, PlusCircle, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { createSupportTicket, addTicketReply, useUserTickets, SupportTicket } from '@/lib/dashboardData';
import { Card, Badge, Button } from '@/components/ui';

export function SupportPage() {
  const { user } = useAuth();
  const { tickets, loading } = useUserTickets(user?.uid);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await createSupportTicket(user.uid, user.displayName || 'User', user.email || '', subject.trim(), message.trim());
      toast.success('Support ticket created successfully!');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Could not submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setReplySubmitting(true);
    try {
      await addTicketReply(selectedTicket.id, 'user', replyMessage.trim());
      toast.success('Reply submitted!');
      setReplyMessage('');
      const updatedReplies = [
        ...(selectedTicket.replies || []),
        { sender: 'user' as const, message: replyMessage.trim(), createdAt: new Date() }
      ];
      setSelectedTicket({
        ...selectedTicket,
        replies: updatedReplies,
        status: 'open'
      });
    } catch (error: any) {
      toast.error(error.message || 'Could not send reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          Live Compliance & Support Desk
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Open a support ticket or follow up on existing inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Create Ticket Form */}
        <div className="lg:col-span-5">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
              <PlusCircle className="w-4.5 h-4.5 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Create Support Ticket</h2>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Deposit Inquiry / Account Verification"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or upload details here..."
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-850 dark:text-neutral-200 focus:border-brand-gold resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold py-3 text-xs rounded-2xl"
              >
                {submitting ? 'Submitting request...' : 'Submit Support Ticket'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Tickets History List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/20 flex justify-between items-center">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-[#D4AF37]" />
                Your Support Tickets
              </h2>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400">Loading support history...</div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <HelpCircle className="w-10 h-10 text-neutral-300 dark:text-neutral-800" />
                <p className="text-xs text-neutral-400">No support tickets submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-y-auto max-h-[500px]">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-5 hover:bg-neutral-50 dark:hover:bg-neutral-950/40 transition-colors flex items-start justify-between gap-4 ${
                      selectedTicket?.id === ticket.id ? 'bg-neutral-50/80 dark:bg-neutral-950/20' : ''
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-100 truncate">{ticket.subject}</h4>
                      </div>
                      <p className="text-[11px] text-neutral-450 truncate leading-relaxed">{ticket.message}</p>
                      <span className="text-[9px] text-neutral-400 block font-mono">
                        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <Badge 
                        variant={ticket.status === 'open' ? 'warning' : 'success'}
                        text={ticket.status === 'open' ? 'PENDING REPLY' : 'RESOLVED'}
                        className="text-[8px] py-0 px-2 font-bold"
                      />
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="text-[9px] text-[#D4AF37] font-semibold">
                          {ticket.replies.length} replies
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Ticket Details / Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="max-w-2xl w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 flex flex-col max-h-[85vh] shadow-2xl relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1 pb-4 border-b border-neutral-100 dark:border-neutral-800/60 pr-10">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{selectedTicket.subject}</h3>
                <Badge 
                  variant={selectedTicket.status === 'open' ? 'warning' : 'success'}
                  text={selectedTicket.status === 'open' ? 'OPEN' : 'RESOLVED'}
                  className="text-[8px] py-0.5 px-2 font-bold uppercase"
                />
              </div>
              <p className="text-[10px] text-neutral-400">Created by {selectedTicket.name}</p>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-2 min-h-[300px] max-h-[50vh] hide-scrollbar">
              {/* Original Inquiry */}
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="rounded-2xl rounded-tl-none bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-850 p-4 text-xs text-neutral-850 dark:text-neutral-200 leading-relaxed shadow-sm">
                  <p className="text-[9px] text-[#D4AF37] font-bold mb-1 uppercase tracking-wider">Original Inquiry</p>
                  {selectedTicket.message}
                </div>
                <span className="text-[9px] text-neutral-400 mt-1 ml-1 font-mono">
                  {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                </span>
              </div>

              {/* Replies */}
              {selectedTicket.replies?.map((reply, index) => {
                const isAdmin = reply.sender === 'admin';
                return (
                  <div key={index} className={`flex flex-col max-w-[85%] ${isAdmin ? 'ml-auto items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                      isAdmin 
                        ? 'rounded-tr-none bg-neutral-950 dark:bg-neutral-950 border border-[#D4AF37]/30 text-neutral-850 dark:text-neutral-200' 
                        : 'rounded-tl-none bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-850 text-neutral-850 dark:text-neutral-200'
                    }`}>
                      <p className={`text-[9px] font-bold mb-1 uppercase tracking-wider ${isAdmin ? 'text-[#D4AF37]' : 'text-neutral-450'}`}>
                        {isAdmin ? '🛡️ GoldEx Support Desk' : selectedTicket.name}
                      </p>
                      {reply.message}
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1 mx-1 font-mono">
                      {reply.createdAt?.toDate 
                        ? reply.createdAt.toDate().toLocaleString() 
                        : reply.createdAt?.toLocaleString 
                        ? reply.createdAt.toLocaleString() 
                        : 'Just now'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center gap-3">
              <input
                type="text"
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type support reply..."
                disabled={replySubmitting}
                className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-850 dark:text-neutral-200 focus:outline-none focus:border-brand-gold transition-colors"
              />
              <Button
                type="submit"
                disabled={replySubmitting || !replyMessage.trim()}
                className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 h-10 px-4 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
